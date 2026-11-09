// 画像・音の 読み込み係。
// assets/<しゅるい>/<ID>.png があれば それを使い、なければ 仮素材（art.js）を 描く。
// → 画像は ファイルを置くだけで 差し替わる。

import { artSvg } from "./art.js?v=20261109201037";
import { el } from "./util.js?v=20261109201037";
import { VERSION } from "./version.js?v=20261109201037";

// manifest.json が あるときは その一覧どおりに、ないときは png → webp、mp3 だけを さがす（ムダな通信を へらす）
const IMAGE_EXTS_ALL = ["png", "webp", "jpg"];
const AUDIO_EXTS_ALL = ["mp3", "m4a", "ogg", "wav"];
const found = new Map(); // "category/id" -> url | null | Promise

/** assets/manifest.json があれば それに のっている ファイルだけ 探す（404 を へらす） */
let manifest = null;

/** 画像が 試作で つかえない アイコン（仮素材の まま） */
const SKIP_ICON_IMAGE = new Set(["special"]);

export const Assets = {
  /** true にすると 仮素材に ファイル名を表示（画像づくりの確認用） */
  showPlaceholderNames: false,

  async init() {
    try {
      const res = await fetch(`assets/manifest.json?v=${VERSION}`, { cache: "no-cache" });
      if (res.ok) manifest = new Set((await res.json()).files || []);
    } catch (e) { manifest = null; }
  },

  /** 画像の URL を さがす（なければ null） */
  findImage(category, id) {
    const key = `${category}/${id}`;
    if (found.has(key)) return found.get(key);
    const p = (async () => {
      for (const ext of manifest ? IMAGE_EXTS_ALL : ["png", "webp"]) {
        const url = `assets/${category}/${id}.${ext}?v=${VERSION}`;
        if (manifest && !manifest.has(`${category}/${id}.${ext}`)) continue;
        if (await probeImage(url)) return url;
      }
      return null;
    })();
    found.set(key, p);
    p.then((v) => found.set(key, v));
    return p;
  },

  /**
   * 表示部品をつくる。ids は 先頭から順に さがして 最初に見つかった画像を使う。
   * 見つかるまでは 仮素材の SVG が表示される。
   */
  visual(category, ids, w, h, kind, color = "#ffffff") {
    const box = el("div", { cls: "vis" });
    box.style.width = w + "px";
    box.style.height = h + "px";
    const list = (Array.isArray(ids) ? ids : [ids]).filter(Boolean);
    const showImg = (url) => { box.innerHTML = ""; el("img", { parent: box }).src = url; };
    const showArt = () => {
      box.innerHTML = artSvg(kind, color);
      if (this.showPlaceholderNames && list.length) {
        const tag = el("div", { cls: "label", text: `${category}/${list[0]}`, parent: box });
        Object.assign(tag.style, { left: 0, right: 0, bottom: 0, height: "22px", fontSize: "14px", color: "#fff", background: "rgba(0,0,0,.45)" });
      }
    };
    // すでに 調べてある ものは すぐ 表示（仮素材が 一瞬 見えるのを ふせぐ）
    let pending = false;
    for (const id of list) {
      const v = found.get(`${category}/${id}`);
      if (v === undefined || v instanceof Promise) { pending = true; break; }
      if (v) { showImg(v); return box; }
    }
    if (!pending) { showArt(); return box; }
    // まだ わからないときは 何も出さずに 待ち、画像が なければ 仮素材
    (async () => {
      for (const id of list) {
        const url = await this.findImage(category, id);
        if (url) { showImg(url); return; }
      }
      showArt();
    })();
    return box;
  },

  /** よく使う 画像を 先に 調べておく（起動時） */
  warm(pairs) {
    return Promise.all(pairs.map(([c, id]) => this.findImage(c, id)));
  },

  icon(name, size, color = "#ffffff") {
    // 試作素材（2026/11/9）の注意：
    // ・icon_speaker_off.png は icon_speaker.png と まったく同じ絵 → オンの絵に 赤い ななめ線を かさねて「オフ」に する
    // ・icon_special.png は icon_aisatsu.png と まったく同じ絵（おひさま）→ バトルで 見分けが つかないので 仮素材（ほし）を つかう
    //   ちゃんと 別の絵が とどいたら SKIP_ICON_IMAGE から はずせば 画像が つかわれます
    const id = name === "speaker_off" ? "icon_speaker" : "icon_" + name;
    const box = SKIP_ICON_IMAGE.has(name)
      ? this.visual("ui", [], size, size, "icon_" + name, color)
      : this.visual("ui", id, size, size, "icon_" + name, color);
    box.classList.add("smooth"); // 256px の絵を 小さく するので なめらかに
    if (name !== "speaker_off") return box;
    // 画像の 読みこみで 中身が 入れかわっても 線が 消えないよう、外がわの 枠に 線を のせる
    const wrap = el("div", { cls: "vis" });
    wrap.style.width = size + "px";
    wrap.style.height = size + "px";
    box.style.left = "0px";
    box.style.top = "0px";
    wrap.appendChild(box);
    el("div", { cls: "icon-slash", parent: wrap });
    return wrap;
  },

  /** 音声ファイルの URL（なければ null） */
  async findAudio(folder, id) {
    if (!id) return null;
    const key = `audio:${folder}/${id}`;
    if (found.has(key)) return found.get(key);
    const p = (async () => {
      for (const ext of manifest ? AUDIO_EXTS_ALL : ["mp3"]) {
        if (manifest && !manifest.has(`${folder}/${id}.${ext}`)) continue;
        const url = `assets/${folder}/${id}.${ext}?v=${VERSION}`;
        try {
          const res = await fetch(url, { method: "HEAD" });
          if (res.ok && !(res.headers.get("content-type") || "").includes("text/html")) return url;
        } catch (e) { /* つぎへ */ }
      }
      return null;
    })();
    found.set(key, p);
    p.then((v) => found.set(key, v));
    return p;
  },

  /** 効果音（assets/sounds/<id>.mp3 などが あれば） */
  async sound(id) {
    const url = await this.findAudio("sounds", id);
    if (!url) return;
    const a = new Audio(url);
    a.volume = 0.8;
    a.play().catch(() => {});
  },
};

function probeImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 0);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
