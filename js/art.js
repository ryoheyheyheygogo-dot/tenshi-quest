// 仮素材（画像が届くまでの代わり）を SVG で描く。
// assets/ に 画像を置けば こちらは 使われなくなる。

const INK = "#3a2e2a";
const SKIN = "#ffd9b8";
const HAIR = "#4a3426";

function shade(hex, amt) {
  // amt > 0 で あかるく、< 0 で くらく
  let c = hex.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const n = parseInt(c, 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt));
  r = f(r); g = f(g); b = f(b);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

const circle = (x, y, r, fill, extra = "") => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
const ellipse = (x, y, rx, ry, fill, extra = "") => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${fill}" ${extra}/>`;
const rect = (x, y, w, h, rx, fill, extra = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const poly = (pts, fill, extra = "") => `<polygon points="${pts}" fill="${fill}" ${extra}/>`;
const line = (x1, y1, x2, y2, stroke, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round"/>`;
const path = (d, stroke, w, fill = "none") => `<path d="${d}" stroke="${stroke}" stroke-width="${w}" fill="${fill}" stroke-linecap="round" stroke-linejoin="round"/>`;

function eyes(cx, cy, spread, r = 5.5, sleepy = false) {
  if (sleepy) return line(cx - spread - 5, cy, cx - spread + 5, cy, INK, 2.5) + line(cx + spread - 5, cy, cx + spread + 5, cy, INK, 2.5);
  return circle(cx - spread, cy, r, INK) + circle(cx + spread, cy, r, INK) +
    circle(cx - spread - 1.5, cy - 2, r * 0.38, "#fff") + circle(cx + spread - 1.5, cy - 2, r * 0.38, "#fff");
}
const smile = (cx, cy, w = 7) => path(`M${cx - w} ${cy} Q${cx} ${cy + w} ${cx + w} ${cy}`, INK, 2.4);
const cheeks = (cx, cy, spread) => circle(cx - spread, cy, 4.5, "rgba(255,120,130,.5)") + circle(cx + spread, cy, 4.5, "rgba(255,120,130,.5)");
const shadow = (cx, cy, rx) => ellipse(cx, cy, rx, rx * 0.18, "rgba(0,0,0,.15)");

export function heartPath(cx, cy, s, fill) {
  const d = `M${cx} ${cy + s * 0.42} C${cx - s * 0.62} ${cy + s * 0.02} ${cx - s * 0.5} ${cy - s * 0.5} ${cx} ${cy - s * 0.18} C${cx + s * 0.5} ${cy - s * 0.5} ${cx + s * 0.62} ${cy + s * 0.02} ${cx} ${cy + s * 0.42}Z`;
  return `<path d="${d}" fill="${fill}"/>`;
}

function star(cx, cy, outer, inner, n, fill) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = -Math.PI / 2 + (Math.PI * i) / n;
    const r = i % 2 === 0 ? outer : inner;
    pts.push(`${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`);
  }
  return poly(pts.join(" "), fill);
}

// ---------- キャラクター（100×100） ----------
function person(color, girl, adult, plainAdult = false) {
  const hr = adult ? 20 : 24;
  const hy = adult ? 34 : 38;
  const bodyTop = hy + hr * 0.7;
  const bh = adult ? 42 : 32;
  const bw = adult ? 40 : 44;
  const hair = adult && !plainAdult ? "#b9b9b9" : HAIR;
  let s = shadow(50, bodyTop + bh + 2, bw * 0.6);
  s += rect(50 - bw / 2, bodyTop, bw, bh, 8, color);
  if (adult) s += rect(50 - bw * 0.3, bodyTop + bh * 0.25, bw * 0.6, bh * 0.7, 4, "rgba(255,255,255,.85)");
  if (girl) s += circle(50 - hr, hy + hr * 0.2, hr * 0.42, hair) + circle(50 + hr, hy + hr * 0.2, hr * 0.42, hair);
  s += circle(50, hy, hr, SKIN);
  s += `<path d="M${50 - hr * 1.04} ${hy - hr * 0.2} A${hr * 1.04} ${hr * 0.85} 0 0 1 ${50 + hr * 1.04} ${hy - hr * 0.2}Z" fill="${hair}"/>`;
  const fy = hy + hr * 0.2;
  s += eyes(50, fy, 9, 4.5) + smile(50, fy + 6, 5) + cheeks(50, fy + 4, 14);
  if (adult && !plainAdult) s += `<circle cx="41" cy="${fy}" r="6" fill="none" stroke="${INK}" stroke-width="1.6"/><circle cx="59" cy="${fy}" r="6" fill="none" stroke="${INK}" stroke-width="1.6"/>`;
  if (girl) s += circle(50 + hr * 0.6, hy - hr * 0.8, hr * 0.22, shade(color, 0.2));
  return s;
}

