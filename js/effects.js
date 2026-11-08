// バトルの 演出（ひっさつわざ・コマンド・なかよし成功）
// 画像は assets/effects/<ID>.png があれば それを使う（fist / tower / penguin / sparkle / heart）

import { Assets } from "./assets.js";
import { el, place, anim, wait, rand, fadeRemove } from "./util.js";
import { label } from "./ui.js";

export class Effects {
  constructor(parent) {
    this.root = el("div", { cls: "fill", parent });
    this.root.style.pointerEvents = "none";
    this.root.style.zIndex = 20;
  }

  spawn(id, kind, w, h, cx, cy, color) {
    const v = Assets.visual("effects", id, w, h, kind, color);
    place(v, cx - w / 2, cy - h / 2);
    this.root.appendChild(v);
    return v;
  }

  flash(color = "rgba(255,255,255,.8)") {
    const f = el("div", { cls: "fill", parent: this.root, style: { background: color } });
    fadeRemove(f, 50, 300);
  }

  bigText(text, color, outline) {
    const t = label(this.root, text, { y: 40, h: 130, size: 84, color, outline, outlineWidth: 7 });
    anim(t, [{ transform: "scale(.3)" }, { transform: "scale(1.1)", offset: 0.7 }, { transform: "scale(1)" }], { duration: 300 });
    return t;
  }

  async hearts(cx, cy, count = 5, spread = 160) {
    for (let i = 0; i < count; i++) {
      const h = this.spawn("heart", "heart_full", 56, 56, cx + rand(-spread, spread), cy + rand(-40, 40));
      const up = rand(120, 200);
      anim(h, [{ transform: "translateY(0)", opacity: 1 }, { transform: `translateY(${-up * 0.6}px)`, opacity: 1, offset: 0.55 }, { transform: `translateY(${-up}px)`, opacity: 0 }],
        { duration: 900, easing: "ease-out" }).then(() => h.remove());
      await wait(60);
    }
  }

  async command(cmdId, cx, cy, good) {
    const ic = Assets.visual("ui", "icon_" + cmdId, 180, 180, "icon_" + cmdId, "#ffffff");
    place(ic, cx - 90, cy - 220);
    this.root.appendChild(ic);
    anim(ic, [{ transform: "scale(.2)" }, { transform: `scale(${good ? 1.25 : 1})` }], { duration: 300, easing: "cubic-bezier(.3,1.6,.6,1)" });
    fadeRemove(ic, 800, 300);
    await wait(400);
    if (good) {
      this.flash("rgba(255,242,153,.5)");
      await this.hearts(cx, cy, 8);
    } else {
      await this.hearts(cx, cy, 2, 80);
    }
    await wait(300);
  }

  async special(effectId, cx, cy) {
    if (effectId === "fukufuku_punch") return this.fukufuku(cx, cy);
    if (effectId === "tower_beam") return this.towerBeam(cx, cy);
    if (effectId === "penguin_parade") return this.penguins(cx, cy);
    this.flash();
    return this.hearts(cx, cy, 10);
  }

  async fukufuku(cx, cy) {
    const t = this.bigText("ふくふくふく！", "#ffb74d", "#bf360c");
    t.animate([{ marginLeft: "12px" }, { marginLeft: "-12px" }], { duration: 100, iterations: 10, direction: "alternate" });
    for (let i = 0; i < 16; i++) {
      const f = this.spawn("fist", "fist", 120, 120, cx + rand(-170, 170), cy + rand(-150, 120));
      const r = rand(-35, 35);
      anim(f, [{ transform: `rotate(${r}deg) scale(.3)` }, { transform: `rotate(${r}deg) scale(1.15)` }], 120);
      fadeRemove(f, 150, 200);
      Assets.sound("punch");
      await wait(70);
    }
    const big = this.spawn("fist", "fist", 260, 260, cx, cy);
    anim(big, [{ transform: "scale(.2)" }, { transform: "scale(1.3)" }], { duration: 250, easing: "cubic-bezier(.3,1.6,.6,1)" });
    this.flash();
    await wait(500);
    fadeRemove(big);
    fadeRemove(t, 200);
    await this.hearts(cx, cy, 10);
  }

  async towerBeam(cx, cy) {
    // スプライトシート（assets/effects/tower_beam_0〜11.png）が あれば カットイン演出
    const frames = await this.loadFrames("tower_beam", 12);
    if (frames) return this.towerBeamCutin(frames, cx, cy);
    const t = this.bigText("かいきょうゆめタワービーム！", "#e1f5fe", "#5c6bc0");
    const tower = Assets.visual("effects", "tower", 180, 520, "tower");
    place(tower, 60, 170);
    this.root.appendChild(tower);
    await anim(tower, [{ transform: "translateY(590px)" }, { transform: "translateY(-20px)", offset: 0.8 }, { transform: "translateY(0)" }], { duration: 600, easing: "ease-out" });
    const top = { x: 150, y: 230 };
    const glow = this.spawn("sparkle", "sparkle", 140, 140, top.x, top.y, "#fff59d");
    glow.animate([{ transform: "rotate(0)" }, { transform: "rotate(90deg)" }], { duration: 150, iterations: 4 });
    await wait(600);
    // ビーム（てっぺんから モンスターへ）
    const dx = cx - top.x, dy = cy - top.y;
    const len = Math.hypot(dx, dy);
    const beam = el("div", { cls: "abs", parent: this.root });
    Object.assign(beam.style, {
      left: top.x + "px", top: top.y - 35 + "px", width: len + "px", height: "70px",
      transformOrigin: "0 50%", transform: `rotate(${Math.atan2(dy, dx)}rad)`,
      background: "linear-gradient(#fff59d00, #fff59d 25%, #ffffff 45%, #ffffff 55%, #fff59d 75%, #fff59d00)",
      borderRadius: "35px",
    });
    anim(beam, [{ opacity: 0, height: "10px", marginTop: "30px" }, { opacity: 1, height: "70px", marginTop: "0px" }], 150);
    this.flash("rgba(255,255,204,.8)");
    for (let i = 0; i < 6; i++) {
      this.spawn("sparkle", "sparkle", 90, 90, cx + rand(-120, 120), cy + rand(-120, 120), "#ffffff");
      await wait(80);
    }
    await wait(400);
    for (const n of [...this.root.children]) if (n !== t) fadeRemove(n);
    fadeRemove(t, 200);
    await this.hearts(cx, cy, 10);
  }

