# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.60.2", "certifi"]
# ///
"""Builds public/fonts/newsreader-*.woff2 from Google Fonts' Newsreader 1.003 (v26).

    uv run scripts/newsreader.py

Google Fonts' Latin and Latin Extended files, upright and italic, with the weight axis cut to 400
to 800: the site sets nothing lighter than regular (`weights`, src/tokens.stylex.ts). Cutting only
below the default weight leaves every outline from 400 up exactly as it was, so the pages render
pixel for pixel as with the full files; each file is a third smaller.
"""

import io
import ssl
import urllib.request
from pathlib import Path

import certifi
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

BASE = "https://fonts.gstatic.com/s/newsreader/v26/"
FILES = {
    "newsreader-latin.woff2": "cY9AfjOCX1hbuyalUrK4397yjA.woff2",
    "newsreader-latin-ext.woff2": "cY9AfjOCX1hbuyalUrK439DyjJBG.woff2",
    "newsreader-italic-latin.woff2": "cY9CfjOCX1hbuyalUrK439vCjohC.woff2",
    "newsreader-italic-latin-ext.woff2": "cY9CfjOCX1hbuyalUrK439vCgIhCFpY.woff2",
}
OUTPUT = Path(__file__).resolve().parent.parent / "public/fonts"
# From the default weight up: the upper masters, and so the outlines from 400 up, stay untouched.
WEIGHTS = (400, 800)


def main() -> None:
    # certifi's CA bundle, so the download verifies on any machine, whatever its system store.
    context = ssl.create_default_context(cafile=certifi.where())
    for name, source in FILES.items():
        with urllib.request.urlopen(BASE + source, context=context) as response:
            font = TTFont(io.BytesIO(response.read()), lazy=False)
        font = instancer.instantiateVariableFont(font, {"wght": WEIGHTS})
        font.flavor = "woff2"
        font.save(OUTPUT / name)
        print(f"{name}: {(OUTPUT / name).stat().st_size} bytes")


if __name__ == "__main__":
    main()
