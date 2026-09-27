"""Prepare only the static files needed by GitHub Pages."""
import json
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / "_site"

subprocess.run([sys.executable, str(ROOT / "tools" / "build_catalog.py")], cwd=ROOT, check=True)
catalog = json.loads((ROOT / "catalog.json").read_text(encoding="utf-8"))

if SITE.exists():
    shutil.rmtree(SITE)
SITE.mkdir()

for filename in ("index.html", "catalog.json", "manifest.webmanifest", "sw.js"):
    shutil.copy2(ROOT / filename, SITE / filename)

for folder in ("css", "js", "icons"):
    shutil.copytree(ROOT / folder, SITE / folder)

curricula = {entry["curriculum"] for entry in catalog}
for curriculum in curricula:
    shutil.copytree(ROOT / curriculum, SITE / curriculum)

(SITE / ".nojekyll").touch()
print(f"Static site prepared in {SITE}")
