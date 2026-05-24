#!/usr/bin/env python3
"""导出论文插图到 thesis/Png/（调用 Node 脚本，需已安装 Node.js）。"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NODE_SCRIPT = ROOT / "scripts" / "export-thesis-png.mjs"


def main() -> int:
    if not NODE_SCRIPT.is_file():
        print(f"未找到: {NODE_SCRIPT}", file=sys.stderr)
        return 1
    print("==> 调用 node scripts/export-thesis-png.mjs")
    return subprocess.call(["node", str(NODE_SCRIPT)], cwd=str(ROOT))


if __name__ == "__main__":
    raise SystemExit(main())
