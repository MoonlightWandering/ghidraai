# ========================================
# Stage 1: Build Next.js Frontend
# ========================================
FROM node:20-alpine AS builder

WORKDIR /app/frontend

# Copy frontend source
COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
# Build the static export. NEXT_PUBLIC_API_URL is empty so it uses relative path /api
ENV NEXT_PUBLIC_API_URL=""
RUN npm run build

# ========================================
# Stage 2: Python Backend Runtime
# ========================================
FROM python:3.10-slim-bookworm

WORKDIR /app

# Install system dependencies if required (e.g., Java for Ghidra)
RUN apt-get update && apt-get install -y --no-install-recommends \
    wget \
    unzip \
    openjdk-17-jdk-headless \
    && rm -rf /var/lib/apt/lists/*

# Download and install Ghidra
RUN wget -q https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_12.1.2_build/ghidra_12.1.2_PUBLIC_20260605.zip -O /tmp/ghidra.zip && \
    unzip -q /tmp/ghidra.zip -d /opt/ && \
    mv /opt/ghidra_12.1.2_PUBLIC /opt/ghidra && \
    rm /tmp/ghidra.zip

# Set Ghidra directory globally
ENV GHIDRA_INSTALL_DIR=/opt/ghidra

# Install Python requirements
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source
COPY backend/ backend/

# Copy the built frontend static files from Stage 1
# This places the files at /app/frontend/out, exactly where backend/main.py expects them
COPY --from=builder /app/frontend/out /app/frontend/out

# Expose the single port Render uses
EXPOSE 8000
ENV PORT=8000
ENV HOST=0.0.0.0

WORKDIR /app/backend

# Run the FastAPI application using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
