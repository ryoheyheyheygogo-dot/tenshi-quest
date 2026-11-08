// 共通の UI 部品（大きなボタン・会話ウィンドウ・カード・キーボード・ハート）

import { Assets } from "./assets.js";
import { DB } from "./data.js";
import { Game } from "./game.js";
import { Voice } from "./voice.js";
import { el, place, anim, wait } from "./util.js";
import { shadeColor } from "./color.js";

export const INK = "#3a2e2a";

// ---------- 基本 ----------

export function label(parent, text, { x = 0, y = 0, w = 1280, h = 60, size = 36, color = INK, align = "center", valign = "center", outline = null, outlineWidth = null } = {}) {
  const e = el("div", { cls: "label", text, parent });
  place(e, x, y, w, h);
  e.style.fontSize = size + "px";
  e.style.color = color;
  if (align === "left") e.classList.add("left");
  if (valign === "top") e.classList.add("top");
  if (outline) {
    e.classList.add("outline");
    e.style.setProperty("--oc", outline);
    e.style.setProperty("--ow", (outlineWidth || Math.max(2, Math.round(size * 0.07))) + "px");
  }
  return e;
}

export function panel(parent, x, y, w, h, { bg = "#fffaf0", border = "#8a6d5a", bw = 5, radius = 28 } = {}) {
  const e = el("div", { cls: "panel", parent });
  place(e, x, y, w, h);
  Object.assign(e.style, { background: bg, borderColor: border, borderWidth: bw + "px", borderRadius: radius + "px" });
  return e;
}

/** 大きなボタン。icon を入れると アイコン＋文字 */
export function button(parent, text, { x = 0, y = 0, w = 300, h = 120, color = "#ff8a65", size = 40, icon = "", iconSize = 0, onClick = null, textColor = "#fff" } = {}) {
  const b = el("button", { cls: "btn", parent });
  place(b, x, y, w, h);
  b.style.background = color;
  b.style.borderColor = shadeColor(color, -0.25);
  b.style.fontSize = size + "px";
  if (icon) {
    const isz = iconSize || Math.min(w, h) * 0.5;
    const ic = Assets.icon(icon, isz);
    ic.classList.add("ic");
    b.appendChild(ic);
  }
  if (text) {
    const t = el("span", { cls: "tx", text, parent: b });
    t.style.color = textColor;
    if (textColor === "#fff") {
      t.classList.add("outline");
      t.style.setProperty("--oc", shadeColor(color, -0.4));
      t.style.setProperty("--ow", "2.5px");
    }
  }
  b.addEventListener("pointerdown", () => { Voice.unlock(); Assets.sound("pop"); });
  if (onClick) b.addEventListener("click", (ev) => { ev.stopPropagation(); if (!b.disabled) onClick(ev); });
  return b;
}

export function dim(parent) {
  return el("div", { cls: "dim", parent });
}

export function popIn(e, delay = 0) {
  return anim(e, [{ transform: "scale(.2)", opacity: 0 }, { transform: "scale(1.08)", opacity: 1, offset: 0.7 }, { transform: "scale(1)", opacity: 1 }],
    { duration: 380, delay, easing: "ease-out" });
}

export function toast(parent, text) {
  const t = label(parent, text, { x: 0, y: 300, w: 1280, h: 80, size: 44, color: "#fff", outline: "#ff7a7a", outlineWidth: 4 });
  t.style.zIndex = 50;
  anim(t, [{ transform: "translateY(0)", opacity: 1 }, { transform: "translateY(-40px)", opacity: 1, offset: 0.2 }, { transform: "translateY(-40px)", opacity: 1, offset: 0.8 }, { transform: "translateY(-40px)", opacity: 0 }], 1700)
    .then(() => t.remove());
}

// ---------- 会話ウィンドウ ----------
// lines = [{ speaker, text, voice }]。画面のどこを タッチしても すすむ。おわると Promise が かえる。

