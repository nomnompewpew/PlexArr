#!/bin/bash

################################################################################
# PlexArr Installation Script for Linux
# Supports: Ubuntu, Debian, CentOS, Fedora, Arch
# 
# Usage: ./install.sh
# This script will:
#   1. Detect your Linux distro
#   2. Install Node.js, Docker, Docker Compose
#   3. Clone/setup PlexArr repository
#   4. Start the application
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Ask for user confirmation
ask_confirmation() {
    local prompt="$1"
    local response
    while true; do
        read -p "$(echo -e ${YELLOW}$prompt${NC}) (y/n) " -n 1 -r response
        echo
        [[ $response =~ ^[Yy]$ ]] && return 0 || return 1
    done
}

################################################################################
# SYSTEM DETECTION
################################################################################

detect_distro() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        DISTRO=$ID
        DISTRO_VERSION=$VERSION_ID
    elif [ -f /etc/lsb-release ]; then
        . /etc/lsb-release
        DISTRO=$(echo $DISTRIB_ID | tr '[:upper:]' '[:lower:]')
        DISTRO_VERSION=$DISTRIB_RELEASE
    else
        DISTRO="unknown"
    fi
    
    log_info "Detected: $DISTRO $DISTRO_VERSION"
}

detect_architecture() {
    ARCH=$(uname -m)
    log_info "Architecture: $ARCH"
}

check_command() {
    if command -v "$1" &> /dev/null; then
        echo "$($1 --version | head -n 1)"
        return 0
    else
        return 1
    fi
}

################################################################################
# DEPENDENCY CHECKING
################################################################################

check_dependencies() {
    log_info "Checking system dependencies..."
    
    MISSING_DEPS=()
    
    # Check Node.js
    if ! check_command node &> /dev/null; then
        log_warning "Node.js not found"
        MISSING_DEPS+=("node")
    else
        log_success "Node.js: $(check_command node)"
    fi
    
    # Check npm
    if ! check_command npm &> /dev/null; then
        log_warning "npm not found"
        MISSING_DEPS+=("npm")
    else
        log_success "npm: $(check_command npm)"
    fi
    
    # Check Docker
    if ! check_command docker &> /dev/null; then
        log_warning "Docker not found"
        MISSING_DEPS+=("docker")
    else
        log_success "Docker: $(check_command docker)"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null && ! docker compose --version &> /dev/null; then
        log_warning "Docker Compose not found"
        MISSING_DEPS+=("docker-compose")
    else
        log_success "Docker Compose: OK"
    fi
    
    # Check Git
    if ! check_command git &> /dev/null; then
        log_warning "Git not found"
        MISSING_DEPS+=("git")
    else
        log_success "Git: $(check_command git)"
    fi
    
    if [ ${#MISSING_DEPS[@]} -eq 0 ]; then
        log_success "All dependencies installed!"
        return 0
    else
        log_warning "Missing: ${MISSING_DEPS[*]}"
        return 1
    fi
}

################################################################################
# INSTALLATION FUNCTIONS
################################################################################

install_ubuntu_debian() {
    log_info "Installing dependencies for Debian/Ubuntu..."
    
    log_info "Updating package manager..."
    sudo apt-get update
    
    if [[ " ${MISSING_DEPS[@]} " =~ " node " ]]; then
        log_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    
    if [[ " ${MISSING_DEPS[@]} " =~ " docker " ]]; then
        log_info "Installing Docker..."
        sudo apt-get install -y \
            apt-transport-https \
            ca-certificates \
            curl \
            gnupg \
            lsb-release
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    fi
    
    if [[ " ${MISSING_DEPS[@]} " =~ " git " ]]; then
        log_info "Installing Git..."
        sudo apt-get install -y git
    fi
}

install_centos_fedora() {
    log_info "Installing dependencies for CentOS/Fedora/RHEL..."
    
    if [[ " ${MISSING_DEPS[@]} " =~ " node " ]]; then
        log_info "Installing Node.js..."
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
    
    if [[ " ${MISSING_DEPS[@]} " =~ " docker " ]]; then
        log_info "Installing Docker..."
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    if [[ " ${MISSING_DEPS[@]} " =~ " git " ]]; then
        log_info "Installing Git..."
        sudo yum install -y git
    fi
}

install_arch() {
    log_info "Installing dependencies for Arch Linux..."
    
    if [[ " ${MISSING_DEPS[@]} " =~ " node " ]]; then
        log_info "Installing Node.js..."
        sudo pacman -S --noconfirm nodejs npm
    fi
    
    if [[ " ${MISSING_DEPS[@]} " =~ " docker " ]]; then
        log_info "Installing Docker..."
        sudo pacman -S --noconfirm docker docker-compose
        sudo systemctl start docker
        sudo systemctl enable docker
    fi
    
    if [[ " ${MISSING_DEPS[@]} " =~ " git " ]]; then
        log_info "Installing Git..."
        sudo pacman -S --noconfirm git
    fi
}

install_dependencies() {
    if ! check_dependencies; then
        log_warning "Installing missing dependencies..."
        
        if ask_confirmation "Continue with installation? This requires sudo access."; then
            case "$DISTRO" in
                ubuntu|debian)
                    install_ubuntu_debian
                    ;;
                centos|rhel|fedora)
                    install_centos_fedora
                    ;;
                arch)
                    install_arch
                    ;;
                *)
                    log_error "Unsupported distro: $DISTRO"
                    log_info "Please install Node.js, Docker, and Docker Compose manually."
                    exit 1
                    ;;
            esac
            
            log_success "Dependencies installed!"
        else
            log_error "Installation cancelled"
            exit 1
        fi
    fi
}

