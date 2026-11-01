import os
import re

PATTERNS = {
    "Google API Key": re.compile(r"AIza[0-9A-Za-z\-_]{35}"),
    "OpenAI Key": re.compile(r"sk-[a-zA-Z0-9]{32,}"),
    "PayPal Live Secret": re.compile(r"PAYPAL_CLIENT_SECRET\s*=\s*['\"][A-Za-z0-9_-]{25,}['\"]"),
    "Gemini Live Secret": re.compile(r"GEMINI_API_KEY\s*=\s*['\"][A-Za-z0-9_-]{25,}['\"]"),
}

EXCLUDE_DIRS = {"node_modules", "venv", ".git", "dist", "__pycache__", ".pytest_cache"}
EXCLUDE_EXTS = {".png", ".jpg", ".jpeg", ".ico", ".svg", ".lock"}

def scan():
    findings = []
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            ext = os.path.splitext(file)[1].lower()
            if ext in EXCLUDE_EXTS:
                continue
            path = os.path.join(current_root, file)
            # Skip this scanner script itself
            if os.path.abspath(path) == os.path.abspath(__file__):
                continue
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, 1):
                        for name, pat in PATTERNS.items():
                            if pat.search(line):
                                findings.append({
                                    "file": os.path.relpath(path, root_dir),
                                    "line": line_num,
                                    "type": name
                                })
            except Exception:
                pass
    return findings

if __name__ == "__main__":
    results = scan()
    print(f"SECURITY_SCAN_RESULTS: {len(results)} issues found")
    for r in results:
        print(f" - [{r['type']}] in {r['file']}:{r['line']}")
