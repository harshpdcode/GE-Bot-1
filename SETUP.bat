@echo off
setlocal

:: TITLE OF THE SETUP
TITLE DynoRex X1 - Project One-Click Setup
COLOR 0B

echo ======================================================================
echo          DynoRex X1 - Professional Project Setup Wizard
echo ======================================================================
echo.

:: 1. CHECK FOR NODE.JS
echo [+] Phase 1: Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] ERROR: Node.js is not installed on this system.
    echo Please install Node.js (v18 or higher) from: https://nodejs.org/
    echo Once installed, restart this script.
    pause
    exit /b 1
)
echo [OK] Node.js is installed.
echo.

:: 2. INSTALL DEPENDENCIES
echo [+] Phase 2: Installing project dependencies...
echo (This may take a few minutes depending on your internet connection)
call npm install
if %errorlevel% neq 0 (
    echo [!] ERROR: Dependency installation failed.
    echo Check your internet connection and try again.
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully.
echo.

:: 3. SETUP DATABASE AND USERS
echo [+] Phase 3: Initializing Database (SQLite) and Creating Users...
node scripts/setup_project.js
if %errorlevel% neq 0 (
    echo [!] ERROR: Database initialization failed.
    pause
    exit /b 1
)
echo [OK] Database and Test Accounts setup complete.
echo.

:: 4. UPDATE INFO.TXT (Done inside setup_project.js but informing here)
echo [+] Phase 4: Updating Project Information (info.txt)...
echo [OK] info.txt updated with login credentials.
echo.

echo ======================================================================
echo                      SETUP COMPLETED SUCCESSFULLY!
echo ======================================================================
echo.
echo Login Credentials (see info.txt for more details):
echo   - ADMIN:   admin / admin123
echo   - USER 1:  user / user123
echo   - USER 2:  user2 / user123
echo.
echo To start the project, use: npm start
echo THE PROJECT WILL NOW LAUNCH AT: http://localhost:3000
echo.
echo [Press any key to START THE PROJECT now, or close this window]
pause >nul

echo Starting server...
call npm start

endlocal
pause
 