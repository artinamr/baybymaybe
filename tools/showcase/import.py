"""
THE SHOWCASE SITES: copies the three studio-built websites (Butter Days,
Blackridge, Outbound) from their working folders into public/sites/<slug>/,
where they are served as they are, under the Nerodyn site, for visitors to
click through from the case studies (/work/<slug>/).

What it changes on the way (nothing else):
  - leaves out the build tools, audit output, backups, raw photos and notes;
  - drops images no page, stylesheet or script refers to;
  - recompresses oversized JPEG fallbacks (every browser takes the WebP);
  - marks every page `noindex` and drops its canonical, robots.txt and
    sitemap: these are fictional businesses, and search engines should find
    the case study, not a bakery that doesn't exist;
  - rewrites the few em dashes a visitor can see (the site's writing rule).

usage: python tools/showcase/import.py [slug ...]   (default: all three)
Sources are read from SRC below; edit it if the folders move.
"""
import os
import re
import shutil
import sys

from PIL import Image

HOME = os.path.expanduser("~")
SRC = {
    "butter-days": os.path.join(HOME, "Downloads", "BUTTER DAYS — bakery, café and celebration cakes"),
    "blackridge": os.path.join(HOME, "Downloads", "BLACKRIDGE — architectural design studio"),
    "outbound": os.path.join(HOME, "Downloads", "OUTBOUND — New Zealand adventure company"),
}
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEST = os.path.join(ROOT, "public", "sites")

SKIP_DIRS = {"work", "tools", ".freebuff", ".photo-raw", ".git", "node_modules"}
SKIP_FILES = {"README.md", "HANDOFF.md", "robots.txt", "sitemap.xml", ".DS_Store", "Thumbs.db"}
TEXT = (".html", ".css", ".js", ".json", ".webmanifest", ".svg", ".txt")
IMAGES = (".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif")

# Visible em dashes, rewritten as sentences (not swapped for another dash).
EM_FIXES = {
    "butter-days": [
        ("Winter dates may have more flexibility — please get in touch", "Winter dates may have more flexibility, so please get in touch"),
        ("Swiss buttercream — light, glossy and not too sweet — then", "Swiss buttercream (light, glossy and not too sweet), then"),
        ("'Closed today — we rest on Mondays'", "'Closed today. We rest on Mondays'"),
        ("'Closed — opens at '", "'Closed. Opens at '"),
        ("'Closed — opens '", "'Closed. Opens '"),
        ("free from allergens — please contact us", "free from allergens, so please contact us"),
        ('"name": "Butter Days — Bakery', '"name": "Butter Days: Bakery'),
    ],
    "outbound": [
        ("we’ve scouted — which, given the terrain, is probably for the best.", "we’ve scouted, which, given the terrain, is probably for the best."),
        ('"Request noted locally — nothing has been sent"', '"Request noted locally. Nothing has been sent"'),
    ],
    "blackridge": [],
}


def copy_tree(src, dst):
    # Empty the folder rather than remove it (a shell sitting in it keeps it locked on Windows).
    if os.path.exists(dst):
        for x in os.listdir(dst):
            p = os.path.join(dst, x)
            shutil.rmtree(p) if os.path.isdir(p) else os.remove(p)
    for d, dirs, files in os.walk(src):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS]
        rel = os.path.relpath(d, src)
        out = os.path.join(dst, rel) if rel != "." else dst
        os.makedirs(out, exist_ok=True)
        for f in files:
            if f in SKIP_FILES:
                continue
            shutil.copy2(os.path.join(d, f), os.path.join(out, f))


def all_files(root, exts):
    for d, _, files in os.walk(root):
        for f in files:
            if f.lower().endswith(exts):
                yield os.path.join(d, f)


def read(p):
    with open(p, encoding="utf-8", errors="replace") as fh:
        return fh.read()


def write(p, s):
    with open(p, "w", encoding="utf-8", newline="") as fh:
        fh.write(s)


def prune_images(root):
    """Remove images that no text file mentions by name."""
    corpus = "\n".join(read(p) for p in all_files(root, TEXT))
    removed = 0
    freed = 0
    for p in list(all_files(root, IMAGES)):
        name = os.path.basename(p)
        if name not in corpus:
            freed += os.path.getsize(p)
            os.remove(p)
            removed += 1
    return removed, freed


