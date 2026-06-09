@echo off
echo Starting GovQ Development Servers...

:: Start Django Backend
echo Starting Django Backend on port 8001...
start cmd /k "cd /d %~dp0 && .\venv\Scripts\activate && python manage.py runserver 8001"

:: Start Vite Frontend
echo Starting React Frontend on port 5174...
start cmd /k "cd /d %~dp0frontend && npm run dev"

echo Both servers are starting up!
echo Backend: http://localhost:8001
echo Frontend: http://localhost:5174