################################################################################
# DOCKER SETUP
################################################################################

setup_docker_permissions() {
    log_info "Setting up Docker permissions..."
    
    if ! docker ps &> /dev/null; then
        log_warning "Docker daemon is not running or you lack permissions"
        
        if ask_confirmation "Add current user to docker group and restart Docker?"; then
            sudo usermod -aG docker "$USER"
            sudo systemctl restart docker
            log_success "Docker permissions updated. You may need to log out and back in."
        fi
    else
        log_success "Docker is accessible"
    fi
}

################################################################################
# REPOSITORY SETUP
################################################################################

setup_repository() {
    local repo_url="https://github.com/neckbeard/PlexArr.git"
    local install_dir="$HOME/PlexArr"
    
    log_info "Repository setup..."
    
    if [ -d "$install_dir" ]; then
        log_warning "PlexArr already exists at $install_dir"
        if ask_confirmation "Update existing installation?"; then
            cd "$install_dir"
            git pull origin main
            log_success "Repository updated"
        fi
    else
        log_info "Cloning PlexArr repository..."
        git clone "$repo_url" "$install_dir"
        cd "$install_dir"
        log_success "Repository cloned to $install_dir"
    fi
    
    export PLEXARR_DIR="$install_dir"
}

################################################################################
# APPLICATION SETUP
################################################################################

setup_application() {
    log_info "Setting up application..."
    
    cd "$PLEXARR_DIR"
    
    # Install npm dependencies
    log_info "Installing npm dependencies..."
    npm install
    
    log_success "Application dependencies installed"
}

build_application() {
    log_info "Building application..."
    
    cd "$PLEXARR_DIR"
    
    # Build frontend
    log_info "Building frontend..."
    cd frontend
    npm run build
    cd ..
    
    log_success "Application built successfully"
}

################################################################################
# APPLICATION START
################################################################################

start_application() {
    log_info "Starting PlexArr..."
    
    cd "$PLEXARR_DIR"
    
    # Start Docker containers
    log_info "Starting Docker containers..."
    docker compose up -d
    
    log_success "Docker containers started"
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 5
    
    # Check if services are running
    if docker compose ps | grep -q "plexarr-frontend"; then
        log_success "✓ Frontend is running"
        log_success "✓ Backend is running"
    else
        log_error "Failed to start containers"
        docker compose logs
        exit 1
    fi
}

open_browser() {
    log_success "PlexArr is ready!"
    log_info "Opening PlexArr in your browser..."
    
    sleep 2
    
    # Try to open browser
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v open &> /dev/null; then
        open http://localhost:3000
    else
        log_warning "Could not open browser automatically"
        log_info "Visit: http://localhost:3000"
    fi
}

show_next_steps() {
    cat << EOF

${GREEN}═══════════════════════════════════════════════════════════${NC}
${GREEN}✓ PlexArr Installation Complete!${NC}
${GREEN}═══════════════════════════════════════════════════════════${NC}

Your PlexArr instance is running at: ${BLUE}http://localhost:3000${NC}

${YELLOW}Next Steps:${NC}
1. Open http://localhost:3000 in your browser
2. Follow the Deployment Wizard to configure your services
3. The Post-Deployment Setup guide will walk you through the rest

${YELLOW}Commands:${NC}
  Start PlexArr:  cd $PLEXARR_DIR && docker compose up -d
  Stop PlexArr:   cd $PLEXARR_DIR && docker compose down
  View logs:      cd $PLEXARR_DIR && docker compose logs -f
  Rebuild:        cd $PLEXARR_DIR && docker compose build && docker compose up -d

${YELLOW}Troubleshooting:${NC}
  If services don't start:
    docker compose logs plexarr-backend
    docker compose logs plexarr-frontend

${GREEN}═══════════════════════════════════════════════════════════${NC}

EOF
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    clear
    
    cat << EOF
${BLUE}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   Welcome to PlexArr Installation for Linux              ║
║   Unified Plex Media Server Management                   ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${NC}

This script will install all necessary dependencies and
set up PlexArr to run on your system.

EOF

    # Step 1: Detect system
    log_info "Step 1: Detecting system..."
    detect_distro
    detect_architecture
    
    # Step 2: Check dependencies
    log_info "Step 2: Checking dependencies..."
    check_dependencies
    
    # Step 3: Install missing dependencies
    log_info "Step 3: Installing dependencies..."
    install_dependencies
    
    # Step 4: Verify all dependencies
    log_info "Step 4: Verifying installation..."
    if ! check_dependencies; then
        log_error "Some dependencies are still missing"
        exit 1
    fi
    
    # Step 5: Setup Docker permissions
    log_info "Step 5: Setting up Docker access..."
    setup_docker_permissions
    
    # Step 6: Clone/update repository
    log_info "Step 6: Cloning PlexArr repository..."
    setup_repository
    
    # Step 7: Install npm dependencies
    log_info "Step 7: Installing application dependencies..."
    setup_application
    
    # Step 8: Build application
    log_info "Step 8: Building application..."
    build_application
    
    # Step 9: Start application
    log_info "Step 9: Starting PlexArr..."
    start_application
    
    # Step 10: Open browser
    open_browser
    
    # Show next steps
    show_next_steps
}

# Run main function
main "$@"
