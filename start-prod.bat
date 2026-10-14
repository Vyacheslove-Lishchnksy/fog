@echo off
echo [PROD] Fog of War: http://localhost:8001 (чистий, без debug-меню)
python scripts\setmode.py prod
start http://localhost:8001
python -m http.server 8001