function monsterBlob(c) {
  return shadow(50, 94, 34) + ellipse(50, 58, 40, 36, c) + ellipse(38, 42, 10, 6, "rgba(255,255,255,.35)") +
    ellipse(58, 18, 12, 6, "#4caf50") + line(50, 24, 53, 16, "#2e7d32", 2.5) +
    eyes(50, 56, 13) + smile(50, 66, 7) + cheeks(50, 66, 24);
}
function monsterRed(c) {
  let s = shadow(50, 93, 32);
  for (let i = 0; i < 5; i++) { const x = 22 + 14 * i; s += poly(`${x - 8},40 ${x + 8},40 ${x},18`, shade(c, -0.15)); }
  s += circle(50, 60, 34, c) + eyes(50, 58, 12) + path("M42 70 A8 8 0 0 0 58 70", INK, 3) + cheeks(50, 68, 22);
  s += rect(78, 78, 12, 12, 3, "#4a90e2") + rect(8, 80, 10, 10, 3, "#f5c518");
  return s;
}
function monsterGhost(c) {
  return `<path d="M16 50 A34 34 0 0 1 84 50 L84 88 L72 82 L61 90 L50 82 L39 90 L28 82 L16 88Z" fill="${c}"/>` +
    eyes(50, 50, 12, 5, true) + ellipse(50, 64, 5, 6, INK) + `<text x="72" y="22" font-size="16" fill="${INK}">z</text>`;
}
function monsterPlant(c) {
  let s = rect(32, 68, 36, 24, 6, "#c8873a") + line(50, 68, 50, 48, "#4caf50", 4) + ellipse(34, 56, 10, 5, "#66bb6a");
  for (let i = 0; i < 6; i++) { const a = (Math.PI * 2 * i) / 6; s += circle(50 + Math.cos(a) * 17, 38 + Math.sin(a) * 17, 11, c); }
  return s + circle(50, 38, 15, "#ffe08a") + eyes(50, 38, 6, 3.5) + cheeks(50, 43, 9);
}
function monsterDragon(c) {
  return ellipse(14, 50, 14, 20, shade(c, -0.2)) + ellipse(86, 50, 14, 20, shade(c, -0.2)) + circle(50, 58, 33, c) +
    poly("38,30 28,34 30,14", "#fff3d6") + poly("62,30 72,34 70,14", "#fff3d6") +
    ellipse(50, 72, 18, 12, "#fff3d6") + eyes(50, 52, 12) + smile(50, 68, 6);
}
function chest(c, open) {
  let s = shadow(50, 85, 42) + rect(10, 45, 80, 40, 6, c, `stroke="${shade(c, -0.35)}" stroke-width="3"`);
  if (open) s += rect(10, 12, 80, 20, 8, shade(c, -0.1), `stroke="${shade(c, -0.35)}" stroke-width="3"`) + star(50, 42, 14, 6, 5, "#ffe66d");
  else s += rect(8, 25, 84, 22, 10, shade(c, 0.1), `stroke="${shade(c, -0.35)}" stroke-width="3"`) + rect(44, 40, 12, 14, 3, "#ffd54f");
  return s;
}

