#!/usr/bin/env python3
"""Run the pricing tests with QuickJS — no Node.js required.

    pip install quickjs
    python3 tests/run-tests.py
"""

import json
import sys
from pathlib import Path

try:
    import quickjs
except ImportError:
    sys.exit("QuickJS is not installed. Run: pip install quickjs")

ROOT = Path(__file__).resolve().parent.parent

ctx = quickjs.Context()
ctx.eval("globalThis.window = globalThis;")

for relative in ("data/models.js", "assets/calc.js", "tests/calc.test.js"):
    ctx.eval((ROOT / relative).read_text(encoding="utf-8"))

report = json.loads(ctx.eval("JSON.stringify(globalThis.__testReport)"))

for result in report["results"]:
    suffix = "" if result["ok"] else " — " + result["error"]
    print(("ok   " if result["ok"] else "FAIL ") + result["name"] + suffix)

passed = report["total"] - report["failures"]
print(f"\n{passed}/{report['total']} passed")
sys.exit(1 if report["failures"] else 0)
