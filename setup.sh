#!/bin/bash

echo "Setting up TaskPulse..."

if ! command -v docker &> /dev/null; then
    echo "Docker not installed"
    exit 1
fi

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env file, update with your credentials"
fi

docker compose up

echo "Done"
