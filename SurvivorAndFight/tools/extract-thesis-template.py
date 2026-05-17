# -*- coding: utf-8 -*-
"""Extract text from thesis PDF template for LaTeX drafting."""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "本科毕业设计(论文)参考模板-计算机学院.pdf"
OUT = ROOT / "docs" / "thesis-template-requirements.txt"

def main():
  """Prefer Node fallback if Python/pypdf unavailable: node tools/extract-thesis-template.cjs"""
  try:
        from pypdf import PdfReader
  except ImportError:
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "pypdf", "-q"])
        from pypdf import PdfReader

  reader = PdfReader(str(PDF))
    lines = [
        f"PAGES: {len(reader.pages)}",
        "---METADATA---",
    ]
    if reader.metadata:
        for k, v in reader.metadata.items():
            lines.append(f"{k}: {v}")
    lines.append("---FULL TEXT---")
    for i, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        lines.append(f"===== PAGE {i + 1} =====")
        lines.append(text)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({len(lines)} lines)")
    print("\n".join(lines[:80]))

if __name__ == "__main__":
    main()
