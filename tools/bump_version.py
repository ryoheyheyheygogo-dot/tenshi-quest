"""
更新を アップロードしたのに 古い画面のまま…を ふせぐ道具（キャッシュ対策）。
プログラム・画像・データの URL の うしろに「?v=日時」を つけて、ブラウザに 新しい ファイルだと 知らせる。

更新を アップロードする 前に 毎回 実行してください：  python3 tools/bump_version.py
（Netlify の 自動デプロイでは 自動で 実行されます。画像の一覧 assets/manifest.json も いっしょに 作ります）
"""
import re, glob, datetime, sys
v = sys.argv[1] if len(sys.argv) > 1 else datetime.datetime.now().strftime("%Y%m%d%H%M%S")
open("js/version.js", "w", encoding="utf-8").write(f'// 自動で 書きかわります（tools/bump_version.py）\nexport const VERSION = "{v}";\n')
pat = re.compile(r'''((?:from|import)\s*\(?\s*["'])(\.{1,2}/[^"'?]+\.js)(\?v=[^"']*)?(["'])''')
for f in glob.glob("js/**/*.js", recursive=True):
    s = open(f, encoding="utf-8").read()
    s2 = pat.sub(lambda m: f"{m.group(1)}{m.group(2)}?v={v}{m.group(4)}", s)
    if s2 != s: open(f, "w", encoding="utf-8").write(s2)
h = open("index.html", encoding="utf-8").read()
h = re.sub(r'src="js/main\.js(\?v=[^"]*)?"', f'src="js/main.js?v={v}"', h)
h = re.sub(r'href="css/style\.css(\?v=[^"]*)?"', f'href="css/style.css?v={v}"', h)
open("index.html", "w", encoding="utf-8").write(h)
print("version:", v)
# 画像の 一覧（assets/manifest.json）も つくりなおす
import runpy; runpy.run_path("tools/make_manifest.py")
