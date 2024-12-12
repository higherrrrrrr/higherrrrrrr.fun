FROM python:3.11-slim-bullseye

WORKDIR /app

# Update and install git + dependencies
# - build-essential: For building C extensions.
# - libssl-dev, libffi-dev: Commonly needed for cryptographic Python packages.
# - python3-dev: For compiling Python extensions.
# - rustc, cargo: In case any Rust-backed Python packages are needed.
RUN apt-get update && apt-get install -y --no-install-recommends \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    rustc \
    cargo \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Upgrade pip to the latest version and then install requirements
RUN pip install --no-cache-dir --upgrade pip
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "--bind", "5000", "app:app"]
