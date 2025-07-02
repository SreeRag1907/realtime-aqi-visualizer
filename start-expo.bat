@echo off
echo Starting Expo development server...
echo.

cd /d "c:\Users\ADMIN\Downloads\ISRO\project"

echo Clearing npm cache...
npm cache clean --force

echo Installing dependencies...
npm install

echo Starting Expo...
npx @expo/cli@latest start --clear

pause
