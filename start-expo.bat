@echo off
echo ================================
echo  Starting AQI Visualizer App
echo ================================
echo.

cd /d "c:\Users\ADMIN\Downloads\ISRO\project"

echo [1/3] Checking Node.js...
node --version
if %errorlevel% neq 0 (
    echo Error: Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

echo.
echo [2/3] Installing/updating dependencies...
npm install

echo.
echo [3/3] Starting Expo development server...
echo.
echo The app will show:
echo - Google Maps with dark theme
echo - Real-time AQI data from OpenWeatherMap API
echo - Interactive markers for major Indian cities
echo - AQI color-coded indicators
echo.
echo Starting server...
npx @expo/cli@latest start --clear

echo.
echo Server stopped. Press any key to exit...
pause
