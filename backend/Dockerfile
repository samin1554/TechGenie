FROM python:3.11-slim

WORKDIR /app

ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Install system deps for asyncpg and PyMuPDF
RUN apt-get update && \
    apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Install Python deps
COPY pyproject.toml ./
RUN pip install --no-cache-dir .

# Copy app code
COPY . .

# Run migrations (non-blocking) then start server
CMD ["sh", "-c", "alembic upgrade head || echo 'Migration skipped'; exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
