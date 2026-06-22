@echo off
echo ==============================================
echo       Starting PokemonDB Server
echo ==============================================
echo.
echo Starting Vite Frontend Server...
cd frontend
start cmd /k "title PokemonDB Frontend Server && echo Starting Vite Dev Server... && npm run dev"

echo.
echo Server has been launched in a separate window!
echo You can safely close this window.
exit