// ---------- はいけい（1280×720） ----------
function bgYard(era = "") {
  if (era === "showa") return bgShowa();
  if (era === "hajimari") return bgHajimari();
  let s = rect(0, 0, 1280, 720, 0, "#9ed36a") + rect(0, 0, 1280, 44, 0, "#cfe9ff");
  s += rect(154, 50, 972, 245, 8, "#fff6e5", `stroke="#d9b98c" stroke-width="3"`);
  s += poly("115,86 1165,86 1101,14 179,14", "#ff7a7a");
  for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; s += rect(218 + 147 * i, 122, 102, 72, 6, "#bfe3ff", `stroke="#d9b98c" stroke-width="2"`); }
  s += rect(582, 144, 115, 151, 6, "#c98b52") + circle(640, 43, 25, "#ffd54f");
  s += ellipse(640, 518, 563, 187, "#f2dea6");
  s += rect(64, 360, 154, 72, 8, "#e9c784", `stroke="#b98a4a" stroke-width="3"`);
  s += line(1024, 360, 1178, 446, "#4a90e2", 14) + line(1024, 360, 1024, 432, "#7a7a7a", 6);
  for (const [x, y] of [[64, 144], [1216, 158], [51, 662], [1229, 648]]) {
    s += circle(x, y + 36, 14, "#8d6e63") + circle(x, y, 50, "#5cb85c") + circle(x - 14, y - 14, 22, "#7ed37e");
  }
  for (let i = 0; i < 12; i++) s += circle(77 + 102 * i, i % 2 === 0 ? 324 : 698, 5, i % 3 ? "#ffb3d1" : "#fff176");
  if (era === "heisei") {
    // うんどうかいの ばんこっき と ゴールテープ
    s += path("M0 30 Q640 120 1280 30", "#888", 2);
    const cols = ["#e8505b", "#3d7eea", "#f2b705", "#3bb273", "#bd5ce0"];
    for (let i = 0; i < 20; i++) { const x = 32 + i * 64, y = 30 + Math.sin((i / 19) * Math.PI) * 88; s += poly(`${x - 14},${y} ${x + 14},${y} ${x},${y + 30}`, cols[i % 5]); }
    s += line(560, 420, 560, 520, "#7a7a7a", 6) + line(720, 420, 720, 520, "#7a7a7a", 6) + line(560, 440, 720, 440, "#ffffff", 5);
  }
  return s;
}
function bgShowa() {
  let s = rect(0, 0, 1280, 720, 0, "#c9b98f") + rect(0, 0, 1280, 44, 0, "#e9dcc0");
  s += rect(154, 50, 972, 245, 4, "#b98a5a", `stroke="#7a5230" stroke-width="4"`);
  for (let i = 0; i < 24; i++) s += line(170 + i * 40, 60, 170 + i * 40, 290, "rgba(90,55,25,.35)", 3);
  s += poly("115,86 1165,86 1101,14 179,14", "#6d6d6d");
  for (let i = 0; i < 6; i++) { if (i === 2 || i === 3) continue; s += rect(218 + 147 * i, 122, 102, 72, 2, "#e8f1f2", `stroke="#5a3d22" stroke-width="5"`) + line(269 + 147 * i, 122, 269 + 147 * i, 194, "#5a3d22", 3); }
  s += rect(582, 144, 115, 151, 2, "#7a5230");
  s += ellipse(640, 518, 563, 187, "#dccaa0");
  // てつぼう
  s += line(80, 360, 80, 440, "#555", 6) + line(220, 360, 220, 440, "#555", 6) + line(80, 370, 220, 370, "#888", 5);
  for (const [x, y] of [[64, 144], [1216, 158], [51, 662], [1229, 648]]) s += circle(x, y + 36, 14, "#8d6e63") + circle(x, y, 50, "#6d9b4a");
  return s;
}
function bgHajimari() {
  let s = rect(0, 0, 1280, 720, 0, "#a5d67a") + rect(0, 0, 1280, 130, 0, "#d6efff");
  s += circle(1080, 60, 40, "#ffd54f");
  // ちいさな さいしょの えんしゃ
  s += rect(470, 110, 340, 185, 4, "#f3e3c3", `stroke="#8d6e63" stroke-width="4"`) + poly("440,130 840,130 640,40", "#8d6e63");
  s += rect(600, 200, 80, 95, 3, "#8d6e63") + rect(500, 150, 70, 50, 3, "#cfe9ff", `stroke="#8d6e63" stroke-width="3"`) + rect(710, 150, 70, 50, 3, "#cfe9ff", `stroke="#8d6e63" stroke-width="3"`);
  s += ellipse(640, 530, 520, 170, "#e9d8a6");
  // はたけ と さくら
  for (let i = 0; i < 5; i++) s += line(60, 330 + i * 20, 300, 330 + i * 20, "#7cb342", 6);
  for (const [x, y] of [[1050, 330], [180, 640], [1150, 640]]) s += circle(x, y + 40, 14, "#8d6e63") + circle(x, y, 56, "#ffc1d6") + circle(x - 16, y - 14, 24, "#ffe0eb");
  return s;
}
function bgDoors() {
  let s = `<defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5e35b1"/><stop offset="1" stop-color="#f48fb1"/></linearGradient></defs>`;
  s += rect(0, 0, 1280, 720, 0, "url(#dg)");
  for (let i = 0; i < 40; i++) s += star((i * 211) % 1280, (i * 97) % 600, 6 + (i % 3) * 3, 2.5, 4, "rgba(255,255,255,.8)");
  for (let i = 0; i < 6; i++) s += `<circle cx="640" cy="380" r="${120 + i * 90}" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="18"/>`;
  return s;
}
function bgBattle() {
  let s = rect(0, 0, 1280, 432, 0, "#bfe6ff") + rect(0, 432, 1280, 288, 0, "#a8dc7a");
  for (const [x, y] of [[192, 108], [896, 72], [576, 180]]) s += ellipse(x, y, 90, 29, "#fff") + ellipse(x + 50, y - 14, 64, 29, "#fff");
  return s + ellipse(640, 432, 256, 36, "rgba(0,0,0,.08)");
}
function bgTitle() {
  let s = rect(0, 0, 1280, 720, 0, "#bfe6ff") + circle(1088, 130, 65, "#ffd54f");
  for (const [x, y] of [[230, 115], [704, 72]]) s += ellipse(x, y, 102, 36, "#fff") + ellipse(x + 64, y - 22, 77, 36, "#fff");
  s += rect(0, 518, 1280, 202, 0, "#9ed36a") + rect(320, 360, 640, 180, 8, "#fff6e5", `stroke="#d9b98c" stroke-width="3"`);
  s += poly("282,374 998,374 640,274", "#ff7a7a") + rect(602, 432, 77, 108, 6, "#c98b52");
  return s;
}

