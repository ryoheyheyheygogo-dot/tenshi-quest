"""
assets/ にある 画像・音声の 一覧（assets/manifest.json）を つくる。
ゲームは この一覧に のっている ファイルだけを 読みに行くので、ない画像を さがす通信（404）が なくなる。

Netlify では デプロイのたびに 自動で 実行されます（netlify.toml の command）。
手で 実行する場合： python3 tools/make_manifest.py
※ 一覧を つくった後に 画像を 足したら、もう一度 実行してください（一覧に ない画像は 使われません）。
"""
import json, os

files = []
for dirpath, _, names in os.walk("assets"):
    for n in names:
        if n.startswith(".") or n == "manifest.json":
            continue
        files.append(os.path.relpath(os.path.join(dirpath, n), "assets").replace(os.sep, "/"))
files.sort()
with open("assets/manifest.json", "w", encoding="utf-8") as f:
    json.dump({"files": files}, f, ensure_ascii=False, indent=1)
print("assets/manifest.json: %d ファイル" % len(files))
