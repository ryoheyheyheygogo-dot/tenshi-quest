// はじまり：データを読み込み、画面を 切り替える係

import { DB } from "./data.js";
import { Game } from "./game.js";
import { Assets } from "./assets.js";
import { Voice } from "./voice.js";
import { Bgm } from "./bgm.js";
import { wait } from "./util.js";

import * as title from "./screens/title.js";
import * as hero from "./screens/hero.js";
import * as nameScreen from "./screens/name.js";
import * as job from "./screens/job.js";
import * as map from "./screens/map.js";
import * as battle from "./screens/battle.js";
import * as zukan from "./screens/zukan.js";
import * as clear from "./screens/clear.js";
import * as doors from "./screens/doors.js";
import * as ending from "./screens/ending.js";

const SCREENS = { title, hero, name: nameScreen, job, map, battle, zukan, chapter_clear: clear, doors, ending };

const stage = document.getElementById("stage");
const screenEl = document.getElementById("screen");
const fade = document.getElementById("fade");
let current = null; // { destroy }
let busy = false;

// ---------- 画面サイズに あわせる ----------
function fit() {
  const W = window.innerWidth, H = window.innerHeight;
  const s = Math.min(W / 1280, H / 720);
  stage.style.transform = `scale(${s})`;
  stage.style.left = (W - 1280 * s) / 2 + "px";
  stage.style.top = (H - 720 * s) / 2 + "px";
  stage.dataset.scale = s;
}
window.addEventListener("resize", fit);
window.addEventListener("orientationchange", () => setTimeout(fit, 200));
fit();

// ---------- 画面きりかえ ----------
async function show(name, params) {
  Voice.stop();
  if (current && current.destroy) current.destroy();
  screenEl.innerHTML = "";
  const mod = SCREENS[name];
  if (!mod) { console.error("がめんが ありません: " + name); return; }
  const root = document.createElement("div");
  root.className = "fill";
  screenEl.appendChild(root);
  current = (await mod.build(root, params || {})) || {};
}

async function router(name, params) {
  if (busy) return;
  busy = true;
  fade.classList.add("on");
  await wait(190);
  try {
    await show(name, params);
  } catch (e) {
    console.error(e);
  }
  fade.classList.remove("on");
  await wait(200);
  busy = false;
}

// 最初の タッチで 音を 使えるようにする（iPhone 対策）
window.addEventListener("pointerdown", () => { Voice.unlock(); Bgm.unlock(); }, { once: true });

// ---------- 起動 ----------
(async () => {
  try {
    await Promise.all([DB.load(), Assets.init()]);
    Game.init(router);
    await Promise.race([warmUp(), wait(4000)]);
    window.YQ = { Game, DB, Assets, Bgm }; // 動作確認用（ブラウザの コンソールから さわれる）
    await show("title", {});
    document.getElementById("boot").remove();
  } catch (e) {
    console.error(e);
    document.getElementById("boot").textContent = "よみこみに しっぱいしました。サーバー（Netlify など）で ひらいてね。";
  }
})();

/** よく使う 画像を 先に 調べて、画面に 仮素材が ちらつかないように する */
function warmUp() {
  const p = [];
  const colors = (DB.heroes.colors || []).map((c) => c.id);
  for (const g of ["boy", "girl"]) {
    p.push(["characters", `hero_${g}`], ["characters", `face_hero_${g}`], ["characters", `walk_${g}`]);
    for (const c of colors) {
      p.push(["characters", `hero_${g}_${c}`], ["characters", `face_hero_${g}_${c}`], ["characters", `walk_${g}_${c}_down_1`]);
    }
    for (const j of DB.jobs) p.push(["characters", `job_${j.id}_${g}`]);
  }
  for (const j of DB.jobs) p.push(["characters", `job_${j.id}`]);
  for (const sp of Object.values(DB.speakers)) if (sp.visual) p.push(["characters", sp.visual], ["characters", "face_" + sp.visual]);
  for (const id of Object.keys(DB.monsters)) p.push(["monsters", id], ["monsters", "battle_" + id]);
  for (const id of ["title", "yard_ch1", "battle_ch1", "battle_yard", "doors", "clear", "ending"]) p.push(["backgrounds", id]);
  for (const id of ["heart_full", "heart_empty", "chest", "chest_open", "bubble", "shadow", "tap_marker", "logo", "stamp", "kakera_1"]) p.push(["ui", id]);
  for (const ic of ["play", "continue", "next", "back", "check", "cross", "speaker", "speaker_off", "book", "save", "home", "erase", "special", "door", "star",
    "aisatsu", "katazuke", "itadakimasu", "hayaoki", "nakanaori"]) p.push(["ui", "icon_" + ic]);
  for (const c of DB.cards) p.push(["cards", c.id]);
  p.push(["cards", "card_back"]);
  return Assets.warm(p);
}
