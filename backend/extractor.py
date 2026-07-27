"""
Ghidra-AI — Binary Extractor Module
====================================
Uses PyGhidra to decompile binary executables and extract pseudo-C code,
function names, and entry addresses. Falls back to demo mode when Ghidra
is not installed.
"""

import os
import json
import hashlib
from typing import Dict, Any

# ---------------------------------------------------------------------------
# Demo / sample data for development without Ghidra
# ---------------------------------------------------------------------------

DEMO_FUNCTIONS: Dict[str, Dict[str, Any]] = {
    "main": {
        "name": "main",
        "address": "0x00401000",
        "raw_code": """int main(int argc, char **argv) {
    char buffer[64];
    int iVar1;
    undefined8 uVar2;
    
    if (argc < 2) {
        puts("Usage: program <input>");
        return 1;
    }
    
    strcpy(buffer, argv[1]);  // potential buffer overflow
    
    iVar1 = authenticate_user(buffer);
    if (iVar1 != 0) {
        uVar2 = process_request(buffer, (ulong)(uint)iVar1);
        printf("Result: %s\\n", uVar2);
    }
    else {
        fprintf(stderr, "Authentication failed for: %s\\n", buffer);  // format string info leak
    }
    
    return 0;
}""",
    },
    "authenticate_user": {
        "name": "authenticate_user",
        "address": "0x00401100",
        "raw_code": """int authenticate_user(char *param_1) {
    int iVar1;
    char *pcVar2;
    char acStack_88[64];
    char *local_48;
    
    local_48 = "admin:supersecret123";  // hardcoded credential
    
    __stack_chk_guard;
    pcVar2 = strtok(param_1, ":");
    if (pcVar2 == (char *)0x0) {
        return 0;
    }
    
    strncpy(acStack_88, pcVar2, 0x40);
    pcVar2 = strtok((char *)0x0, ":");
    
    iVar1 = strcmp(acStack_88, "admin");
    if (iVar1 == 0) {
        iVar1 = strcmp(pcVar2, "supersecret123");
        if (iVar1 == 0) {
            return 1;
        }
    }
    
    __stack_chk_fail();
    return 0;
}""",
    },
    "process_request": {
        "name": "process_request",
        "address": "0x00401250",
        "raw_code": """undefined8 process_request(char *param_1, ulong param_2) {
    undefined8 uVar1;
    void *pvVar2;
    size_t sVar3;
    char *__s;
    
    sVar3 = strlen(param_1);
    pvVar2 = malloc(sVar3 + 0x100);
    if (pvVar2 == (void *)0x0) {
        return 0;
    }
    
    sprintf((char *)pvVar2, "Processing request from user: %s with level %lu", param_1, param_2);
    
    __s = getenv("OUTPUT_FILE");
    if (__s != (char *)0x0) {
        FILE *pFVar3 = fopen(__s, "w");
        if (pFVar3 != (FILE *)0x0) {
            fputs((char *)pvVar2, pFVar3);
            fclose(pFVar3);
        }
    }
    
    uVar1 = *(undefined8 *)pvVar2;
    return uVar1;
}""",
    },
    "init_config": {
        "name": "init_config",
        "address": "0x00401400",
        "raw_code": """void init_config(void) {
    undefined8 uVar1;
    int iVar2;
    FILE *pFVar3;
    char acStack_108[256];
    
    pFVar3 = fopen("/etc/app/config.dat", "rb");
    if (pFVar3 == (FILE *)0x0) {
        pFVar3 = fopen("./config.dat", "rb");
        if (pFVar3 == (FILE *)0x0) {
            puts("Warning: No config found, using defaults");
            *(undefined4 *)&DAT_00604000 = 0x1f90;
            *(undefined4 *)&DAT_00604004 = 0xa;
            return;
        }
    }
    
    iVar2 = fread(acStack_108, 1, 0x100, pFVar3);
    if (iVar2 < 4) {
        fclose(pFVar3);
        return;
    }
    
    *(int *)&DAT_00604000 = *(int *)acStack_108;
    *(int *)&DAT_00604004 = *(int *)(acStack_108 + 4);
    fclose(pFVar3);
    return;
}""",
    },
    "compute_checksum": {
        "name": "compute_checksum",
        "address": "0x00401580",
        "raw_code": """uint compute_checksum(byte *param_1, int param_2) {
    uint uVar1;
    int iVar2;
    uint local_c;
    
    local_c = 0x5bd1e995;
    iVar2 = 0;
    
    while (iVar2 < param_2) {
        uVar1 = (uint)param_1[iVar2];
        local_c = local_c ^ uVar1 << ((byte)(iVar2 & 3) * 8 & 0x1f);
        local_c = local_c * 0x5bd1e995;
        local_c = local_c ^ local_c >> 0xd;
        iVar2 = iVar2 + 1;
    }
    
    local_c = local_c ^ local_c >> 0xf;
    return local_c;
}""",
    },
    "handle_signal": {
        "name": "handle_signal",
        "address": "0x00401680",
        "raw_code": """void handle_signal(int param_1) {
    char acStack_48[56];
    
    if (param_1 == 0xb) {
        snprintf(acStack_48, 0x38, "Caught SIGSEGV at address %p", (void *)0x0);
        syslog(3, acStack_48);
    }
    else if (param_1 == 2) {
        puts("Interrupt received, shutting down...");
        *(undefined4 *)&DAT_00604010 = 1;
    }
    else if (param_1 == 0xf) {
        puts("Termination requested");
        *(undefined4 *)&DAT_00604010 = 1;
    }
    
    return;
}""",
    },
}


