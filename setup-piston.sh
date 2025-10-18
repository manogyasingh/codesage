#!/bin/bash

# Piston Setup Script for localhost:2000
# This script sets up Piston API for code execution

set -e

echo "🚀 Setting up Piston API on localhost:2000..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first:"
    echo "   curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "   sudo sh get-docker.sh"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker service is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker service is not running. Please start Docker service first."
    exit 1
fi

echo "✅ Docker service is running"

# Stop existing Piston container if it exists
if docker ps -a --format 'table {{.Names}}' | grep -q '^piston$'; then
    echo "🛑 Stopping existing Piston container..."
    docker stop piston || true
    docker rm piston || true
fi

# Pull latest Piston image
echo "📥 Pulling Piston Docker image..."
docker pull ghcr.io/engineer-man/piston:latest

# Run Piston container
echo "🏃 Starting Piston container on localhost:2000..."
docker run -d -p 2000:2000 --name piston ghcr.io/engineer-man/piston:latest

# Wait for container to be ready
echo "⏳ Waiting for Piston to be ready..."
sleep 5

# Test if Piston is responding
echo "🧪 Testing Piston API..."
if curl -s http://localhost:2000/api/v2/runtimes > /dev/null; then
    echo "✅ Piston API is running successfully on http://localhost:2000"
    echo ""
    echo "🔍 Available runtimes for Python and C/C++:"
    curl -s http://localhost:2000/api/v2/runtimes | jq '.[] | select(.language == "python" or .language == "c" or .language == "c++") | {language: .language, version: .version}'
    echo ""
    echo "🎉 Setup complete! You can now use the Piston demo in the application."
    echo ""
    echo "📋 Useful commands:"
    echo "   - View logs: docker logs piston"
    echo "   - Stop Piston: docker stop piston"
    echo "   - Restart Piston: docker restart piston"
    echo "   - Remove Piston: docker stop piston && docker rm piston"
else
    echo "❌ Piston API is not responding. Check Docker logs:"
    echo "   docker logs piston"
    exit 1
fi
