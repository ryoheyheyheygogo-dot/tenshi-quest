"""
日本語フォントを ゲームで使う文字だけに しぼって 軽くする（Web版の読み込みを速くするため）。
data/ や scripts/ の文章を 変えて、新しい漢字や記号を 使ったときに 実行してください。

  pip install fonttools
  python tools/make_font.py  [元フォント(.ttc/.otf/.ttf)]

元フォントの例: NotoSansCJK-Bold.ttc / NotoSansJP-Bold.otf / M PLUS Rounded 1c など（OFLライセンスのもの）
"""
import glob, sys
from fontTools.ttLib import TTCollection, TTFont
from fontTools import subset

src = sys.argv[1] if len(sys.argv) > 1 else "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"
chars = set()
for f in glob.glob("data/**/*.json", recursive=True) + glob.glob("js/**/*.js", recursive=True) + ["index.html"]:
    chars |= set(open(f, encoding="utf-8").read())
for a, b in [(0x20, 0x7E), (0x3000, 0x303F), (0x3041, 0x309F), (0x30A0, 0x30FF), (0xFF01, 0xFF5E)]:
    chars |= {chr(c) for c in range(a, b + 1)}
chars |= set("★☆♪♥…‥〜ー・「」『』、。！？（）")
chars = {c for c in chars if ord(c) >= 0x20}

if src.lower().endswith(".ttc"):
    font = next(f for f in TTCollection(src).fonts if "JP" in (f["name"].getDebugName(1) or ""))
else:
    font = TTFont(src)
opts = subset.Options()
opts.layout_features = ["*"]
opts.name_IDs = ["*"]
opts.name_languages = ["*"]
opts.notdef_outline = True
s = subset.Subsetter(opts)
s.populate(text="".join(sorted(chars)))
s.subset(font)
font.save("fonts/youchien_font.otf")
font.flavor = "woff"
font.save("fonts/youchien_font.woff")
print("fonts/youchien_font.otf と .woff を つくりました（%d 文字）" % len(chars))
