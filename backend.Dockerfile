FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt /app/
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
RUN pip install psycopg2-binary gunicorn

# Copy project
COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Run Daphne (ASGI) for WebSockets and HTTP
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "govt_token.asgi:application"]
