"""
Ghidra-AI — FastAPI Server
============================
CORS-enabled REST API for binary upload, decompilation, Paritok compression,
LLM analysis, telemetry, and Ghidra annotation script export.
"""

import os
import uuid
import time
import json
import shutil
import tempfile
import traceback
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

from extractor import extract_functions
from compressor import clean_decompiled_code, compress_via_paritok, calculate_telemetry
from analyzer import analyze_function

# ---------------------------------------------------------------------------
# In-memory job store
# ---------------------------------------------------------------------------

jobs: Dict[str, Dict[str, Any]] = {}

# Cumulative telemetry across all jobs
global_telemetry = {
    "total_raw_tokens": 0,
    "total_compressed_tokens": 0,
    "total_usd_saved": 0.0,
    "total_functions_analyzed": 0,
    "total_vulnerabilities_found": 0,
}

# Upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class AnalyzeRequest(BaseModel):
    job_id: str
    function_name: str


class AnalyzeAllRequest(BaseModel):
    job_id: str


class JobStatus(BaseModel):
    job_id: str
    status: str
    progress: Optional[str] = None
    function_count: int = 0
    functions: Optional[List[str]] = None
    error: Optional[str] = None


class TelemetryResponse(BaseModel):
    total_raw_tokens: int
    total_compressed_tokens: int
    compression_ratio_pct: float
    total_usd_saved: float
    total_functions_analyzed: int
    total_vulnerabilities_found: int


# ---------------------------------------------------------------------------
# Background task: extract functions from binary
# ---------------------------------------------------------------------------

def _run_extraction(job_id: str, binary_path: str):
    """Background task to extract functions from a binary."""
    try:
        jobs[job_id]["status"] = "extracting"
        jobs[job_id]["progress"] = "Running Ghidra decompilation..."

        functions = extract_functions(binary_path)

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["progress"] = f"Extracted {len(functions)} functions"
        jobs[job_id]["functions"] = functions
        jobs[job_id]["function_count"] = len(functions)
        jobs[job_id]["analyses"] = {}

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)
        jobs[job_id]["progress"] = f"Extraction failed: {e}"
        traceback.print_exc()


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("=" * 60)
    print("  Ghidra-AI Backend Server")
    print("=" * 60)
    ghidra_dir = os.environ.get("GHIDRA_INSTALL_DIR", "")
    paritok_url = os.environ.get("PARITOK_API_URL", "")
    llm_provider = os.environ.get("LLM_PROVIDER", "groq")
    print(f"  Ghidra:   {'✓ ' + ghidra_dir if ghidra_dir else '✗ DEMO MODE'}")
    print(f"  Paritok:  {'✓ ' + paritok_url if paritok_url else '✗ PASSTHROUGH'}")
    print(f"  LLM:      {llm_provider}")
    print("=" * 60)
    yield
    # Cleanup uploads on shutdown
    if os.path.exists(UPLOAD_DIR):
        shutil.rmtree(UPLOAD_DIR, ignore_errors=True)


app = FastAPI(
    title="Ghidra-AI",
    description="AI-powered reverse engineering analysis platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    return {"service": "Ghidra-AI", "version": "1.0.0", "status": "running"}


@app.post("/api/upload")
async def upload_binary(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
):
    """Upload a binary file and start background decompilation."""
    # Validate file extension
    allowed_extensions = {".elf", ".exe", ".bin", ".so", ".dll", ".o", ".out", ""}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed_extensions and file.filename:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {', '.join(allowed_extensions)}",
        )

    # Save uploaded file
    job_id = str(uuid.uuid4())[:8]
    job_dir = os.path.join(UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)

    filename = file.filename or f"binary_{job_id}"
    binary_path = os.path.join(job_dir, filename)

    with open(binary_path, "wb") as f:
        content = await file.read()
        f.write(content)

    # Initialize job
    jobs[job_id] = {
        "job_id": job_id,
        "status": "pending",
        "progress": "Upload complete, queuing extraction...",
        "binary_path": binary_path,
        "filename": filename,
        "file_size": len(content),
        "created_at": time.time(),
        "functions": {},
        "function_count": 0,
        "analyses": {},
        "telemetry": {},
    }

    # Start background extraction
    background_tasks.add_task(_run_extraction, job_id, binary_path)

    return {
        "job_id": job_id,
        "filename": filename,
        "file_size": len(content),
        "status": "pending",
        "message": "Binary uploaded. Decompilation started in background.",
    }


