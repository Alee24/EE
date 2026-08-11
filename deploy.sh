#!/bin/bash
set -e

echo "Starting Deployment for ec.kkdes.co.ke..."

# 1. Update system and install required packages
sudo apt-get update
sudo apt-get install -y git curl

# 2. Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "Docker not found, installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed successfully."
fi

# 3. Install Docker Compose if not installed (though docker compose plugin is usually installed with get-docker)
if ! docker compose version &> /dev/null; then
    echo "Installing Docker Compose plugin..."
    sudo apt-get install -y docker-compose-plugin
fi

# 4. Clone repository if it doesn't exist, otherwise pull
APP_DIR="/opt/easy-coach-app"
if [ ! -d "$APP_DIR" ]; then
    echo "Cloning repository..."
    sudo git clone https://github.com/Alee24/EE.git $APP_DIR
    sudo chown -R $USER:$USER $APP_DIR
else
    echo "Repository already exists. Updating..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# 5. Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file. Please edit it to add GEMINI_API_KEY if needed."
    cp .env.example .env || touch .env
fi

# 6. Build and start the containers
echo "Building and starting Docker containers..."
docker compose build --no-cache
docker compose up -d
docker image prune -f

echo "Deployment complete! Application should be available at https://ec.kkdes.co.ke"
echo "Check container status with: docker compose ps"
