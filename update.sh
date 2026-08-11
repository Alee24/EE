#!/bin/bash
set -e

APP_DIR="/opt/easy-coach-app"

echo "Updating Application..."
cd $APP_DIR

# 1. Pull latest changes
git pull origin main

# 2. Rebuild and restart containers
docker compose build --no-cache
docker compose up -d

# 3. Cleanup unused images
docker image prune -f

echo "Update complete! Application is running."