def shrink_fallbacks(root, limit=150_000, max_w=1280):
    """JPEGs with a WebP sibling are fallbacks for old browsers: keep them modest."""
    saved = 0
    for p in list(all_files(root, (".jpg", ".jpeg"))):
        size = os.path.getsize(p)
        if size <= limit:
            continue
        stem = os.path.splitext(p)[0]
        folder = os.path.dirname(p)
        base = os.path.basename(stem)
        has_webp = any(f.startswith(base) and f.endswith(".webp") for f in os.listdir(folder))
        if not has_webp:
            continue
        im = Image.open(p)
        im = im.convert("RGB")
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        im.save(p, "JPEG", quality=72, optimize=True, progressive=True)
        saved += size - os.path.getsize(p)
    return saved


def shrink_large(root, webp_limit=250_000, jpg_limit=380_000, max_w=2000):
    """Very high-quality WebPs and lone JPEGs: re-encode at a normal web quality (only if smaller)."""
    saved = 0
    for p in list(all_files(root, (".webp", ".jpg", ".jpeg"))):
        size = os.path.getsize(p)
        webp = p.endswith(".webp")
        if size <= (webp_limit if webp else jpg_limit):
            continue
        im = Image.open(p).convert("RGB")
        if im.width > max_w:
            im = im.resize((max_w, round(im.height * max_w / im.width)), Image.LANCZOS)
        tmp = p + ".tmp"
        if webp:
            im.save(tmp, "WEBP", quality=76, method=4)
        else:
            im.save(tmp, "JPEG", quality=76, optimize=True, progressive=True)
        if os.path.getsize(tmp) < size * 0.92:
            saved += size - os.path.getsize(tmp)
            os.replace(tmp, p)
        else:
            os.remove(tmp)
    return saved


def tidy_html(root, slug):
    fixes = EM_FIXES.get(slug, [])
    hits = {a: 0 for a, _ in fixes}
    for p in all_files(root, (".html", ".js", ".webmanifest")):
        s = read(p)
        o = s
        for a, b in fixes:
            if a in s:
                hits[a] += s.count(a)
                s = s.replace(a, b)
        if p.endswith(".html"):
            # Ranges ("Tue – Fri", "7am – 3pm") take a closed en dash, as on the rest of the site.
            s = re.sub(r"(?<=[\w.])\s+(?:–|&ndash;)\s+(?=\w)", "&ndash;", s)
            s = re.sub(r'\s*<link rel="canonical"[^>]*>', "", s)
            s = re.sub(r'\s*<link rel="sitemap"[^>]*>', "", s)
            if 'name="robots"' in s:
                s = re.sub(r'<meta name="robots" content="[^"]*"\s*/?>', '<meta name="robots" content="noindex, follow">', s)
            else:
                s = re.sub(r"(<meta charset=[^>]*>)", r'\1\n  <meta name="robots" content="noindex, follow">', s, count=1)
        if s != o:
            write(p, s)
    missing = [a for a, n in hits.items() if n == 0]
    if missing:
        print("  ! em dash fixes that matched nothing:", missing)


def size_of(root):
    return sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(root) for f in fs)


def main():
    slugs = sys.argv[1:] or list(SRC)
    for slug in slugs:
        src, dst = SRC[slug], os.path.join(DEST, slug)
        copy_tree(src, dst)
        before = size_of(dst)
        removed, freed = prune_images(dst)
        saved = shrink_fallbacks(dst) + shrink_large(dst)
        tidy_html(dst, slug)
        left = []
        for p in all_files(dst, (".html", ".js", ".json", ".webmanifest", ".txt")):
            s = read(p)
            if p.endswith(".js"):
                # comments may keep their dashes; strings may not
                s = re.sub(r"/\*[\s\S]*?\*/|//[^\n]*", "", s)
            if "—" in s:
                left.append(os.path.relpath(p, dst))
        print(f"{slug}: {before / 1e6:.1f} MB copied, {removed} unused images ({freed / 1e6:.1f} MB) dropped, "
              f"{saved / 1e6:.1f} MB saved on fallbacks -> {size_of(dst) / 1e6:.1f} MB")
        if left:
            print("  ! em dashes still visible in:", left)


if __name__ == "__main__":
    main()
