#!/usr/bin/env python3
"""
install_yoink.py

This installer installs the Python-based "yoink" command system‑wide on macOS.
It does the following:
  1. Installs the required dependency beautifulsoup4 using pip3 with the
     '--break-system-packages' flag.
  2. Writes the yoink script to /usr/local/bin/yoink and makes it executable.
  3. Modifies the original (non‑root) user’s ~/.zshrc to ensure /usr/local/bin is in PATH.

Usage (as root):
    sudo python3 install_yoink.py
"""

import os
import sys
import stat
import subprocess
import textwrap

# -----------------------------------------------------------------------------
# The yoink script (the tool itself)
# -----------------------------------------------------------------------------
YOINK_SCRIPT = textwrap.dedent(r'''#!/usr/bin/env python3
"""
Yoink: A pure-Python command that scans local files or fetches a website sitemap
in parallel, extracts text (using BeautifulSoup for web pages), and caps the
number of tokens pulled per file/page.

Usage:

  # Local File Mode:
  yoink              # scans current directory (or Git repo if available)
  yoink 2500         # override per-file token limit (default is 3333)

  # Website Mode:
  yoink "https://example.com"
  yoink "https://example.com" 2000   # override per-page token limit

Environment Variables (optional):
  OINK_MAX_LINES        (default 2000)
  OINK_MAX_LINE_LENGTH  (default 1000)
  OINK_MAX_FILE_TOKENS  (default 3333)
  OINK_AVG_TOKEN_LENGTH (default 4)
"""

import sys, os, re, time, subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from bs4 import BeautifulSoup
except ImportError:
    sys.exit("Error: beautifulsoup4 is required. Please install it.")

def copy_to_clipboard(text):
    from shutil import which
    if which("pbcopy"):
        proc = subprocess.Popen(["pbcopy"], stdin=subprocess.PIPE)
        proc.communicate(input=text.encode("utf-8"))

def progress_bar(current, total, start_time):
    if total <= 0:
        return
    width = 40
    frac = current / total
    filled = int(width * frac)
    bar = "[" + "#" * filled + "-" * (width - filled) + "]"
    percent = int(frac * 100)
    elapsed = time.time() - start_time
    if current > 0:
        total_est = elapsed * (total / current)
        remain = max(0, total_est - elapsed)
    else:
        remain = 0
    h = int(remain // 3600)
    m = int((remain % 3600) // 60)
    s = int(remain % 60)
    eta_str = f"{h:02d}:{m:02d}:{s:02d}"
    sys.stdout.write(f"\r{bar} {percent}% ({current}/{total}) ETA: {eta_str}")
    sys.stdout.flush()

def env_int(name, default):
    try:
        return int(os.environ.get(name, default))
    except:
        return default

def is_url(arg):
    return arg.startswith("http://") or arg.startswith("https://")

def run_file_mode(max_file_tokens):
    max_lines = env_int("OINK_MAX_LINES", 2000)
    max_line_length = env_int("OINK_MAX_LINE_LENGTH", 1000)
    avg_token_length = env_int("OINK_AVG_TOKEN_LENGTH", 4)
    max_chars = max_file_tokens * avg_token_length

    files = []
    in_git = False
    try:
        out = subprocess.check_output(["git", "rev-parse", "--show-toplevel"],
                                        stderr=subprocess.DEVNULL)
        in_git = True
    except Exception:
        in_git = False

    if in_git:
        try:
            out = subprocess.check_output(["git", "ls-files", "--exclude-standard",
                                            "--others", "--cached"],
                                            stderr=subprocess.DEVNULL)
            for line in out.splitlines():
                fname = line.decode("utf-8", "ignore").strip()
                if fname and not fname.startswith("."):
                    files.append(fname)
        except Exception:
            pass
    else:
        for root, dirs, fs in os.walk("."):
            if any(p.startswith(".") for p in root.split(os.sep) if p != "."):
                continue
            for f in fs:
                if f.startswith("."):
                    continue
                files.append(os.path.join(root, f))
    print(f"Scanning for source files...\nFound {len(files)} candidate file(s).")
    start_time = time.time()

    included = []
    total_included_size = 0

    for i, fpath in enumerate(files):
        progress_bar(i+1, len(files), start_time)
        ext = os.path.splitext(fpath)[1].lower()
        if ext in [".jpg",".jpeg",".png",".gif",".webp",".bmp",".tiff",".svg"]:
            continue
        try:
            with open(fpath, "rb") as rf:
                if b"\x00" in rf.read(4096):
                    continue
        except Exception:
            continue
        try:
            with open(fpath, "r", encoding="utf-8", errors="ignore") as rf:
                content = rf.read()
        except Exception:
            continue
        lines = content.splitlines()
        if len(lines) > max_lines or any(len(ln) > max_line_length for ln in lines):
            continue
        if len(content) > max_chars:
            content = content[:max_chars]
        try:
            fsize = os.path.getsize(fpath)
        except Exception:
            fsize = len(content)
        est_tokens = len(content) // avg_token_length
        included.append((est_tokens, fpath, content))
        total_included_size += len(content)
    print()
    merged_text = "\n".join(f"=== {p} ===\n{txt}" for (_, p, txt) in included)
    copy_to_clipboard(merged_text)
    total_est_tokens = total_included_size // avg_token_length
    ctx = "✅ (fits)" if total_est_tokens <= 128000 else "❌ (exceeds)"
    print(f"Copied content from {len(included)} file(s) to the clipboard.")
    print(f"Total estimated tokens on clipboard: {total_est_tokens} tokens (using ~{avg_token_length} bytes/token).")
    print(f"Context window (128k tokens): {ctx}\n")
    print("Top 5 files by estimated token count (largest first):")
    for est, path, _ in sorted(included, key=lambda x: x[0], reverse=True)[:5]:
        print(f"   {path}: {est} tokens")

def run_website_mode(url, max_file_tokens):
    import urllib.request
    from concurrent.futures import ThreadPoolExecutor, as_completed

    avg_token_length = env_int("OINK_AVG_TOKEN_LENGTH", 4)
    max_chars = max_file_tokens * avg_token_length
    user_agent = "Mozilla/5.0 (compatible; YoinkPy/1.0)"

    def fetch_page(u):
        req = urllib.request.Request(u, headers={"User-Agent": user_agent})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                html = resp.read()
        except Exception:
            return None, u
        if not html:
            return None, u
        soup = BeautifulSoup(html, "html.parser")
        text = soup.get_text(separator="\n")
        if len(text) > max_chars:
            text = text[:max_chars]
        est_tokens = len(text) // avg_token_length
        return est_tokens, u, text

    def attempt(u):
        req = urllib.request.Request(u, headers={"User-Agent": user_agent})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.read().decode("utf-8", "ignore")
        except:
            return ""

    base = url.rstrip("/")
    sitemap_data = attempt(base + "/sitemap.xml")
    if not sitemap_data:
        sitemap_data = attempt(base + "/sitemap_index.xml")
        if not sitemap_data:
            print(f"Error: Could not retrieve sitemap from {url}")
            sys.exit(1)
    locs = re.findall(r"<loc>(.*?)</loc>", sitemap_data, flags=re.IGNORECASE|re.DOTALL)
    total_urls = len(locs)
    print(f"Found {total_urls} URL(s) in the sitemap.")
    start_time = time.time()
    results = []
    with ThreadPoolExecutor(max_workers=8) as executor:
        futures = {executor.submit(fetch_page, l): l for l in locs}
        done_count = 0
        for fut in as_completed(futures):
            done_count += 1
            progress_bar(done_count, total_urls, start_time)
            sys.stdout.flush()
            res = fut.result()
            if res[0] is not None and res[2]:
                results.append(res)
    print()
    merged = "\n".join(f"=== {link} ===\n{text}" for (_, link, text) in results)
    copy_to_clipboard(merged)
    total_est_tokens = sum(r[0] for r in results)
    ctx = "✅ (fits)" if total_est_tokens <= 128000 else "❌ (exceeds)"
    print(f"Copied content from {len(results)} page(s) to the clipboard.")
    print(f"Total estimated tokens on clipboard: {total_est_tokens} tokens (using ~{avg_token_length} bytes/token).")
    print(f"Context window (128k tokens): {ctx}\n")
    print("Top 5 pages by estimated token count (largest first):")
    for est, link, _ in sorted(results, key=lambda x: x[0], reverse=True)[:5]:
        print(f"   {link}: {est} tokens")

def main():
    args = sys.argv[1:]
    if args and (args[0].startswith("http://") or args[0].startswith("https://")):
        url = args[0]
        try:
            max_tokens = int(args[1]) if len(args) > 1 else env_int("OINK_MAX_FILE_TOKENS", 3333)
        except:
            max_tokens = env_int("OINK_MAX_FILE_TOKENS", 3333)
        run_website_mode(url, max_tokens)
    else:
        try:
            max_tokens = int(args[0]) if args else env_int("OINK_MAX_FILE_TOKENS", 3333)
        except:
            max_tokens = env_int("OINK_MAX_FILE_TOKENS", 3333)
        run_file_mode(max_tokens)

if __name__ == "__main__":
    main()
''')

