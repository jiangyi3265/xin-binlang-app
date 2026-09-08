# -*- coding: utf-8 -*-
"""
用 bl-icon 图标库里的同一套矢量数据，光栅化出 tabBar 需要的 81×81 PNG。
（小程序原生 tabBar 只接受图片文件，不能用组件，所以这里离线生成。）

用法：  python scripts/gen-tabbar.py
依赖：  本机 Chrome（无头模式截图）

改图标 / 改配色后重跑即可，产物落在 static/tabbar/。
"""
import os
import re
import subprocess
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_JS = os.path.join(ROOT, "components", "bl-icon", "icons.js")
OUT_DIR = os.path.join(ROOT, "static", "tabbar")
CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

INACTIVE = "#94A39A"
ACTIVE = "#0E3B2E"

# (图标名, 输出文件前缀)
TABS = [
    ("home", "home"),
    ("ticket", "record"),
    ("scroll-text", "rules"),
]

SIZE = 81      # 微信 tabBar 推荐 81×81
PAD = 10       # 四周留白，视觉重量更接近系统图标


def load_icons():
    src = open(ICONS_JS, encoding="utf-8").read()
    body = src[src.index("const ICONS = {"):]
    pat = re.compile(r"(?m)^\t(?:'([^']+)'|([A-Za-z][\w-]*))\s*:\s*'((?:[^'\\]|\\.)*)'")
    return {(m.group(1) or m.group(2)): m.group(3) for m in pat.finditer(body)}


def render(inner, color, out_png):
    box = SIZE - PAD * 2
    html = (
        '<!doctype html><meta charset="utf-8">'
        '<style>html,body{margin:0;padding:0;background:transparent}'
        'svg{position:absolute;left:%dpx;top:%dpx}</style>'
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="%d" height="%d" '
        'fill="none" stroke="%s" stroke-width="1.9" stroke-linecap="round" '
        'stroke-linejoin="round">%s</svg>' % (PAD, PAD, box, box, color, inner)
    )
    fd, path = tempfile.mkstemp(suffix=".html")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write(html)
    subprocess.run([
        CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
        "--default-background-color=00000000",
        "--screenshot=" + out_png,
        "--window-size=%d,%d" % (SIZE, SIZE),
        "file:///" + path.replace("\\", "/"),
    ], capture_output=True)
    os.unlink(path)


def main():
    icons = load_icons()
    os.makedirs(OUT_DIR, exist_ok=True)
    for name, out in TABS:
        inner = icons[name]
        render(inner, INACTIVE, os.path.join(OUT_DIR, out + ".png"))
        render(inner, ACTIVE, os.path.join(OUT_DIR, out + "-on.png"))
        print("  ->", out + ".png /", out + "-on.png")
    print("tabBar 图标已生成：", OUT_DIR)


if __name__ == "__main__":
    main()