// ---------- とびら・スタンプ・き ----------
function door(c) {
  // viewBox 0 0 250 330
  return rect(10, 20, 230, 310, 115, shade(c, -0.35)) + rect(26, 36, 198, 294, 99, c) +
    rect(46, 60, 158, 250, 79, shade(c, 0.25)) + star(125, 150, 46, 20, 5, "#fff59d") +
    circle(185, 220, 11, "#ffd54f") + `<rect x="0" y="318" width="250" height="12" rx="6" fill="rgba(0,0,0,.2)"/>`;
}
function stamp() {
  return circle(50, 50, 44, "rgba(255,255,255,.85)", `stroke="#e53935" stroke-width="7"`) +
    `<circle cx="50" cy="50" r="34" fill="none" stroke="#e53935" stroke-width="3"/>` +
    `<text x="50" y="62" font-size="30" font-weight="bold" text-anchor="middle" fill="#e53935">クリア</text>`;
}
function tree(bloomed) {
  // viewBox 0 0 100 100
  let s = shadow(50, 96, 30) + poly("44,96 56,96 54,58 46,58", "#8d6e63") + line(50, 66, 34, 52, "#8d6e63", 4) + line(50, 62, 66, 48, "#8d6e63", 4);
  const green = bloomed ? "#9ccc65" : "#7cb342";
  for (const [x, y, r] of [[50, 36, 26], [30, 46, 18], [70, 46, 18], [38, 26, 16], [62, 26, 16]]) s += circle(x, y, r, green);
  if (bloomed) {
    // はなを はっぱの なかに ちらす（ひまわりの たねの ならびかた）
    for (let i = 0; i < 34; i++) {
      const r = 24 * Math.sqrt((i + 0.5) / 34), a = i * 2.39996;
      const x = 50 + Math.cos(a) * r * 1.35, y = 36 + Math.sin(a) * r * 0.85;
      s += circle(x.toFixed(1), y.toFixed(1), 3.6, i % 4 === 0 ? "#fff59d" : "#ff8fb3") + circle(x.toFixed(1), y.toFixed(1), 1.3, "#fff");
    }
    s += star(50, 8, 9, 4, 5, "#ffd54f");
  }
  return s;
}

