@echo off
echo [DEV] Fog of War: http://localhost:8000 (з debug-меню)
python scripts\setmode.py dev
start http://localhost:8000
python -m http.server 8000