export function dialogue(parent, lines, extra = {}) {
  return new Promise((resolve) => {
    if (!lines || !lines.length) { resolve(); return; }
    const root = el("div", { cls: "fill", parent });
    root.dataset.role = "dialogue";
    root.style.zIndex = 40;
    const box = panel(root, 40, 470, 1200, 230);
    const portrait = el("div", { cls: "abs", parent: box });
    place(portrait, 20, 20, 190, 190);
    const text = label(box, "", { x: 230, y: 30, w: 830, h: 170, size: 40, align: "left", valign: "top" });
    text.style.lineHeight = "1.55";
    const plate = panel(root, 70, 430, 380, 64, { bg: "#ff8a65", border: "#d4623f", bw: 4, radius: 20 });
    const name = label(plate, "", { x: 0, y: 0, w: 372, h: 56, size: 34, color: "#fff" });
    let current = { text: "", voice: "" };
    const replay = button(box, "", { x: 1070, y: 20, w: 110, h: 110, color: "#4db6ac", icon: "speaker", iconSize: 64,
      onClick: () => Voice.speak(current.text, current.voice) });
    replay.style.zIndex = 2;
    const next = Assets.icon("next", 80, "#ff8a65");
    place(next, 1090, 140);
    next.classList.add("nudge");
    box.appendChild(next);

    let i = -1;
    let typing = null;
    const show = () => {
      i++;
      if (i >= lines.length) {
        Voice.stop();
        root.remove();
        resolve();
        return;
      }
      const line = lines[i];
      const sp = line.speaker || "narrator";
      current = { text: Game.format(line.text, extra), voice: line.voice || "" };
      const nm = Game.format(DB.speakerName(sp));
      plate.style.display = nm ? "" : "none";
      name.textContent = nm;
      portrait.innerHTML = "";
      const v = speakerVisual(sp);
      if (v) {
        portrait.appendChild(v);
        place(text, 230, 30, 830, 170);
      } else {
        place(text, 40, 30, 1020, 170);
      }
      // 1もじずつ
      next.style.visibility = "hidden";
      const full = current.text;
      let n = 0;
      text.textContent = "";
      clearInterval(typing);
      typing = setInterval(() => {
        n++;
        text.textContent = full.slice(0, n);
        if (n >= full.length) { clearInterval(typing); typing = null; next.style.visibility = "visible"; }
      }, 45);
      Voice.speak(current.text, current.voice);
    };
    root.addEventListener("click", () => {
      if (typing) {
        clearInterval(typing);
        typing = null;
        text.textContent = current.text;
        next.style.visibility = "visible";
      } else {
        show();
      }
    });
    show();
  });
}

function speakerVisual(sp) {
  if (sp === "hero") {
    const g = Game.heroGender();
    return Assets.visual("characters", [`face_hero_${g}_${Game.heroColorId()}`, `face_hero_${g}`], 190, 190, `hero_${g}`, Game.heroColor());
  }
  const info = DB.speakers[sp] || {};
  if (!info.visual) return null;
  return Assets.visual("characters", ["face_" + info.visual, info.visual], 190, 190, info.kind || "teacher", info.color || "#7a5cff");
}

// ---------- おもいでカード ----------

export function cardPopup(parent, cardId, isNew) {
  return new Promise((resolve) => {
    const c = DB.card(cardId);
    const root = el("div", { cls: "fill", parent });
    root.dataset.role = "card-popup";
    root.style.zIndex = 45;
    dim(root);
    label(root, isNew ? "おもいでカード ゲット！" : c.title || "", { x: 0, y: 18, w: 1280, h: 90, size: 56, color: "#fff", outline: "#ff7a9a", outlineWidth: 5 });
    if (isNew) {
      const shine = Assets.visual("effects", "card_shine", 520, 520, "sparkle", "#fff59d");
      place(shine, 130, 110);
      shine.classList.add("spin");
      root.appendChild(shine);
    }
    const art = Assets.visual("cards", cardId, 330, 440, "card", "#ffb74d");
    place(art, 225, 150);
    root.appendChild(art);
    popIn(art);
    const info = panel(root, 600, 150, 600, 440, { border: "#e0b04a", bw: 6, radius: 30 });
    label(info, c.title || "", { x: 20, y: 24, w: 550, h: 70, size: 46, color: "#d4623f" });
    const body = label(info, c.text || "", { x: 36, y: 110, w: 520, h: 200, size: 36, align: "left", valign: "top" });
    body.style.lineHeight = "1.5";
    const note = label(info, c.parent_note || "", { x: 36, y: 320, w: 520, h: 100, size: 22, color: "#8a7d74", align: "left", valign: "top" });
    note.style.whiteSpace = "normal";
    const say = (prefix = "") => Voice.speak(prefix + (c.title || "") + "。" + (c.text || ""), "card/" + cardId);
    button(root, "きく", { x: 600, y: 600, w: 200, h: 110, color: "#4db6ac", size: 34, icon: "speaker", iconSize: 56, onClick: () => say() });
    button(root, "やったね", { x: 840, y: 600, w: 360, h: 110, color: "#ff8a65", size: 40, icon: "check", iconSize: 56,
      onClick: () => { Voice.stop(); root.remove(); resolve(); } });
    Assets.sound(isNew ? "card" : "pop");
    say(isNew ? "おもいでカード ゲット！ " : "");
  });
}

