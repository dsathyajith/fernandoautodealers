@echo off
title Fernando React App
cd /d "%~dp0client"
echo Installing client dependencies...
call npm install
echo.
echo Starting Fernando React App on http://localhost:5173
echo.
call npm run dev
pause
