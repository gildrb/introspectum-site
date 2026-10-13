# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.60.2", "certifi"]
# ///
"""Builds public/fonts/inter-latin.woff2 and inter-latin-ext.woff2 from the official Inter release.

    uv run scripts/inter.py

The site's characters (`interLatin` and `interLatinExtended`, src/layout.tsx), the features the
page uses (`fontFeatures`, src/tokens.stylex.ts), and weights 380 to 630: the heaviest is semibold
in the light scheme (`weights`, src/tokens.stylex.ts). Like Newsreader, two files: the browser
fetches the second, Latin Extended-A & arrows, only for a page whose text needs it.
"""

import io
import ssl
import urllib.request
import zipfile
from pathlib import Path

import certifi
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

RELEASE = "https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip"
OUTPUT = Path(__file__).resolve().parent.parent / "public/fonts"
# Must match `interLatin` and `interLatinExtended` in src/layout.tsx.
FILES = {
    "inter-latin.woff2": [
        (0x0020, 0x007E), (0x00A0, 0x00FF), (0x0131, 0x0131), (0x0152, 0x0153), (0x02C6, 0x02C6),
        (0x02DA, 0x02DA), (0x02DC, 0x02DC), (0x2010, 0x205E), (0x20AC, 0x20AC), (0x2122, 0x2122),
        (0x2212, 0x2212),
    ],
    "inter-latin-ext.woff2": [(0x0100, 0x0130), (0x0132, 0x0151), (0x0154, 0x017F), (0x2190, 0x21FF)],
}
FEATURES = ["calt", "case", "dnom", "frac", "kern", "locl", "numr", "tnum"]
WEIGHTS = (380, 630)


def main() -> None:
    # certifi's CA bundle, so the download verifies on any machine, whatever its system store.
    context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(RELEASE, context=context) as response:
        source = zipfile.ZipFile(io.BytesIO(response.read())).read("InterVariable.ttf")
    for name, ranges in FILES.items():
        font = TTFont(io.BytesIO(source), lazy=False)
        characters = sorted({c for start, end in ranges for c in range(start, end + 1)} & set(font.getBestCmap()))
        options = subset.Options()
        options.layout_features = FEATURES
        options.name_IDs = ["*"]
        options.notdef_outline = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=characters)
        subsetter.subset(font)
        font = instancer.instantiateVariableFont(font, {"wght": WEIGHTS})
        font.flavor = "woff2"
        font.save(OUTPUT / name)
        print(f"{name}: {len(characters)} characters, {(OUTPUT / name).stat().st_size} bytes")


if __name__ == "__main__":
    main()
