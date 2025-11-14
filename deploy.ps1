# Build and deploy script for Windows
Write-Host "🏗️  Building React application..." -ForegroundColor Blue
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "📁 Copying assets to Laravel public directory..." -ForegroundColor Blue
    Copy-Item -Path "dist\*" -Destination "backend\public\" -Recurse -Force
    
    Write-Host "🔄 Updating Laravel blade template..." -ForegroundColor Blue
    node scripts/update-assets.js
    
    Write-Host "✅ Deployment complete!" -ForegroundColor Green
    Write-Host "🚀 Your application is ready at http://127.0.0.1:8000" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}