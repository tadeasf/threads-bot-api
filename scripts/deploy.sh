#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Environment validation
if [ -z "$DEPLOY_ENV" ]; then
    echo -e "${RED}Error: DEPLOY_ENV not set${NC}"
    exit 1
fi

# Load environment variables
# shellcheck source=/dev/null
source ".env.${DEPLOY_ENV}"

# Functions
check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"
    command -v docker >/dev/null 2>&1 || {
        echo -e "${RED}Docker is required but not installed.${NC}" >&2
        exit 1
    }
    command -v docker-compose >/dev/null 2>&1 || {
        echo -e "${RED}Docker Compose is required but not installed.${NC}" >&2
        exit 1
    }
}

build_application() {
    echo -e "${YELLOW}Building application...${NC}"
    docker-compose -f docker-compose.yml build
}

deploy_application() {
    echo -e "${YELLOW}Deploying application...${NC}"
    docker-compose -f docker-compose.yml up -d
}

check_health() {
    echo -e "${YELLOW}Checking application health...${NC}"
    local max_attempts=30
    local current_attempt=1

    while [ $current_attempt -le $max_attempts ]; do
        if curl -s http://localhost:3002/health >/dev/null; then
            echo -e "${GREEN}Application is healthy!${NC}"
            return 0
        fi
        echo -n "."
        current_attempt=$((current_attempt + 1))
        sleep 1
    done

    echo -e "${RED}Health check failed${NC}"
    exit 1
}

# Main deployment flow
main() {
    echo -e "${YELLOW}Starting deployment for ${DEPLOY_ENV} environment${NC}"

    check_dependencies
    build_application
    deploy_application
    check_health

    echo -e "${GREEN}Deployment completed successfully!${NC}"
}

# Run deployment
main