@app.get("/api/status/{job_id}")
async def get_job_status(job_id: str):
    """Poll job progress."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    job = jobs[job_id]
    function_names = list(job.get("functions", {}).keys())

    # Build per-function analysis status
    analyses = job.get("analyses", {})
    function_details = []
    for fname in function_names:
        func_data = job["functions"][fname]
        analysis = analyses.get(fname)
        vuln_count = len(analysis.get("vulnerabilities", [])) if analysis else 0
        risk = "none"
        if analysis:
            if vuln_count == 0:
                risk = "low"
            elif vuln_count <= 2:
                risk = "medium"
            else:
                risk = "high"

        function_details.append({
            "name": fname,
            "address": func_data.get("address", ""),
            "size": func_data.get("size", 0),
            "analyzed": fname in analyses,
            "risk": risk,
            "vulnerability_count": vuln_count,
        })

    return {
        "job_id": job_id,
        "status": job["status"],
        "progress": job.get("progress", ""),
        "function_count": job.get("function_count", 0),
        "functions": function_details,
        "filename": job.get("filename", ""),
        "file_size": job.get("file_size", 0),
        "error": job.get("error"),
    }


@app.post("/api/analyze")
async def analyze_single_function(req: AnalyzeRequest):
    """Analyze a single function: compress via Paritok, then LLM analysis."""
    if req.job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id} not found")

    job = jobs[req.job_id]

    if job["status"] != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Job is not ready for analysis. Current status: {job['status']}",
        )

    functions = job.get("functions", {})
    if req.function_name not in functions:
        raise HTTPException(
            status_code=404,
            detail=f"Function '{req.function_name}' not found in job {req.job_id}",
        )

    func_data = functions[req.function_name]
    raw_code = func_data["raw_code"]

    # Step 1: Clean the code
    cleaned_code = clean_decompiled_code(raw_code)

    # Step 2: Compress via Paritok
    compression_result = compress_via_paritok(cleaned_code)

    # Step 3: Analyze with LLM
    analysis = analyze_function(
        compression_result["compressed_text"],
        req.function_name,
    )

    # Step 4: Calculate telemetry
    telemetry = calculate_telemetry(
        compression_result["input_tokens"],
        compression_result["output_tokens"],
    )

    # Update global telemetry
    global_telemetry["total_raw_tokens"] += compression_result["input_tokens"]
    global_telemetry["total_compressed_tokens"] += compression_result["output_tokens"]
    global_telemetry["total_usd_saved"] += telemetry["usd_saved"]
    global_telemetry["total_functions_analyzed"] += 1
    global_telemetry["total_vulnerabilities_found"] += len(analysis.get("vulnerabilities", []))

    # Store analysis in job
    job["analyses"][req.function_name] = analysis
    job["telemetry"][req.function_name] = {
        "compression": compression_result,
        "savings": telemetry,
    }

    return {
        "function_name": req.function_name,
        "original_code": raw_code,
        "cleaned_code": cleaned_code,
        "compressed_code": compression_result["compressed_text"],
        "compression": {
            "input_tokens": compression_result["input_tokens"],
            "output_tokens": compression_result["output_tokens"],
            "ratio": compression_result["compression_ratio"],
            "mode": compression_result.get("mode", "unknown"),
        },
        "analysis": analysis,
        "telemetry": telemetry,
    }


@app.post("/api/analyze/all")
async def analyze_all_functions(req: AnalyzeAllRequest):
    """Batch-analyze all functions in a job."""
    if req.job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {req.job_id} not found")

    job = jobs[req.job_id]
    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Job extraction not completed")

    results = {}
    for func_name in job.get("functions", {}):
        if func_name in job.get("analyses", {}):
            # Skip already analyzed
            continue

        try:
            # Reuse single analysis endpoint logic
            single_req = AnalyzeRequest(job_id=req.job_id, function_name=func_name)
            result = await analyze_single_function(single_req)
            results[func_name] = result
        except Exception as e:
            results[func_name] = {"error": str(e)}

    return {
        "job_id": req.job_id,
        "analyzed_count": len(results),
        "results": results,
    }


@app.get("/api/telemetry")
async def get_telemetry():
    """Return cumulative telemetry across all jobs."""
    raw = global_telemetry["total_raw_tokens"]
    compressed = global_telemetry["total_compressed_tokens"]
    ratio = ((raw - compressed) / raw * 100) if raw > 0 else 0.0

    return {
        "total_raw_tokens": raw,
        "total_compressed_tokens": compressed,
        "compression_ratio_pct": round(ratio, 1),
        "total_usd_saved": round(global_telemetry["total_usd_saved"], 4),
        "total_functions_analyzed": global_telemetry["total_functions_analyzed"],
        "total_vulnerabilities_found": global_telemetry["total_vulnerabilities_found"],
    }


@app.get("/api/export/{job_id}", response_class=PlainTextResponse)
async def export_ghidra_script(job_id: str):
    """Generate a Ghidra Python annotation script to apply renames."""
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    job = jobs[job_id]
    analyses = job.get("analyses", {})

    if not analyses:
        raise HTTPException(status_code=400, detail="No analyses available to export")

    # Build Ghidra script
    script_lines = [
        '"""',
        f'Ghidra-AI Auto-Generated Annotation Script',
        f'Job ID: {job_id}',
        f'Functions: {len(analyses)}',
        '"""',
        '',
        'from ghidra.program.model.symbol import SourceType',
        'from ghidra.app.cmd.label import RenameLabelCmd',
        '',
        'fm = currentProgram.getFunctionManager()',
        'listing = currentProgram.getListing()',
        '',
    ]

    for func_name, analysis in analyses.items():
        suggested_name = analysis.get("suggested_function_name", func_name)
        renames = analysis.get("variable_renames", {})
        purpose = analysis.get("purpose_summary", "")
        func_data = job["functions"].get(func_name, {})
        address = func_data.get("address", "")

        script_lines.append(f'# --- {func_name} -> {suggested_name} ---')

        if address:
            script_lines.append(f'addr = toAddr("{address}")')
            script_lines.append(f'func = fm.getFunctionAt(addr)')
            script_lines.append(f'if func is not None:')
            script_lines.append(f'    func.setName("{suggested_name}", SourceType.USER_DEFINED)')
            script_lines.append(f'    func.setComment("{purpose[:200]}")')

            # Variable renames
            if renames:
                script_lines.append(f'    # Variable renames')
                script_lines.append(f'    variables = func.getAllVariables()')
                script_lines.append(f'    rename_map = {json.dumps(renames)}')
                script_lines.append(f'    for var in variables:')
                script_lines.append(f'        if var.getName() in rename_map:')
                script_lines.append(f'            var.setName(rename_map[var.getName()], SourceType.USER_DEFINED)')

            script_lines.append(f'    print("Renamed: {func_name} -> {suggested_name}")')
            script_lines.append(f'else:')
            script_lines.append(f'    print("WARNING: Function not found at {address}")')

        script_lines.append('')

    script_lines.append('print("Ghidra-AI annotations applied successfully!")')

    return "\n".join(script_lines)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host=host, port=port, reload=True)
