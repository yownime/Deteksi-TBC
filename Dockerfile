# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=7860

# Install system dependencies required for OpenCV
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /app

# Copy the requirements file into the container
COPY backend/requirements.txt /app/backend/requirements.txt

# Install python dependencies
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy the rest of the application files
COPY backend /app/backend
COPY model_densenet121_tbc.keras /app/model_densenet121_tbc.keras

# Set working directory to backend folder so app runs in correct context
WORKDIR /app/backend

# Expose the port
EXPOSE 7860

# Run Flask
CMD ["python", "app.py"]
