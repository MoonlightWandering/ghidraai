"""
Ghidra-AI — Code Compressor Module
====================================
Cleans decompiled pseudo-C code of compiler noise and routes it through
the Paritok compression API for token reduction before LLM analysis.
"""

import os
import re
import time
import requests
from typing import Dict, Any, Optional


# ---------------------------------------------------------------------------
# Regex patterns for stripping compiler noise
# ---------------------------------------------------------------------------

NOISE_PATTERNS = [
    # Stack canary checks
    (r'\s*__stack_chk_guard\s*;?\s*', ''),
    (r'\s*__stack_chk_fail\(\)\s*;?\s*', ''),
    (r'\s*if\s*\([^)]*__stack_chk[^;]*;?\s*', ''),
    # C++ ABI boilerplate
    (r'\s*__cxa_atexit\([^)]*\)\s*;?\s*', ''),
    (r'\s*__cxa_finalize\([^)]*\)\s*;?\s*', ''),
    # Explicit bitwise casts that add noise
    (r'\(ulong\)\(uint\)', '(uint)'),
    (r'\(long\)\(int\)', '(int)'),
    (r'\(uint\)\(int\)', '(int)'),
    (r'\(ulong\)\(ulong\)', ''),
    # Redundant void casts
    (r'\(void\)\s*', ''),
    # Frame pointer boilerplate (inline asm-style comments)
    (r'//\s*push\s+rbp\s*\n', ''),
    (r'//\s*mov\s+rsp\s*,\s*rbp\s*\n', ''),
    (r'//\s*pop\s+rbp\s*\n', ''),
    # Empty lines cleanup (collapse multiple)
    (r'\n{3,}', '\n\n'),
    # Trailing whitespace
    (r'[ \t]+\n', '\n'),
]


def clean_decompiled_code(raw_code: str) -> str:
    """
    Strip low-level compiler noise from decompiled pseudo-C code.
    Removes stack canary checks, ABI boilerplate, redundant casts,
    and frame setup artifacts.
    """
    cleaned = raw_code

    for pattern, replacement in NOISE_PATTERNS:
        cleaned = re.sub(pattern, replacement, cleaned)

    # Strip leading/trailing whitespace
    cleaned = cleaned.strip()

    return cleaned


def _estimate_tokens(text: str) -> int:
    """
    Estimate token count for a string.
    Uses a rough heuristic: ~4 characters per token for code.
    Falls back to tiktoken if available.
    """
    try:
        import tiktoken
        enc = tiktoken.get_encoding("cl100k_base")
        return len(enc.encode(text))
    except (ImportError, Exception):
        # Rough heuristic for code: ~1 token per 4 chars
        return max(1, len(text) // 4)


def compress_via_paritok(
    cleaned_code: str,
    api_key: Optional[str] = None,
    api_url: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send cleaned pseudo-C code through Paritok compression API.
    
    Returns:
        {
            "compressed_text": str,
            "input_tokens": int,
            "output_tokens": int,
            "compression_ratio": float,
            "time_ms": float,
        }
    """
    api_key = api_key or os.environ.get("PARITOK_API_KEY", "")
    api_url = api_url or os.environ.get("PARITOK_API_URL", "")

    input_tokens = _estimate_tokens(cleaned_code)

    # If no Paritok API is configured, use passthrough mode
    if not api_key or not api_url:
        print("[Compressor] Paritok API not configured — using passthrough mode")
        return {
            "compressed_text": cleaned_code,
            "input_tokens": input_tokens,
            "output_tokens": input_tokens,
            "compression_ratio": 1.0,
            "time_ms": 0.0,
            "mode": "passthrough",
        }

    # Call Paritok hosted API
    start_time = time.time()
    try:
        response = requests.post(
            api_url,
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "content": cleaned_code,
                "query": "Find vulnerabilities in this code",
                "kind": "file_read"
            },
            timeout=120,
        )
        response.raise_for_status()
        data = response.json()

        compressed_text = data.get("compressed", data.get("content", cleaned_code))
        output_tokens = _estimate_tokens(compressed_text)
        elapsed_ms = (time.time() - start_time) * 1000

        ratio = output_tokens / input_tokens if input_tokens > 0 else 1.0

        return {
            "compressed_text": compressed_text,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "compression_ratio": ratio,
            "time_ms": elapsed_ms,
            "mode": "paritok",
        }

    except requests.RequestException as e:
        print(f"[Compressor] Paritok API error: {e} — falling back to passthrough")
        elapsed_ms = (time.time() - start_time) * 1000
        return {
            "compressed_text": cleaned_code,
            "input_tokens": input_tokens,
            "output_tokens": input_tokens,
            "compression_ratio": 1.0,
            "time_ms": elapsed_ms,
            "mode": "passthrough_fallback",
            "error": str(e),
        }


def calculate_telemetry(
    input_tokens: int,
    output_tokens: int,
    cost_per_1k_input: float = 0.06,
) -> Dict[str, Any]:
    """
    Calculate compression telemetry and estimated cost savings.
    
    Args:
        input_tokens: Original token count before compression
        output_tokens: Token count after compression
        cost_per_1k_input: Cost per 1K input tokens (default: $0.06 for GPT-4 class)
    
    Returns:
        {
            "tokens_saved": int,
            "compression_pct": float,
            "usd_saved": float,
            "cost_original": float,
            "cost_compressed": float,
        }
    """
    tokens_saved = input_tokens - output_tokens
    compression_pct = (tokens_saved / input_tokens * 100) if input_tokens > 0 else 0.0
    cost_original = (input_tokens / 1000) * cost_per_1k_input
    cost_compressed = (output_tokens / 1000) * cost_per_1k_input
    usd_saved = cost_original - cost_compressed

    return {
        "tokens_saved": tokens_saved,
        "compression_pct": round(compression_pct, 1),
        "usd_saved": round(usd_saved, 6),
        "cost_original": round(cost_original, 6),
        "cost_compressed": round(cost_compressed, 6),
    }