# -----------------------------------------------------------------------------
# Installer code: install YOINK_SCRIPT system-wide and modify user's ~/.zshrc.
# -----------------------------------------------------------------------------
def main():
    import os, stat, sys, subprocess, pwd
    # Install the yoink script to /usr/local/bin/yoink (system-wide on macOS)
    target_path = "/usr/local/bin/yoink"
    try:
        with open(target_path, "w", encoding="utf-8") as f:
            f.write(YOINK_SCRIPT)
    except Exception as e:
        sys.exit(f"Error: Could not write to {target_path}: {e}")
    st = os.stat(target_path)
    os.chmod(target_path, st.st_mode | stat.S_IEXEC)
    print(f"Installed yoink to: {target_path}")

    # Install dependency: beautifulsoup4 system-wide.
    try:
        print("Installing dependency: beautifulsoup4 ...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "--break-system-packages", "beautifulsoup4"])
    except subprocess.CalledProcessError as e:
        sys.exit(f"Error: Failed to install beautifulsoup4: {e}")

    # Modify the original (non-root) user's ~/.zshrc.
    sudo_user = os.environ.get("SUDO_USER")
    if sudo_user:
        try:
            user_info = pwd.getpwnam(sudo_user)
            user_home = user_info.pw_dir
        except KeyError:
            user_home = os.path.expanduser("~")
        zshrc = os.path.join(user_home, ".zshrc")
        path_line = 'export PATH="/usr/local/bin:$PATH"'
        if os.path.exists(zshrc):
            with open(zshrc, "r", encoding="utf-8") as f:
                contents = f.read()
            if path_line not in contents:
                with open(zshrc, "a", encoding="utf-8") as f:
                    f.write("\n# Added by yoink installer\n" + path_line + "\n")
                print(f"Modified {zshrc} to include /usr/local/bin in PATH.")
        else:
            with open(zshrc, "w", encoding="utf-8") as f:
                f.write(path_line + "\n")
            print(f"Created {zshrc} and added /usr/local/bin to PATH.")

    print("\nInstallation complete!")
    print("Ensure /usr/local/bin is in your PATH. If not, add the following line to your ~/.zshrc:")
    print('  export PATH="/usr/local/bin:$PATH"')
    print("\nNow you can run 'yoink' (for local file mode) or 'yoink <URL>' (for website mode).")
    print("Enjoy your Python-based yoink!")

if __name__ == "__main__":
    if os.geteuid() != 0:
        sys.exit("Error: Please run this installer with sudo, e.g. sudo python3 install_yoink.py")
    main()
