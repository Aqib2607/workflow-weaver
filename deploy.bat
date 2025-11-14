@echo off
echo Building and deploying React application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed!
    exit /b 1
)

echo Copying assets to Laravel public directory...
xcopy /s /y "dist\*" "backend\public\"

echo Updating Laravel blade template...
node scripts/update-assets.js

echo.
echo ✅ Deployment complete!
echo 🚀 Your application is ready at http://127.0.0.1:8000