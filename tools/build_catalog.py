"""Generate the static catalog used by LearnVocab to discover lessons."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORED = {".git", ".github", "_site", "css", "js", "tools", "icons", "node_modules", "__pycache__"}

catalog = []
for curriculum_dir in sorted(ROOT.iterdir(), key=lambda path: (path.name.casefold() != "tettei", path.name.casefold())):
    if not curriculum_dir.is_dir() or curriculum_dir.name in IGNORED or curriculum_dir.name.startswith("."):
        continue
    for lesson_file in sorted(curriculum_dir.rglob("lesson*.js"), key=lambda path: str(path).casefold()):
        catalog.append({
            "path": lesson_file.relative_to(ROOT).as_posix(),
            "name": lesson_file.name,
            "curriculum": curriculum_dir.name,
            "curriculumLabel": curriculum_dir.name.replace("_", " ").replace("-", " ").title(),
        })

(ROOT / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print(f"Catalog updated: {len(catalog)} lessons across {len({item['curriculum'] for item in catalog})} curricula.")
