# Use an official Python runtime as a parent image
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Set the working directory in the container
WORKDIR /app

# Install dependencies first to benefit from layer caching
# Use --no-cache-dir to reduce image size
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Run as an unprivileged user
RUN useradd --create-home --uid 1000 app
USER app

# Cloud Run injects PORT (8080 by default)
EXPOSE 8080

# --proxy-headers makes the client IP (used by the rate limiter) come from X-Forwarded-For set by Cloud Run
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080} --proxy-headers --forwarded-allow-ips='*'"]
