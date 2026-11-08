// 小さな道具

export const wait = (ms) => new Promise((r) => setTimeout(r, ms));
export const rand = (a, b) => a + Math.random() * (b - a);

/** 要素をつくる。el("div", {cls:"label", text:"..."}) */
export function el(tag, opts = {}) {
  const e = document.createElement(tag);
  if (opts.cls) e.className = opts.cls;
  if (opts.text != null) e.textContent = opts.text;
  if (opts.html != null) e.innerHTML = opts.html;
  if (opts.style) Object.assign(e.style, opts.style);
  if (opts.parent) opts.parent.appendChild(e);
  return e;
}

/** ステージ座標（1280×720）で 置く */
export function place(e, x, y, w, h) {
  e.style.left = x + "px";
  e.style.top = y + "px";
  if (w != null) e.style.width = w + "px";
  if (h != null) e.style.height = h + "px";
  return e;
}

/** Web Animations を Promise で */
export function anim(e, keyframes, opts) {
  const a = e.animate(keyframes, typeof opts === "number" ? { duration: opts, fill: "forwards" } : { fill: "forwards", ...opts });
  return a.finished.catch(() => {});
}

export function fadeRemove(e, delay = 0, dur = 300) {
  return anim(e, [{ opacity: 1 }, { opacity: 0 }], { duration: dur, delay }).then(() => e.remove());
}

/** 画面上の タッチ位置を ステージ座標（1280×720）に */
export function stagePoint(ev) {
  const r = document.getElementById("stage").getBoundingClientRect();
  const s = r.width / 1280;
  return { x: (ev.clientX - r.left) / s, y: (ev.clientY - r.top) / s };
}
