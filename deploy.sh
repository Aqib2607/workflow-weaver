#!/bin/bash

# FlowBuilder Production Deployment Script
# Usage: ./deploy.sh [environment]

set -e

ENVIRONMENT=${1:-production}
PROJECT_NAME="flowbuilder"
BACKEND_DIR="/var/www/${PROJECT_NAME}-backend"
FRONTEND_DIR="/var/www/${PROJECT_NAME}-frontend"

echo "🚀 Starting FlowBuilder deployment for ${ENVIRONMENT} environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Backup current deployment
backup_deployment() {
    print_status "Creating backup of current deployment..."
    
    if [ -d "$BACKEND_DIR" ]; then
        sudo cp -r "$BACKEND_DIR" "${BACKEND_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
        print_status "Backend backup created"
    fi
    
    if [ -d "$FRONTEND_DIR" ]; then
        sudo cp -r "$FRONTEND_DIR" "${FRONTEND_DIR}_backup_$(date +%Y%m%d_%H%M%S)"
        print_status "Frontend backup created"
    fi
}

# Deploy backend
deploy_backend() {
    print_status "Deploying backend..."
    
    # Navigate to backend directory
    cd backend
    
    # Install/update dependencies
    print_status "Installing backend dependencies..."
    composer install --optimize-autoloader --no-dev
    
    # Run database migrations
    print_status "Running database migrations..."
    php artisan migrate --force
    
    # Clear and cache configuration
    print_status "Optimizing backend..."
    php artisan config:cache
    php artisan route:cache
    php artisan view:cache
    php artisan queue:restart
    
    # Set proper permissions
    print_status "Setting backend permissions..."
    sudo chown -R www-data:www-data storage bootstrap/cache
    sudo chmod -R 775 storage bootstrap/cache
    
    print_status "Backend deployment completed"
}

# Deploy frontend
deploy_frontend() {
    print_status "Deploying frontend..."
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm ci --production
    
    # Build for production
    print_status "Building frontend for production..."
    npm run build
    
    # Copy build files to web directory
    print_status "Copying frontend files..."
    sudo rm -rf "$FRONTEND_DIR"
    sudo mkdir -p "$FRONTEND_DIR"
    sudo cp -r dist/* "$FRONTEND_DIR/"
    sudo chown -R www-data:www-data "$FRONTEND_DIR"
    
    print_status "Frontend deployment completed"
}

# Update system services
update_services() {
    print_status "Updating system services..."
    
    # Restart PHP-FPM
    sudo systemctl restart php8.1-fpm
    
    # Restart Nginx
    sudo systemctl restart nginx
    
    # Restart queue workers
    sudo supervisorctl restart ${PROJECT_NAME}-worker:*
    
    # Restart Redis (if needed)
    sudo systemctl restart redis-server
    
    print_status "System services updated"
}

# Run health checks
health_check() {
    print_status "Running health checks..."
    
    # Check if backend is responding
    if curl -f -s "http://localhost/api/health" > /dev/null; then
        print_status "✅ Backend health check passed"
    else
        print_error "❌ Backend health check failed"
        return 1
    fi
    
    # Check if frontend is accessible
    if curl -f -s "http://localhost" > /dev/null; then
        print_status "✅ Frontend health check passed"
    else
        print_error "❌ Frontend health check failed"
        return 1
    fi
    
    # Check database connection
    cd backend
    if php artisan tinker --execute="DB::connection()->getPdo(); echo 'Database OK';" > /dev/null 2>&1; then
        print_status "✅ Database connection check passed"
    else
        print_error "❌ Database connection check failed"
        return 1
    fi
    
    # Check Redis connection
    if redis-cli ping > /dev/null 2>&1; then
        print_status "✅ Redis connection check passed"
    else
        print_error "❌ Redis connection check failed"
        return 1
    fi
    
    print_status "All health checks passed! 🎉"
}

# Rollback function
rollback() {
    print_warning "Rolling back deployment..."
    
    # Find latest backup
    BACKEND_BACKUP=$(ls -td ${BACKEND_DIR}_backup_* 2>/dev/null | head -1)
    FRONTEND_BACKUP=$(ls -td ${FRONTEND_DIR}_backup_* 2>/dev/null | head -1)
    
    if [ -n "$BACKEND_BACKUP" ]; then
        sudo rm -rf "$BACKEND_DIR"
        sudo mv "$BACKEND_BACKUP" "$BACKEND_DIR"
        print_status "Backend rolled back"
    fi
    
    if [ -n "$FRONTEND_BACKUP" ]; then
        sudo rm -rf "$FRONTEND_DIR"
        sudo mv "$FRONTEND_BACKUP" "$FRONTEND_DIR"
        print_status "Frontend rolled back"
    fi
    
    update_services
    print_warning "Rollback completed"
}

# Main deployment process
main() {
    print_status "FlowBuilder Deployment Started"
    print_status "Environment: ${ENVIRONMENT}"
    print_status "Timestamp: $(date)"
    
    # Create backup
    backup_deployment
    
    # Deploy components
    if ! deploy_backend; then
        print_error "Backend deployment failed"
        rollback
        exit 1
    fi
    
    if ! deploy_frontend; then
        print_error "Frontend deployment failed"
        rollback
        exit 1
    fi
    
    # Update services
    update_services
    
    # Wait a moment for services to start
    sleep 5
    
    # Run health checks
    if ! health_check; then
        print_error "Health checks failed"
        rollback
        exit 1
    fi
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Application is now live at your domain"
    
    # Clean up old backups (keep last 5)
    print_status "Cleaning up old backups..."
    ls -td ${BACKEND_DIR}_backup_* 2>/dev/null | tail -n +6 | xargs -r sudo rm -rf
    ls -td ${FRONTEND_DIR}_backup_* 2>/dev/null | tail -n +6 | xargs -r sudo rm -rf
    
    print_status "Deployment process completed! ✨"
}

# Handle script interruption
trap 'print_error "Deployment interrupted! Running rollback..."; rollback; exit 1' INT TERM

# Run main deployment
main

exit 0