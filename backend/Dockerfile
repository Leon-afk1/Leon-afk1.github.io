# Use an official Python runtime as a parent image
FROM python:3.10-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file into the container at /app
COPY requirements.txt .

# Install any needed packages specified in requirements.txt
# Use --no-cache-dir to reduce image size
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code into the container at /app
COPY . .

# Make port 8080 available to the world outside this container
# Fly.io typically uses 8080 internally, but check their docs
EXPOSE 8080

# Define environment variable if needed (though Fly.io uses secrets)
# ENV NAME World

# Run uvicorn when the container launches
# Use 0.0.0.0 to listen on all available interfaces within the container
# Use port 8080 as specified by EXPOSE
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]