// ---------- カード・かけら（330×440 / 100×100） ----------
function card(c) {
  return rect(3, 3, 324, 434, 20, "#fffaf0", `stroke="#e0b04a" stroke-width="6"`) +
    rect(26, 26, 278, 250, 14, shade(c, 0.35)) + star(165, 151, 75, 33, 5, "#ffd54f") + heartPath(248, 222, 50, "#ff7a9a");
}
function cardBack() {
  return rect(3, 3, 324, 434, 20, "#d8cfe8", `stroke="#a99bc4" stroke-width="6"`) +
    `<text x="165" y="270" font-size="140" text-anchor="middle" fill="rgba(255,255,255,.9)">？</text>`;
}
function kakera() {
  return star(50, 50, 46, 22, 5, "#ffcf40") + star(50, 50, 30, 14, 5, "#fff1a8") + eyes(50, 52, 7, 3.5) + smile(50, 58, 4) + star(88, 14, 8, 3, 4, "#fff");
}

// ---------- エフェクト ----------
function fist(c = "#ffb74d") {
  let s = "";
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * 2 * i) / 10;
    const p = (r, d) => `${(50 + Math.cos(a + d) * r).toFixed(1)},${(50 + Math.sin(a + d) * r).toFixed(1)}`;
    s += poly(`${p(36, -0.15)} ${p(36, 0.15)} ${p(48, 0)}`, shade(c, -0.2));
  }
  return s + circle(50, 50, 38, c) + ellipse(50, 62, 26, 16, "#fff3e0") + eyes(50, 42, 14, 5) + path("M44 56 A6 6 0 0 0 56 56", INK, 2);
}
function tower() {
  // viewBox 0 0 180 520
  let s = rect(61, 73, 58, 447, 6, "#8fd3ff", `stroke="#4a90c2" stroke-width="3"`);
  for (let i = 0; i < 8; i++) s += line(66, 114 + 47 * i, 114, 114 + 47 * i, "rgba(255,255,255,.6)", 2);
  return s + circle(90, 57, 54, "#cfeeff", `stroke="#4a90c2" stroke-width="3"`) + circle(76, 42, 14, "rgba(255,255,255,.8)");
}
function penguin() {
  return shadow(50, 92, 20) + ellipse(50, 58, 26, 34, "#2f3b52") + ellipse(50, 64, 18, 26, "#fff") + circle(50, 30, 20, "#2f3b52") +
    ellipse(50, 34, 14, 12, "#fff") + eyes(50, 30, 6, 3.5) + poly("45,38 55,38 50,44", "#ffa726") +
    ellipse(40, 92, 8, 4, "#ffa726") + ellipse(60, 92, 8, 4, "#ffa726");
}
function bubble() {
  return circle(50, 50, 42, "#fff", `stroke="#ff7a7a" stroke-width="6"`) + rect(44, 24, 12, 32, 5, "#ff5a5a") + circle(50, 70, 7, "#ff5a5a");
}

