@echo off
echo ==============================================
echo       Starting PokemonDB Servers
echo ==============================================
echo.
echo Starting Flask Backend Server...
cd backend
start cmd /k "title PokemonDB Backend Server && echo Starting Flask API... && "..\..\.venv\Scripts\python.exe" app.py"

echo Starting Vite Frontend Server...
cd ..\frontend
start cmd /k "title PokemonDB Frontend Server && echo Starting Vite Dev Server... && npm run dev"

echo.
echo Servers have been launched in separate windows!
echo You can safely close this window.
exit
