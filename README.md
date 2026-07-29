# 🧠 Ghidra-AI

**AI-Powered Reverse Engineering Platform**

Automatically analyze binaries, compress decompiled code with Paritok, and surface AI-reconstructed semantic insights — all in a sleek modern dashboard. Built with [Paritok](https://github.com/Paritok-official/paritok-4b-v1).

[![Built with Paritok](https://img.shields.io/badge/Built%20with-Paritok-1f2d3d)](https://github.com/Paritok-official/paritok-4b-v1) ![Ghidra-AI](https://img.shields.io/badge/status-alpha-cyan) ![Python](https://img.shields.io/badge/python-3.10+-blue) ![Next.js](https://img.shields.io/badge/next.js-15-black) ![License](https://img.shields.io/badge/license-Apache%202.0-green)

## Architecture

```
┌──────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend   │────▶│   FastAPI Server  │────▶│  Ghidra/PyGhidra│
│  Next.js 15  │     │                  │     │  (Decompiler)   │
│  TypeScript  │◀────│  ┌────────────┐  │     └─────────────────┘
│  Tailwind v4 │     │  │ Extractor  │  │
└──────────────┘     │  │ Compressor │──┼────▶┌─────────────────┐
                     │  │ Analyzer   │  │     │  Paritok API    │
                     │  └────────────┘  │     │  (Compression)  │
                     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Groq / OpenAI  │
                     │  (LLM Analysis) │
                     └─────────────────┘
```

## Features

- **Binary Decompilation** — PyGhidra-powered headless analysis extracts pseudo-C from ELF, PE, and raw binaries
- **Paritok Compression** — Token reduction up to 74% using Paritok's 4B compression model
- **AI Analysis** — LLM agents reconstruct function intent, identify vulnerabilities, and propose renames
- **Vulnerability Detection** — Surfaces buffer overflows, format strings, hardcoded secrets, injections
- **Visual Code Review** — Side-by-side original vs compressed code with syntax highlighting
- **Ghidra Integration** — Export annotations as a Python script for direct Ghidra GUI import
- **Real-Time Telemetry** — Track token savings, compression ratios, and cost reduction

## Prerequisites

- **Python** 3.10+
- **Node.js** 18+
- **Ghidra** 11.3+ *(optional — demo mode available without Ghidra)*
- **API Keys** for Groq and/or OpenAI

## Getting Started

### 1. Clone & Setup

```bash
git clone https://github.com/your-username/ghidra-ai.git
cd ghidra-ai
```

### 2. Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run server
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local

# Run dev server
npm run dev
```

### 4. Open Dashboard

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

### Backend (`.env`)

| Variable | Description | Required |
|---|---|---|
| `GHIDRA_INSTALL_DIR` | Path to Ghidra installation | No (demo mode) |
| `PARITOK_API_KEY` | Paritok hosted API key | No (passthrough) |
| `PARITOK_API_URL` | Paritok API endpoint | No (passthrough) |
| `LLM_PROVIDER` | `groq` or `openai` | Yes |
| `GROQ_API_KEY` | Groq API key | If using Groq |
| `OPENAI_API_KEY` | OpenAI API key | If using OpenAI |

### Frontend (`.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:8000` |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/upload` | Upload binary file |
| `GET` | `/api/status/{job_id}` | Poll job progress |
| `POST` | `/api/analyze` | Analyze single function |
| `POST` | `/api/analyze/all` | Batch analyze all functions |
| `GET` | `/api/telemetry` | Get cumulative metrics |
| `GET` | `/api/export/{job_id}` | Export Ghidra annotation script |

## Demo Mode

If Ghidra is not installed, the extractor automatically switches to **demo mode** with realistic sample decompiled functions containing intentional vulnerabilities for testing the full pipeline.

## License

Apache 2.0