// ---------- アイコン（100×100、c = 線の色） ----------
function icon(name, c) {
  const lw = 9;
  switch (name) {
    case "play": return poly("25,18 25,82 83,50", c);
    case "next": return line(20, 50, 70, 50, c, lw) + poly("55,25 88,50 55,75", c);
    case "back": return line(80, 50, 30, 50, c, lw) + poly("45,25 12,50 45,75", c);
    case "check": return path("M20 50 L42 74 L82 26", c, 12);
    case "cross": return line(24, 24, 76, 76, c, 11) + line(76, 24, 24, 76, c, 11);
    case "continue": return rect(20, 16, 50, 66, 5, c) + poly("58,40 88,58 58,76", "#ffd54f");
    case "speaker":
    case "speaker_off": {
      let s = poly("16,38 32,38 52,18 52,82 32,62 16,62", c);
      if (name === "speaker") s += path("M62 34 Q72 50 62 66", c, 6) + path("M70 22 Q88 50 70 78", c, 6);
      else s += line(64, 34, 90, 66, "#ff5a5a", 8) + line(90, 34, 64, 66, "#ff5a5a", 8);
      return s;
    }
    case "book": return rect(14, 22, 34, 56, 4, c) + rect(52, 22, 34, 56, 4, c) + heartPath(31, 50, 20, "#ff7a9a") + star(69, 50, 11, 5, 5, "#ffcf40");
    case "save": return rect(16, 58, 68, 26, 6, c) + line(50, 14, 50, 54, c, lw) + poly("30,42 70,42 50,64", c);
    case "home": return poly("12,48 50,12 88,48", c) + rect(24, 46, 52, 36, 3, c);
    case "door": return rect(22, 10, 56, 82, 28, c) + circle(64, 56, 5, "#ffd54f") + star(50, 34, 12, 5, 5, "#ffd54f");
    case "erase": return poly("8,50 32,24 88,24 88,76 32,76", c) + line(46, 38, 70, 62, "#ff5a5a", 7) + line(70, 38, 46, 62, "#ff5a5a", 7);
    case "star":
    case "special": return star(50, 50, 42, 18, 5, "#ffcf40") + star(50, 50, 24, 10, 5, "#fff1a8");
    case "aisatsu": {
      let s = "";
      for (let i = 0; i < 8; i++) { const a = (Math.PI * 2 * i) / 8; s += line(50 + Math.cos(a) * 30, 50 + Math.sin(a) * 30, 50 + Math.cos(a) * 44, 50 + Math.sin(a) * 44, "#ffa000", 7); }
      return s + circle(50, 50, 26, "#ffd54f") + eyes(50, 48, 9, 4) + smile(50, 56, 6);
    }
    case "katazuke": return rect(14, 48, 72, 36, 5, "#c8873a") + rect(20, 20, 20, 20, 3, "#4a90e2") + rect(44, 26, 18, 18, 3, "#e8505b") + circle(74, 38, 10, "#7ed321");
    case "itadakimasu": return `<path d="M12 52 A38 30 0 0 0 88 52Z" fill="#fff"/>` + line(10, 52, 90, 52, "#e8505b", 8) + ellipse(50, 50, 30, 16, "#fffdf5") +
      line(60, 8, 86, 44, "#8d6e63", 5) + line(70, 6, 92, 40, "#8d6e63", 5);
    case "hayaoki": return circle(26, 22, 10, "#ffa000") + circle(74, 22, 10, "#ffa000") + circle(50, 54, 34, "#ff7043") + circle(50, 54, 26, "#fff") +
      line(50, 54, 50, 36, INK, 5) + line(50, 54, 63, 60, INK, 5);
    case "nakanaori": return circle(32, 56, 20, SKIN) + circle(68, 56, 20, SKIN) + heartPath(50, 28, 32, "#ff5a7a");
    case "heart": return heartPath(50, 52, 90, "#ff5a7a");
    default: return circle(50, 50, 30, c);
  }
}