def _ghidra_available() -> bool:
    """Check if Ghidra installation is configured and accessible."""
    ghidra_dir = os.environ.get("GHIDRA_INSTALL_DIR", "")
    return bool(ghidra_dir) and os.path.isdir(ghidra_dir)


def extract_functions_demo(binary_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Return realistic sample decompiled functions for demo/dev mode.
    Uses the filename to generate a deterministic subset for variety.
    """
    file_hash = hashlib.md5(binary_path.encode()).hexdigest()
    result = {}
    for name, func_data in DEMO_FUNCTIONS.items():
        result[name] = {
            "name": func_data["name"],
            "address": func_data["address"],
            "raw_code": func_data["raw_code"],
            "size": len(func_data["raw_code"]),
            "binary": os.path.basename(binary_path),
        }
    return result


def extract_functions_ghidra(binary_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Use PyGhidra to perform headless decompilation of a binary.
    Runs in a completely separate subprocess to avoid JPype/macOS AWT thread deadlocks!
    """
    import subprocess
    import sys
    
    worker_script = os.path.join(os.path.dirname(__file__), "ghidra_worker.py")
    
    try:
        # Run worker as a subprocess to keep PyGhidra on a clean main thread
        result = subprocess.run(
            [sys.executable, worker_script, binary_path],
            capture_output=True,
            text=True,
            check=True
        )
        
        output = result.stdout
        
        if "---JSON_START---" in output and "---JSON_END---" in output:
            json_str = output.split("---JSON_START---")[1].split("---JSON_END---")[0].strip()
            data = json.loads(json_str)
            
            if "error" in data:
                raise RuntimeError(f"PyGhidra Worker Error: {data['error']}\\n{data.get('traceback', '')}")
                
            return data
        else:
            raise RuntimeError(f"Worker did not return JSON. Output: {output}\\nStderr: {result.stderr}")
            
    except subprocess.CalledProcessError as e:
        raise RuntimeError(
            f"PyGhidra worker process failed (exit {e.returncode}).\\n"
            f"Stdout: {e.stdout}\\nStderr: {e.stderr}\\n"
            f"Set GHIDRA_INSTALL_DIR or ensure pyghidra is installed."
        )


def extract_functions(binary_path: str) -> Dict[str, Dict[str, Any]]:
    """
    Main entry point: extracts decompiled functions from a binary.
    Automatically selects PyGhidra (production) or demo mode (development).
    """
    if _ghidra_available():
        return extract_functions_ghidra(binary_path)
    else:
        print("[Extractor] Ghidra not available — using DEMO mode with sample functions")
        return extract_functions_demo(binary_path)
