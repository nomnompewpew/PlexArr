#!/bin/bash

################################################################################
# PlexArr Setup & Installation Script
# Comprehensive setup with dependency checking, validation, and staged deployment
################################################################################

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="PlexArr"
STACKS_DIR="${STACKS_DIR:-/opt/plexarr}"
MIN_NODE_VERSION="16.0.0"
MIN_NPM_VERSION="7.0.0"
MIN_DOCKER_VERSION="20.10.0"

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✓ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠ ${NC}$1"
}

log_error() {
    echo -e "${RED}✗ ${NC}$1"
}

log_section() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Compare semantic versions
version_ge() {
    printf '%s\n%s' "$2" "$1" | sort -V -C
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

################################################################################
# Dependency Checks
################################################################################

check_node() {
    log_info "Checking Node.js installation..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed"
        return 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    if version_ge "$NODE_VERSION" "$MIN_NODE_VERSION"; then
        log_success "Node.js $NODE_VERSION (required: $MIN_NODE_VERSION+)"
        return 0
    else
        log_error "Node.js $NODE_VERSION is too old (required: $MIN_NODE_VERSION+)"
        return 1
    fi
}

check_npm() {
    log_info "Checking npm installation..."
    
    if ! command_exists npm; then
        log_error "npm is not installed"
        return 1
    fi
    
    NPM_VERSION=$(npm -v)
    if version_ge "$NPM_VERSION" "$MIN_NPM_VERSION"; then
        log_success "npm $NPM_VERSION (required: $MIN_NPM_VERSION+)"
        return 0
    else
        log_error "npm $NPM_VERSION is too old (required: $MIN_NPM_VERSION+)"
        return 1
    fi
}

check_docker() {
    log_info "Checking Docker installation..."
    
    if ! command_exists docker; then
        log_error "Docker is not installed"
        return 1
    fi
    
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | cut -d',' -f1)
    if version_ge "$DOCKER_VERSION" "$MIN_DOCKER_VERSION"; then
        log_success "Docker $DOCKER_VERSION (required: $MIN_DOCKER_VERSION+)"
        return 0
    else
        log_error "Docker $DOCKER_VERSION is too old (required: $MIN_DOCKER_VERSION+)"
        return 1
    fi
}

check_docker_compose() {
    log_info "Checking Docker Compose installation..."
    
    if ! command_exists docker; then
        log_error "Docker not found - Docker Compose requires Docker"
        return 1
    fi
    
    if docker compose version >/dev/null 2>&1; then
        COMPOSE_VERSION=$(docker compose version --short)
        log_success "Docker Compose V2 $COMPOSE_VERSION"
        return 0
    else
        log_warning "Docker Compose V2 not available, installing..."
        return 1
    fi
}

check_docker_daemon() {
    log_info "Checking Docker daemon..."
    
    if ! docker ps >/dev/null 2>&1; then
        log_error "Docker daemon is not running"
        log_info "Start Docker with: sudo systemctl start docker"
        return 1
    fi
    
    log_success "Docker daemon is running"
    return 0
}

################################################################################
# Environment Setup
################################################################################

create_stacks_directory() {
    log_info "Creating stacks directory at $STACKS_DIR..."
    
    if [ -d "$STACKS_DIR" ]; then
        log_warning "Directory $STACKS_DIR already exists"
    else
        if sudo mkdir -p "$STACKS_DIR" 2>/dev/null; then
            log_success "Created $STACKS_DIR"
        else
            log_error "Failed to create $STACKS_DIR - insufficient permissions"
            log_info "Try: sudo mkdir -p $STACKS_DIR && sudo chown \$USER:\$USER $STACKS_DIR"
            return 1
        fi
    fi
    
    # Check permissions
    if [ -w "$STACKS_DIR" ]; then
        log_success "Directory is writable"
        return 0
    else
        log_error "Directory is not writable"
        log_info "Try: sudo chown \$USER:\$USER $STACKS_DIR"
        return 1
    fi
}

create_external_network() {
    log_info "Creating Docker network 'plexarr_default'..."
    
    if docker network inspect plexarr_default >/dev/null 2>&1; then
        log_success "Network 'plexarr_default' already exists"
        return 0
    fi
    
    if docker network create plexarr_default >/dev/null 2>&1; then
        log_success "Network 'plexarr_default' created"
        return 0
    else
        log_error "Failed to create network"
        return 1
    fi
}

################################################################################
# Build & Deployment
################################################################################

install_dependencies() {
    log_info "Installing Node.js dependencies..."
    
    if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
        cd "$SCRIPT_DIR"
        if npm install >/dev/null 2>&1; then
            log_success "Dependencies installed"
            return 0
        else
            log_error "Failed to install dependencies"
            return 1
        fi
    else
        log_success "Dependencies already installed"
        return 0
    fi
}

build_containers() {
    log_info "Building Docker containers (this may take a few minutes)..."
    
    cd "$SCRIPT_DIR"
    
    if docker compose build >/dev/null 2>&1; then
        log_success "Containers built successfully"
        return 0
    else
        log_error "Failed to build containers"
        return 1
    fi
}

