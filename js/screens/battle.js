// なかよしバトル。たおすのではなく なかよくなる。
// ・あう コマンド → ハートが たくさん / ほかの コマンド → すこし（かならず かてる）
// ・ひっさつわざ → 1かいだけ。ハートが たくさん
// ・ハートが いっぱいで なかよし 成功
import { Assets } from "../assets.js";
import { DB } from "../data.js";
import { Game } from "../game.js";
import { Voice } from "../voice.js";
import { el, place, anim } from "../util.js";
import { label, button, panel, HeartGauge } from "../ui.js";
import { Effects } from "../effects.js";

const MW = 340, MH = 340, MX = 470, MY = 40;
const TARGET = { x: MX + MW / 2, y: MY + MH / 2 };

export async function build(root, params) {
  const id = params.monster || "sukikirai";
  const m = DB.monster(id);
  const ch = await DB.loadChapter(Game.chapterNumber());
  let alive = true;
  let busy = true;
  let specialUsed = false;
  let misses = 0;
  let actionIndex = 0;
  let hinted = false;

  const bg = Assets.visual("backgrounds", [ch.battle_background || "battle", "battle_yard"], 1280, 720, "bg_battle");
  place(bg, 0, 0);
  root.appendChild(bg);

  const mon = Assets.visual("monsters", ["battle_" + id, id], MW, MH, m.kind || "monster_blob", m.color || "#8bc34a");
  place(mon, MX, MY);
  root.appendChild(mon);
  label(root, m.name || "", { y: 340, h: 50, size: 34, color: "#fff", outline: "#6d4c41", outlineWidth: 4 });
  const gauge = new HeartGauge(root, 0, 390, 1280, DB.commands.heart_max || 10, 48);

  // じぶん
  const g = Game.heroGender();
  const me = panel(root, 16, 16, 330, 96, { bg: "rgba(255,255,255,.92)", border: "#ffb74d", bw: 4, radius: 24 });
  const face = Assets.visual("characters", [`face_hero_${g}_${Game.heroColorId()}`, `face_hero_${g}`], 80, 80, `hero_${g}`, Game.heroColor());
  place(face, 4, 4);
  me.appendChild(face);
  label(me, Game.heroName(), { x: 92, y: 2, w: 226, h: 46, size: 32, align: "left" });
  label(me, Game.job().name || "", { x: 92, y: 44, w: 226, h: 40, size: 24, color: "#8a6d5a", align: "left" });

  const msgPanel = panel(root, 40, 448, 1200, 112, { radius: 24 });
  const msg = label(msgPanel, "", { x: 26, y: 2, w: 1140, h: 98, size: 36, align: "left" });
  msg.style.whiteSpace = "normal";

  const cmdBtns = {};
  DB.commandList().forEach((c, i) => {
    cmdBtns[c.id] = button(root, c.label, { x: 40 + i * 243, y: 572, w: 228, h: 136, color: c.color || "#ff8a65", size: 30, icon: c.id, iconSize: 78,
      onClick: () => onCommand(c.id) });
  });
  const job = Game.job();
  const specialBtn = button(root, "ひっさつわざ", { x: 1030, y: 150, w: 230, h: 150, color: "#ffb300", size: 30, icon: "special", iconSize: 80, onClick: onSpecial });
  specialBtn.title = job.special || "";

  const fx = new Effects(root);

  // ---------- メッセージ（タップか 時間で すすむ） ----------
  let advance = null;
  root.addEventListener("click", () => { if (advance) advance(); });
  function say(text, voiceId = "", minTime = 1.4) {
    if (!text || !alive) return Promise.resolve();
    msg.textContent = text;
    Voice.speak(text, voiceId);
    const dur = Math.min(4.5, Math.max(minTime, [...text].length * 0.11)) * 1000;
    return new Promise((resolve) => {
      const done = () => { clearTimeout(timer); advance = null; resolve(); };
      const timer = setTimeout(done, dur);
      advance = done;
    });
  }
  const voice = (k) => `${m.voice_prefix || "monster/" + id}_${k}`;

  function enable(on) {
    busy = !on;
    for (const b of Object.values(cmdBtns)) b.disabled = !on;
    specialBtn.disabled = !on || specialUsed;
    if (specialUsed) specialBtn.style.opacity = 0.45;
  }
  const jump = () => anim(mon, [{ translate: "0 0" }, { translate: "0 -50px", offset: 0.4 }, { translate: "0 0" }], { duration: 350, easing: "ease-out" });

  // ---------- ながれ ----------
  async function intro() {
    enable(false);
    mon.animate([{ transform: "scale(.1)" }, { transform: "scale(1.1)", offset: 0.7 }, { transform: "scale(1)" }], { duration: 500 })
      .finished.then(() => mon.classList.add("sway")).catch(() => {});
    await say(m.appear, voice("appear"));
    await say("どれで なかよく なろうかな？ ボタンを タッチしてね！", "system/battle_choose");
    if (alive) enable(true);
  }

  async function onCommand(cid) {
    if (busy) return;
    enable(false);
    const c = DB.command(cid);
    const good = cid === m.weak;
    await say(Game.format(c.line), "command/" + cid, 1.0);
    await fx.command(cid, TARGET.x, TARGET.y, good);
    await gauge.add(good ? DB.commands.heart_good || 4 : DB.commands.heart_normal || 1);
    if (good) {
      jump();
      await say(m.good_reaction, voice("good"));
    } else {
      misses++;
      await say(m.normal_reaction, voice("normal"));
    }
    await afterTurn();
  }

  async function onSpecial() {
    if (busy || specialUsed) return;
    specialUsed = true;
    enable(false);
    await say(Game.format(job.special_line), "special/" + job.id, 1.2);
    await fx.special(job.special_effect, TARGET.x, TARGET.y);
    await gauge.add(job.special_power || 5);
    jump();
    await say(m.good_reaction, voice("good"));
    await afterTurn();
  }

  async function afterTurn() {
    if (!alive) return;
    if (gauge.full) { await success(); return; }
    const acts = m.actions || [];
    if (acts.length) {
      const text = acts[actionIndex % acts.length];
      actionIndex++;
      await say(text, voice("action" + actionIndex), 1.0);
    }
    enable(true);
    // ヒント：あわない コマンドが つづいたら あう ボタンを ゆらす
    if (!hinted && misses >= (DB.commands.hint_after_misses || 2) && cmdBtns[m.weak]) {
      hinted = true;
      cmdBtns[m.weak].classList.add("wiggle");
      msg.textContent = `ヒント：「${DB.command(m.weak).label}」を ためして みよう！`;
      Voice.speak(msg.textContent, "system/hint_" + m.weak);
    }
  }

  async function success() {
    enable(false);
    jump();
    await fx.friendSuccess(TARGET.x, TARGET.y);
    await say(m.friend || "なかよしに なった！", voice("friend"));
    await say(`${m.name}は なかまに なりたそうに こちらを みている！`, voice("join"));
    Game.setFlag("friend_" + id);
    const isNew = Game.addCard(m.card);
    Game.save();
    if (alive) Game.goto("map", { after_battle: id, card: m.card, new_card: isNew });
  }

  intro();
  return { destroy() { alive = false; } };
}
