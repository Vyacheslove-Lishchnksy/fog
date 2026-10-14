"""Перемикач локального режиму: python scripts/setmode.py [dev|prod].

Ставить DEBUG: true/false в config.js (створює його з config.example.js,
якщо нема). Ключі Supabase при цьому не чіпає.
"""
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONFIG = ROOT / "config.js"
EXAMPLE = ROOT / "config.example.js"

mode = sys.argv[1] if len(sys.argv) > 1 else "dev"
if mode not in ("dev", "prod"):
    print("usage: setmode.py [dev|prod]")
    sys.exit(1)

if not CONFIG.exists():
    shutil.copy(EXAMPLE, CONFIG)
    print("config.js created from example")

text = CONFIG.read_text(encoding="utf-8")
value = "true" if mode == "dev" else "false"
if re.search(r"DEBUG\s*:\s*(true|false)", text):
    text = re.sub(r"DEBUG\s*:\s*(true|false)", f"DEBUG: {value}", text)
else:
    text = text.replace(
        "window.FOW_CONFIG = {", f"window.FOW_CONFIG = {{\n  DEBUG: {value},", 1
    )
CONFIG.write_text(text, encoding="utf-8")
print(f"local mode: {mode} (DEBUG={value})")
