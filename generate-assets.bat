@echo off
REM MicroFocus Zones - Asset Generation Script (Windows)
REM This script installs dependencies and generates all assets + ZIP file

echo.
echo =========================================================
echo    MicroFocus Zones - Asset Generator for Windows
echo =========================================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [1/3] Checking Node.js version...
node --version

echo.
echo [2/3] Installing dependencies...
echo Please wait, this may take a few minutes on first run...
echo.

call npm install

if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    echo Try running: npm install --no-optional
    echo.
    pause
    exit /b 1
)

echo.
echo [3/3] Generating assets and packaging extension...
echo.

call node generate-assets.js

if errorlevel 1 (
    echo.
    echo ERROR: Asset generation failed
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================================
echo    SUCCESS! Your extension is ready.
echo =========================================================
echo.
echo Next steps:
echo 1. Check the 'assets' folder for generated images
echo 2. Upload 'microfocus-zones.zip' to Chrome Web Store
echo 3. Or load as unpacked extension in chrome://extensions
echo.
pause
