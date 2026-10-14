@echo off
echo [DEV] Fog of War: http://localhost:8000 (з debug-меню)
python scripts\setmode.py dev
start http://localhost:8000
python scripts\serve.py 8000
