#!/bin/bash

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
DOCKER_REGISTRY="${DOCKER_REGISTRY:-your-registry}"
APP_NAME="threads-bot-api"
BACKUP_COUNT=5

# Functions
get_last_stable_version() {
    docker images --format "{{.Tag}}" "${DOCKER_REGISTRY}/${APP_NAME}" | grep -v "latest" | sort -r | head -n 1
}

perform_rollback() {
    local version="$1"
    echo -e "${YELLOW}Rolling back to version: ${version}${NC}"

    # Save current version
    local backup_tag
    backup_tag="backup_$(date +%Y%m%d_%H%M%S)"
    docker tag "${DOCKER_REGISTRY}/${APP_NAME}:latest" "${DOCKER_REGISTRY}/${APP_NAME}:${backup_tag}"

    # Pull and deploy previous version
    docker pull "${DOCKER_REGISTRY}/${APP_NAME}:${version}"
    docker tag "${DOCKER_REGISTRY}/${APP_NAME}:${version}" "${DOCKER_REGISTRY}/${APP_NAME}:latest"

    # Restart containers
    docker-compose down
    docker-compose up -d

    # Verify deployment
    if check_health; then
        echo -e "${GREEN}Rollback successful!${NC}"
        return 0
    else
        echo -e "${RED}Rollback failed!${NC}"
        return 1
    fi
}

check_health() {
    local max_attempts=30
    local current_attempt=1

    while [ $current_attempt -le $max_attempts ]; do
        if curl -s http://localhost:3000/health >/dev/null; then
            return 0
        fi
        current_attempt=$((current_attempt + 1))
        sleep 1
    done
    return 1
}

cleanup_old_backups() {
    local backups
    local count
    backups=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep "${APP_NAME}:backup_" | sort -r)
    count=$(echo "${backups}" | wc -l)
    if [ "${count}" -gt "${BACKUP_COUNT}" ]; then
        echo "${backups}" | tail -n "+$((BACKUP_COUNT + 1))" | xargs -r docker rmi
    fi
}