  /** 連番画像 <name>_0 … を さがして 先に 読み込む（そろわなければ null） */
  async loadFrames(name, count) {
    const urls = [];
    for (let i = 0; i < count; i++) {
      const u = await Assets.findImage("effects", `${name}_${i}`);
      if (!u) return null;
      urls.push(u);
    }
    await Promise.all(urls.map((u) => new Promise((r) => { const im = new Image(); im.onload = im.onerror = r; im.src = u; })));
    return urls;
  }

  async towerBeamCutin(frames, cx, cy) {
    const box = el("div", { cls: "fill", parent: this.root });
    const dark = el("div", { cls: "fill", parent: box, style: { background: "rgba(10,14,40,.75)" } });
    const panel = el("div", { cls: "abs", parent: box });
    place(panel, 290, 60, 700, 576);
    Object.assign(panel.style, { border: "8px solid #fff59d", borderRadius: "24px", overflow: "hidden", boxShadow: "0 0 40px #4fc3f7", background: "#0d1b4a" });
    const img = el("img", { parent: panel, style: { width: "100%", height: "100%", display: "block" } });
    img.src = frames[0];
    anim(panel, [{ transform: "scale(.6)", opacity: 0 }, { transform: "scale(1)", opacity: 1 }], { duration: 220, easing: "ease-out" });
    const t = label(box, "かいきょうゆめタワービーム！", { y: 630, h: 80, size: 56, color: "#e1f5fe", outline: "#283593", outlineWidth: 6 });
    anim(t, [{ transform: "scale(.4)" }, { transform: "scale(1.1)", offset: 0.7 }, { transform: "scale(1)" }], 300);
    // コマごとの 表示時間（ms）：ためる → ひかる → ビーム（くりかえし）→ ばくはつ
    const seq = [[0, 260], [1, 260], [2, 130], [3, 130], [4, 130], [5, 130], [6, 150],
      [7, 110], [8, 110], [9, 110], [8, 110], [9, 110], [10, 160], [11, 380], [11, 0]];
    for (const [f, ms] of seq) {
      img.src = frames[f];
      if (f === 7) this.flash("rgba(200,240,255,.5)");
      if (f === 10) Assets.sound("punch");
      if (ms) await wait(ms);
    }
    await wait(250);
    await fadeRemove(box, 0, 250);
    // モンスターに とどく
    this.flash("rgba(255,255,204,.8)");
    for (let i = 0; i < 6; i++) {
      const s = this.spawn("sparkle", "sparkle", 90, 90, cx + rand(-120, 120), cy + rand(-120, 120), "#ffffff");
      fadeRemove(s, 400, 300);
      await wait(70);
    }
    await this.hearts(cx, cy, 10);
  }

  async penguins(cx, cy) {
    const t = this.bigText("ペンギン ぞろぞろ ヒール！", "#e0f7fa", "#00838f");
    const y = cy + 150;
    for (let i = 0; i < 7; i++) {
      const p = Assets.visual("effects", "penguin", 110, 110, "penguin");
      place(p, -140, y - 55 + (i % 2) * 18);
      this.root.appendChild(p);
      p.animate([{ rotate: "10deg" }, { rotate: "-10deg" }], { duration: 220, iterations: 12, direction: "alternate" });
      anim(p, [{ translate: "0 0" }, { translate: "1560px 0" }], { duration: 2600, easing: "linear" }).then(() => p.remove());
      await wait(220);
    }
    for (let i = 0; i < 4; i++) {
      this.hearts(cx, cy, 3, 140);
      await wait(350);
    }
    await wait(600);
    fadeRemove(t);
    await this.hearts(cx, cy, 6);
  }

  async friendSuccess(cx, cy) {
    this.flash("rgba(255,204,230,.7)");
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI * 2 * i) / 12;
      const h = this.spawn("heart", "heart_full", 60, 60, cx, cy);
      anim(h, [{ transform: "translate(0,0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * 260}px, ${Math.sin(a) * 260}px)`, opacity: 0 }],
        { duration: 900, easing: "ease-out" }).then(() => h.remove());
    }
    for (let i = 0; i < 8; i++) {
      const s = this.spawn("sparkle", "sparkle", 80, 80, cx + rand(-260, 260), cy + rand(-200, 160), "#fff59d");
      fadeRemove(s, 500, 400);
    }
    await wait(900);
  }
}