/** kind に あわせた SVG 文字列をかえす */
export function artSvg(kind, color = "#ffffff") {
  let vb = "0 0 100 100";
  let body;
  switch (kind) {
    case "hero_boy": body = person(color, false, false); break;
    case "hero_girl": body = person(color, true, false); break;
    case "teacher": body = person(color, false, true); break;
    case "adult": body = person(color, false, true, true); break;
    case "monster_blob": body = monsterBlob(color); break;
    case "monster_red": body = monsterRed(color); break;
    case "monster_ghost": body = monsterGhost(color); break;
    case "monster_plant": body = monsterPlant(color); break;
    case "monster_dragon": body = monsterDragon(color); break;
    case "chest": body = chest(color, false); break;
    case "chest_open": body = chest(color, true); break;
    case "bg_yard": vb = "0 0 1280 720"; body = bgYard(); break;
    case "bg_yard_heisei": vb = "0 0 1280 720"; body = bgYard("heisei"); break;
    case "bg_yard_showa": vb = "0 0 1280 720"; body = bgYard("showa"); break;
    case "bg_yard_hajimari": vb = "0 0 1280 720"; body = bgYard("hajimari"); break;
    case "bg_doors": vb = "0 0 1280 720"; body = bgDoors(); break;
    case "door": vb = "0 0 250 330"; body = door(color === "#ffffff" ? "#9575cd" : color); break;
    case "stamp": body = stamp(); break;
    case "tree": body = tree(false); break;
    case "tree_bloom": body = tree(true); break;
    case "petal": body = heartPath(50, 50, 70, "#ffb3cc"); break;
    case "bg_battle": vb = "0 0 1280 720"; body = bgBattle(); break;
    case "bg_title": vb = "0 0 1280 720"; body = bgTitle(); break;
    case "card": vb = "0 0 330 440"; body = card(color === "#ffffff" ? "#ffb74d" : color); break;
    case "card_back": vb = "0 0 330 440"; body = cardBack(); break;
    case "kakera": body = kakera(); break;
    case "heart_full": body = heartPath(50, 52, 92, "#ff5a7a") + circle(30, 34, 7, "rgba(255,255,255,.7)"); break;
    case "heart_empty": body = heartPath(50, 52, 92, "#e7d6d9"); break;
    case "fist": body = fist(color === "#ffffff" ? "#ffb74d" : color); break;
    case "tower": vb = "0 0 180 520"; body = tower(); break;
    case "penguin": body = penguin(); break;
    case "sparkle": body = star(50, 50, 48, 16, 4, color === "#ffffff" ? "#ffe66d" : color); break;
    case "bubble": body = bubble(); break;
    case "tap_marker": body = `<circle cx="50" cy="50" r="40" fill="none" stroke="#fff" stroke-width="8"/>`; break;
    case "shadow": body = ellipse(50, 50, 45, 40, "rgba(0,0,0,.18)"); break;
    default:
      if (kind.startsWith("icon_")) body = icon(kind.slice(5), color);
      else body = rect(2, 2, 96, 96, 8, color, `stroke="${shade(color, -0.3)}" stroke-width="2"`);
  }
  // 人・モンスター・たからばこは 足元を 下に そろえる
  const grounded = /^(hero_|teacher|adult|monster_|chest|penguin|tree)/.test(kind);
  const ratio = vb === "0 0 1280 720" ? "none" : grounded ? "xMidYMax meet" : "xMidYMid meet";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="${ratio}">${body}</svg>`;
}
