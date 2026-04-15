#!/bin/bash

echo "🚀 TaskPulse Development Setup"
echo ""
echo "Prerequisites: Docker and Docker Compose installed"
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Setup .env if doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env created. Edit it with your WhatsApp credentials."
    echo ""
else
    echo "ℹ️  .env already exists"
fi

# Start services
echo "🐳 Starting services..."
docker compose up

echo ""
echo "✅ Setup complete!"
echo "🌐 Open http://localhost:3000 in your browser"
echo ""
echo "Test Credentials:"
echo "  Manager: manager1@test.com / password123"
echo "  Employee: employee1@test.com / password123"