// ---------- ひらがなキーボード ----------

const COLUMNS = [
  ["あ", "い", "う", "え", "お"], ["か", "き", "く", "け", "こ"], ["さ", "し", "す", "せ", "そ"], ["た", "ち", "つ", "て", "と"],
  ["な", "に", "ぬ", "ね", "の"], ["は", "ひ", "ふ", "へ", "ほ"], ["ま", "み", "む", "め", "も"], ["や", "", "ゆ", "", "よ"],
  ["ら", "り", "る", "れ", "ろ"], ["わ", "", "を", "", "ん"], ["゛", "゜", "小", "ー", ""],
];
const KEY_COLORS = ["#ff8a80", "#ffab40", "#f9c623", "#8bd650", "#4fd99a", "#33b5f0", "#7c4dff", "#ff80ab", "#d36ef0", "#6f9cff", "#a1887f"];

export function keyboard(parent, x0, y0, onKey) {
  const KW = 92, KH = 76, GAP = 8;
  COLUMNS.forEach((col, c) => {
    col.forEach((ch, r) => {
      if (!ch) return;
      button(parent, ch, { x: x0 + c * (KW + GAP), y: y0 + r * (KH + GAP), w: KW, h: KH, color: shadeColor(KEY_COLORS[c], -0.08), size: 44, onClick: () => onKey(ch) });
    });
  });
}

const DAKUTEN = { か: "が", き: "ぎ", く: "ぐ", け: "げ", こ: "ご", さ: "ざ", し: "じ", す: "ず", せ: "ぜ", そ: "ぞ", た: "だ", ち: "ぢ", つ: "づ", て: "で", と: "ど", は: "ば", ひ: "び", ふ: "ぶ", へ: "べ", ほ: "ぼ", う: "ゔ" };
const HANDAKUTEN = { は: "ぱ", ひ: "ぴ", ふ: "ぷ", へ: "ぺ", ほ: "ぽ" };
const SMALL = { あ: "ぁ", い: "ぃ", う: "ぅ", え: "ぇ", お: "ぉ", つ: "っ", や: "ゃ", ゆ: "ゅ", よ: "ょ", わ: "ゎ" };

/** 最後の文字に ゛゜小 を つけたり はずしたり */
export function applyModifier(text, mod) {
  if (!text) return text;
  const last = text.slice(-1);
  const head = text.slice(0, -1);
  const table = mod === "゛" ? DAKUTEN : mod === "゜" ? HANDAKUTEN : SMALL;
  let base = last;
  for (const t of [DAKUTEN, HANDAKUTEN, SMALL]) for (const k in t) if (t[k] === last) base = k;
  if (base !== last && table[base] === last) return head + base;
  if (table[base]) return head + table[base];
  return text;
}

// ---------- なかよしハート ----------

export class HeartGauge {
  constructor(parent, x, y, w, max, size = 48) {
    this.max = max;
    this.value = 0;
    this.size = size;
    this.root = el("div", { cls: "abs", parent });
    place(this.root, x, y, w, size);
    Object.assign(this.root.style, { display: "flex", justifyContent: "center", gap: "4px" });
    this.slots = [];
    for (let i = 0; i < max; i++) {
      const s = el("div", { parent: this.root });
      Object.assign(s.style, { position: "relative", width: size + "px", height: size + "px" });
      this.slots.push(s);
      this._set(i, false);
    }
  }
  _set(i, full) {
    const s = this.slots[i];
    s.innerHTML = "";
    const v = Assets.visual("ui", full ? "heart_full" : "heart_empty", this.size, this.size, full ? "heart_full" : "heart_empty");
    s.appendChild(v);
    if (full) anim(v, [{ transform: "scale(1.7)" }, { transform: "scale(1)" }], { duration: 250, easing: "ease-out" });
  }
  async add(n) {
    const target = Math.min(this.max, this.value + n);
    while (this.value < target) {
      this._set(this.value, true);
      this.value++;
      Assets.sound("heart");
      await wait(120);
    }
  }
  get full() { return this.value >= this.max; }
}
