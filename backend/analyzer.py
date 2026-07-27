"""
Ghidra-AI — LLM Reverse-Engineering Analyzer
==============================================
Sends compressed decompiled code to an LLM (Groq or OpenAI) for semantic
analysis including function purpose, vulnerability detection, and variable
renaming suggestions. Enforces structured JSON output.
"""

import os
import json
from typing import Dict, Any, Optional

SYSTEM_PROMPT = """You are a senior reverse engineer with 20+ years of experience analyzing compiled binaries. You are given decompiled pseudo-C code extracted from a binary executable via Ghidra.

Your task is to analyze the function and provide:
1. A descriptive function name that captures its true purpose
2. A clear summary of what the function does at a high level  
3. Meaningful variable renames (map cryptic Ghidra names to descriptive names)
4. Security vulnerabilities (buffer overflows, format string bugs, hardcoded secrets, use-after-free, integer overflows, command injection, path traversal, etc.)
5. A confidence score (0.0-1.0) reflecting how certain you are of your analysis

CRITICAL RULES:
- You MUST respond with valid JSON only, no markdown formatting, no code fences
- Identify ALL security vulnerabilities, even subtle ones
- For variable renames, only rename Ghidra-generated names (uVar1, iVar2, param_1, acStack_*, local_*, pcVar*, etc.)
- Be specific about vulnerability types and locations
- Confidence should be lower for obfuscated or very short functions

Response JSON schema:
{
    "suggested_function_name": "string - descriptive snake_case name",
    "purpose_summary": "string - 2-4 sentence high-level description",
    "variable_renames": {"old_name": "new_name"},
    "vulnerabilities": ["string - specific vulnerability description"],
    "confidence_score": 0.95
}"""


def _parse_llm_response(raw_text: str) -> Dict[str, Any]:
    """Parse and validate LLM JSON response, handling common formatting issues."""
    text = raw_text.strip()

    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last lines (code fences)
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines).strip()

    try:
        result = json.loads(text)
    except json.JSONDecodeError:
        # Try to extract JSON from the response
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            result = json.loads(text[start:end])
        else:
            raise ValueError(f"Could not parse LLM response as JSON: {text[:200]}")

    # Validate required fields
    required = ["suggested_function_name", "purpose_summary", "variable_renames",
                "vulnerabilities", "confidence_score"]
    for field in required:
        if field not in result:
            result[field] = {
                "suggested_function_name": "unknown_function",
                "purpose_summary": "Analysis incomplete",
                "variable_renames": {},
                "vulnerabilities": [],
                "confidence_score": 0.0,
            }.get(field)

    # Ensure correct types
    if not isinstance(result["variable_renames"], dict):
        result["variable_renames"] = {}
    if not isinstance(result["vulnerabilities"], list):
        result["vulnerabilities"] = [str(result["vulnerabilities"])]
    if not isinstance(result["confidence_score"], (int, float)):
        result["confidence_score"] = 0.5

    return result


def analyze_with_groq(
    code: str,
    function_name: str,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Analyze function using Groq's llama-3.3-70b-versatile model."""
    from groq import Groq

    api_key = api_key or os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set")

    client = Groq(api_key=api_key)

    user_message = f"""Analyze this decompiled function named `{function_name}`:

```c
{code}
```

Provide your analysis as a JSON object following the schema in your instructions."""

    model = os.environ.get("MODEL", "llama-3.3-70b-versatile")
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=2048,
    )

    raw_text = response.choices[0].message.content
    result = _parse_llm_response(raw_text)

    # Add metadata
    result["_meta"] = {
        "model": model,
        "provider": "groq",
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        },
    }

    return result


def analyze_with_openai(
    code: str,
    function_name: str,
    api_key: Optional[str] = None,
) -> Dict[str, Any]:
    """Analyze function using OpenAI GPT-4o model."""
    from openai import OpenAI

    api_key = api_key or os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise ValueError("OPENAI_API_KEY is not set")

    base_url = os.environ.get("OPENAI_BASE_URL")
    if base_url:
        client = OpenAI(api_key=api_key, base_url=base_url)
    else:
        client = OpenAI(api_key=api_key)

    user_message = f"""Analyze this decompiled function named `{function_name}`:

```c
{code}
```

Provide your analysis as a JSON object following the schema in your instructions."""

    model = os.environ.get("MODEL", "gpt-4o")
    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        response_format={"type": "json_object"},
        temperature=0.1,
        max_tokens=2048,
    )

    raw_text = response.choices[0].message.content
    result = _parse_llm_response(raw_text)

    result["_meta"] = {
        "model": model,
        "provider": "openai",
        "usage": {
            "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
            "completion_tokens": response.usage.completion_tokens if response.usage else 0,
            "total_tokens": response.usage.total_tokens if response.usage else 0,
        },
    }

    return result


def analyze_function(
    code: str,
    function_name: str,
    provider: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main entry point: analyze a decompiled function using the configured LLM.
    
    Args:
        code: Decompiled (optionally compressed) pseudo-C code
        function_name: Original function name from the binary
        provider: LLM provider override ("groq" or "openai")
    
    Returns:
        Analysis dict with suggested_function_name, purpose_summary,
        variable_renames, vulnerabilities, confidence_score, and _meta.
    """
    provider = provider or os.environ.get("LLM_PROVIDER", "groq").lower()

    try:
        if provider == "groq":
            return analyze_with_groq(code, function_name)
        elif provider == "openai":
            return analyze_with_openai(code, function_name)
        else:
            raise ValueError(f"Unknown LLM provider: {provider}")
    except Exception as e:
        # If primary provider fails, try fallback
        fallback = "openai" if provider == "groq" else "groq"
        print(f"[Analyzer] {provider} failed: {e} — trying {fallback}")
        try:
            if fallback == "groq":
                return analyze_with_groq(code, function_name)
            else:
                return analyze_with_openai(code, function_name)
        except Exception as e2:
            print(f"[Analyzer] Fallback {fallback} also failed: {e2}")
            # Return a minimal error response
            return {
                "suggested_function_name": function_name,
                "purpose_summary": f"Analysis failed: {e}. Fallback also failed: {e2}",
                "variable_renames": {},
                "vulnerabilities": [],
                "confidence_score": 0.0,
                "_meta": {
                    "model": "none",
                    "provider": "error",
                    "error": str(e),
                },
            }