start_services() {
    log_info "Starting services..."
    
    cd "$SCRIPT_DIR"
    
    if docker compose up -d >/dev/null 2>&1; then
        log_success "Services started"
        return 0
    else
        log_error "Failed to start services"
        return 1
    fi
}

################################################################################
# Verification
################################################################################

wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=0
    
    log_info "Waiting for $service_name to be ready..."
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" >/dev/null 2>&1; then
            log_success "$service_name is ready"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    
    echo ""
    log_error "$service_name did not start in time"
    return 1
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check containers are running
    log_info "Checking running containers..."
    if docker compose ps | grep -q "plexarr-backend.*Up"; then
        log_success "Backend container is running"
    else
        log_error "Backend container is not running"
        return 1
    fi
    
    if docker compose ps | grep -q "plexarr-frontend.*Up"; then
        log_success "Frontend container is running"
    else
        log_error "Frontend container is not running"
        return 1
    fi
    
    # Wait for services to be healthy
    log_info "Waiting for services to be ready..."
    wait_for_service "http://localhost:3001/health" "Backend API" || return 1
    wait_for_service "http://localhost:3000" "Frontend" || return 1
    
    log_success "All services are healthy"
    return 0
}

check_docker_in_container() {
    log_info "Checking Docker access in container..."
    
    if docker compose exec -T plexarr-backend docker --version >/dev/null 2>&1; then
        log_success "Docker CLI is available in backend container"
        return 0
    else
        log_error "Docker CLI is not available in backend container"
        log_info "The container may need to be rebuilt"
        return 1
    fi
}

################################################################################
# Main Setup Flow
################################################################################

main() {
    echo ""
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║       $PROJECT_NAME - Unified Media Server Setup           ║${NC}"
    echo -e "${BLUE}║            Comprehensive Installation Script                  ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Track failures
    FAILED_CHECKS=()
    
    # ════════════════════════════════════════════════════════════════════════
    # STAGE 1: Dependency Verification
    # ════════════════════════════════════════════════════════════════════════
    log_section "STAGE 1: Checking Dependencies"
    
    check_node || FAILED_CHECKS+=("Node.js")
    check_npm || FAILED_CHECKS+=("npm")
    check_docker || FAILED_CHECKS+=("Docker")
    check_docker_daemon || FAILED_CHECKS+=("Docker Daemon")
    check_docker_compose || FAILED_CHECKS+=("Docker Compose")
    
    if [ ${#FAILED_CHECKS[@]} -gt 0 ]; then
        log_error "The following checks failed:"
        printf '%s\n' "${FAILED_CHECKS[@]}" | sed 's/^/  - /'
        echo ""
        log_error "Please install missing dependencies and run this script again"
        exit 1
    fi
    
    log_success "All dependency checks passed"
    
    # ════════════════════════════════════════════════════════════════════════
    # STAGE 2: Environment Setup
    # ════════════════════════════════════════════════════════════════════════
    log_section "STAGE 2: Setting Up Environment"
    
    create_stacks_directory || exit 1
    sleep 1
    
    create_external_network || exit 1
    sleep 1
    
    # ════════════════════════════════════════════════════════════════════════
    # STAGE 3: Dependency Installation
    # ════════════════════════════════════════════════════════════════════════
    log_section "STAGE 3: Installing Node Dependencies"
    
    install_dependencies || exit 1
    sleep 2
    
    # ════════════════════════════════════════════════════════════════════════
    # STAGE 4: Building Containers
    # ════════════════════════════════════════════════════════════════════════
    log_section "STAGE 4: Building Docker Containers"
    
    build_containers || exit 1
    sleep 3
    
    # ════════════════════════════════════════════════════════════════════════
    # STAGE 5: Starting Services
    # ════════════════════════════════════════════════════════════════════════
    log_section "STAGE 5: Starting Services"
    
    start_services || exit 1
    sleep 5
    
    # ════════════════════════════════════════════════════════════════════════
    # STAGE 6: Verification
    # ════════════════════════════════════════════════════════════════════════
    log_section "STAGE 6: Verifying Deployment"
    
    verify_deployment || exit 1
    sleep 2
    
    check_docker_in_container || log_warning "Docker in container check failed (may still work)"
    
    # ════════════════════════════════════════════════════════════════════════
    # Success!
    # ════════════════════════════════════════════════════════════════════════
    echo ""
    log_section "✨ Setup Complete!"
    
    echo ""
    echo -e "${GREEN}PlexArr is ready to use!${NC}"
    echo ""
    echo "📍 Access the wizard at:"
    echo "   Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo ""
    echo "📍 Backend API:"
    echo "   API:       ${BLUE}http://localhost:3001${NC}"
    echo ""
    echo "📁 Stack files location:"
    echo "   Host:      ${BLUE}$STACKS_DIR${NC}"
    echo ""
    echo "🚀 Common commands:"
    echo "   View logs:     ${BLUE}docker compose logs -f${NC}"
    echo "   Stop stack:    ${BLUE}docker compose down${NC}"
    echo "   Restart:       ${BLUE}docker compose restart${NC}"
    echo ""
    
    return 0
}

# Handle errors
trap 'log_error "Setup interrupted"; exit 1' SIGINT SIGTERM

# Run main
main
