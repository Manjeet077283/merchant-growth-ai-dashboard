@echo off
title Merchant Growth AI - Server Launcher
color 0b
echo =====================================================================
echo           Merchant Growth AI - PayPal AI Hackathon 2026
echo =====================================================================
echo.
echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8000 ...
start "Merchant Growth AI - Backend API" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "Merchant Growth AI - React Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo =====================================================================
echo  Both servers are launched!
echo  - Frontend Dashboard: http://localhost:5173
echo  - Backend API Docs:   http://127.0.0.1:8000/docs
echo =====================================================================
echo.
pause
