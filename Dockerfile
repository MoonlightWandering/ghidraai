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
FROM eclipse-temurin:21-jdk-jammy

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive

# Install Python 3.10 and pip (Jammy includes Python 3.10 natively)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-venv \
    wget \
    unzip \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

RUN ln -s /usr/bin/python3 /usr/bin/python

# Download and install Ghidra (11.3 uses Java 17, perfectly matching Temurin 17)
RUN wget -q https://github.com/NationalSecurityAgency/ghidra/releases/download/Ghidra_11.3_build/ghidra_11.3_PUBLIC_20250205.zip -O /tmp/ghidra.zip && \
    unzip -q /tmp/ghidra.zip -d /opt/ && \
    mv /opt/ghidra_11.3_PUBLIC /opt/ghidra && \
    rm /tmp/ghidra.zip

# Set Ghidra and Java directories globally
ENV GHIDRA_INSTALL_DIR=/opt/ghidra
ENV JAVA_HOME=/opt/java/openjdk

# Install Python requirements
COPY backend/requirements.txt backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Hard-patch PyGhidra to bypass the LaunchSupport crash on Render by directly returning JAVA_HOME
RUN sed -i 's/home = subprocess.check_output(cmd, encoding="utf-8", shell=True)/home = "\/opt\/java\/openjdk"/g' /usr/local/lib/python3.10/dist-packages/pyghidra/launcher.py

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
