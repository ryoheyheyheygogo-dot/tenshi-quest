// えんてい（探索マップ）。タッチした ところへ あるく。
// 人や モンスターを タッチすると そこまで あるいて はなしかける。
// 何が おきるかは data/chapters/chapterN.json の "events" で きめる。
import { Assets } from "../assets.js?v=20261109115231";
import { DB } from "../data.js?v=20261109115231";
import { Game } from "../game.js?v=20261109115231";
import { Voice } from "../voice.js?v=20261109115231";
import { el, place, anim, stagePoint } from "../util.js?v=20261109115231";
import { label, button, panel, toast, dialogue, cardPopup } from "../ui.js?v=20261109115231";

const PLAYER_W = 110, PLAYER_H = 130;
const WALK_SPEED = 380; // px / 秒
const TALK_DISTANCE = 110;

export async function build(root, params) {
  const ch = await DB.loadChapter(Game.chapterNumber());
  const [ax1, ay1, ax2, ay2] = ch.walk_area || [60, 330, 1220, 690];
  let alive = true;
  let busy = true;
  let moving = null; // { from, to, t0, dur }
  let targetObj = "";
  const objects = {};

  // はいけい（ここを タッチすると あるく）
  const ground = Assets.visual("backgrounds", ch.background || "", 1280, 720, ch.background_kind || "bg_yard");
  place(ground, 0, 0);
  ground.style.pointerEvents = "auto";
  root.appendChild(ground);
  const layer = el("div", { cls: "layer", parent: root });

  // ---------- もの・ひと ----------
  for (const obj of ch.objects || []) {
    const [w, h] = obj.size || [120, 120];
    const [x, y] = obj.pos;
    const node = el("div", { cls: "obj", parent: layer });
    place(node, x - w / 2, y - h, w, h);
    node.style.zIndex = Math.round(y);
    const sh = Assets.visual("ui", "shadow", w * 0.8, 24, "shadow");
    place(sh, w * 0.1, h - 14);
    node.appendChild(sh);
    const holder = el("div", { cls: "fill", parent: node });
    holder.style.pointerEvents = "none";
    if (obj.category === "monsters") holder.classList.add("bob");
    const bubble = Assets.visual("ui", "bubble", 56, 56, "bubble");
    place(bubble, w / 2 - 28, -64);
    bubble.classList.add("bob");
    node.appendChild(bubble);
    node.addEventListener("click", (ev) => { ev.stopPropagation(); onObjectTap(obj.id); });
    objects[obj.id] = { data: obj, node, holder, bubble, key: "" };
  }

  // ---------- じぶん ----------
  const player = el("div", { cls: "abs", parent: layer });
  Object.assign(player.style, { width: PLAYER_W + "px", height: PLAYER_H + "px", pointerEvents: "none" });
  const psh = Assets.visual("ui", "shadow", 80, 22, "shadow");
  place(psh, 15, PLAYER_H - 14);
  player.appendChild(psh);
  const g = Game.heroGender(), cid = Game.heroColorId();
  const pv = Assets.visual("characters", [`walk_${g}_${cid}_down_1`, `walk_${g}_${cid}`, `walk_${g}`, `hero_${g}_${cid}`, `hero_${g}`], PLAYER_W, PLAYER_H, `hero_${g}`, Game.heroColor());
  place(pv, 0, 0);
  player.appendChild(pv);
  let feet = { x: (ch.start_pos || [640, 600])[0], y: (ch.start_pos || [640, 600])[1] };
  const savedPos = (Game.state.pos || {})[Game.chapterNumber()];
  if (Array.isArray(savedPos) && !params.new_game) feet = { x: savedPos[0], y: savedPos[1] };
  let facing = 1;
  // 歩きアニメ（walk_<性別>_<色>_<down|left|right>_<0-2>.png が あれば つかう）
  const frames = await loadWalkFrames(g, cid);
  let dir = "down", step = 1;
  const placePlayer = (bob = 0) => {
    place(player, feet.x - PLAYER_W / 2, feet.y - PLAYER_H);
    player.style.zIndex = Math.round(feet.y);
    if (frames) {
      const img = pv.querySelector("img");
      const url = frames[dir][step];
      if (img && img.getAttribute("src") !== url) img.setAttribute("src", url);
      pv.style.transform = "";
    } else {
      pv.style.transform = `translateY(${-bob}px) scaleX(${facing})`;
    }
  };
  placePlayer();

  // ---------- HUD ----------
  const me = panel(root, 16, 16, 330, 96, { bg: "rgba(255,255,255,.92)", border: "#ffb74d", bw: 4, radius: 24 });
  me.classList.add("hud");
  const face = Assets.visual("characters", [`face_hero_${g}_${cid}`, `face_hero_${g}`], 80, 80, `hero_${g}`, Game.heroColor());
  place(face, 4, 4);
  me.appendChild(face);
  label(me, Game.heroName(), { x: 92, y: 2, w: 226, h: 46, size: 32, align: "left" });
  label(me, Game.job().name || "", { x: 92, y: 44, w: 226, h: 40, size: 24, color: "#8a6d5a", align: "left" });

  const zukanBtn = button(root, "ずかん", { x: 800, y: 12, w: 150, h: 120, color: "#ffb74d", size: 26, icon: "book", iconSize: 60, onClick: () => {
    if (busy) return;
    save();
    Game.goto("zukan", { back: "map" });
  } });
  zukanBtn.classList.add("hud");
  const count = label(zukanBtn, "", { x: 84, y: -10, w: 70, h: 40, size: 26, color: "#fff", outline: "#e65100", outlineWidth: 3 });
  button(root, "セーブ", { x: 960, y: 12, w: 150, h: 120, color: "#4db6ac", size: 26, icon: "save", iconSize: 60, onClick: () => {
    save();
    toast(root, "セーブ したよ！");
    Voice.speak("セーブ したよ！");
  } }).classList.add("hud");
  if (Game.doorsOpen()) {
    button(root, "とびら", { x: 1120, y: 12, w: 150, h: 120, color: "#9575cd", size: 26, icon: "door", iconSize: 60, onClick: () => {
      if (busy) return;
      save();
      Game.goto("doors");
    } }).classList.add("hud");
  } else {
    button(root, "タイトル", { x: 1120, y: 12, w: 150, h: 120, color: "#90a4ae", size: 24, icon: "home", iconSize: 60, onClick: () => {
      save();
      Game.goto("title");
    } }).classList.add("hud");
  }

  const updateCount = () => {
    const list = DB.cards.filter((c) => c.chapter === Game.chapterNumber());
    count.textContent = `${list.filter((c) => Game.hasCard(c.id)).length}/${list.length}`;
  };
  updateCount();

  // ---------- うごき ----------
  ground.addEventListener("click", (ev) => {
    if (busy) return;
    targetObj = "";
    const p = stagePoint(ev);
    tapMarker(p);
    walkTo(p);
  });

  function onObjectTap(id) {
    if (busy) return;
    const [ox, oy] = objects[id].data.pos;
    if (Math.hypot(feet.x - ox, feet.y - oy) <= TALK_DISTANCE) {
      moving = null;
      interact(id);
      return;
    }
    targetObj = id;
    const side = feet.x < ox ? -1 : 1;
    walkTo({ x: ox + side * 70, y: oy + 30 });
  }

  function walkTo(p) {
    const to = { x: Math.min(ax2, Math.max(ax1, p.x)), y: Math.min(ay2, Math.max(ay1, p.y)) };
    if (to.x !== feet.x) facing = to.x < feet.x ? -1 : 1;
    const dx = to.x - feet.x, dy = to.y - feet.y;
    dir = Math.abs(dx) > Math.abs(dy) * 0.8 ? (dx < 0 ? "left" : "right") : "down";
    const dist = Math.hypot(to.x - feet.x, to.y - feet.y);
    moving = { from: { ...feet }, to, t0: performance.now(), dur: Math.max(50, (dist / WALK_SPEED) * 1000) };
  }

  let raf = 0;
  const tick = (now) => {
    if (!alive) return;
    if (moving) {
      const t = Math.min(1, (now - moving.t0) / moving.dur);
      feet = { x: moving.from.x + (moving.to.x - moving.from.x) * t, y: moving.from.y + (moving.to.y - moving.from.y) * t };
      step = [0, 1, 2, 1][Math.floor(now / 130) % 4];
      placePlayer(Math.abs(Math.sin(now / 1000 * 12)) * 8);
      if (t >= 1) {
        moving = null;
        step = 1;
        placePlayer();
        if (targetObj) { const id = targetObj; targetObj = ""; interact(id); }
      }
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  function tapMarker(p) {
    const m = Assets.visual("ui", "tap_marker", 60, 60, "tap_marker");
    place(m, p.x - 30, p.y - 30);
    m.style.zIndex = 5;
    root.appendChild(m);
    anim(m, [{ transform: "scale(1)", opacity: 1 }, { transform: "scale(1.6)", opacity: 0 }], 400).then(() => m.remove());
  }

  // ---------- イベント ----------
  const remaining = () => (ch.goal_monsters || []).filter((m) => !Game.hasFlag("friend_" + m)).length;
  const currentEvent = (obj) => (obj.events || []).find((ev) => Game.check(ev.if || [])) || null;
  const talk = (key) => dialogue(root, (ch.dialogues || {})[key] || [], { remaining: remaining() });
  const showCard = async (id, isNew) => { await cardPopup(root, id, isNew); updateCount(); };
  function save() {
    Game.state.pos[Game.chapterNumber()] = [Math.round(feet.x), Math.round(feet.y)];
    Game.save();
  }

  async function interact(id) {
    if (busy) return;
    const obj = objects[id].data;
    const ev = currentEvent(obj);
    if (!ev) return;
    busy = true;
    facing = obj.pos[0] < feet.x ? -1 : 1;
    if (Math.abs(obj.pos[0] - feet.x) > 40) dir = facing < 0 ? "left" : "right";
    step = 1;
    placePlayer();
    if (ev.dialogue) await talk(ev.dialogue);
    for (const f of ev.set || []) Game.setFlag(f);
    if (ev.give_card) {
      const isNew = Game.addCard(ev.give_card);
      save();
      if (isNew) await showCard(ev.give_card, true);
    }
    save();
    if (!alive) return;
    if (ev.battle) { Game.goto("battle", { monster: ev.battle }); return; }
    if (ev.then === "chapter_clear") { Game.goto("chapter_clear"); return; }
    refresh();
    busy = false;
  }

  function refresh() {
    for (const [id, o] of Object.entries(objects)) {
      const obj = o.data;
      const after = obj.after_flag && Game.hasFlag(obj.after_flag);
      const key = after ? "after" : "normal";
      if (o.key !== key) {
        o.key = key;
        o.holder.innerHTML = "";
        const [w, h] = obj.size || [120, 120];
        let kind = obj.kind || "box";
        if (after && kind === "chest") kind = "chest_open";
        const v = Assets.visual(obj.category || "characters", after ? obj.visual_after || obj.visual : obj.visual, w, h, kind, obj.color || "#ffffff");
        place(v, 0, 0);
        o.holder.appendChild(v);
      }
      const ev = currentEvent(obj);
      o.bubble.style.display = ev && (ev.battle || ev.give_card || ev.then) ? "" : "none";
      if (obj.category === "monsters" && Game.hasFlag("friend_" + id) && !o.heart) {
        const [w] = obj.size || [120, 120];
        o.heart = Assets.visual("ui", "heart_full", 44, 44, "heart_full");
        place(o.heart, w - 30, -10);
        o.heart.classList.add("bob");
        o.node.appendChild(o.heart);
      }
    }
  }
  refresh();

  // ---------- はいったとき ----------
  (async () => {
    if (params.new_game) {
      await talk(ch.intro_dialogue);
    } else if (params.after_battle) {
      if (params.card) await showCard(params.card, params.new_card !== false);
      const flag = `ch${Game.chapterNumber()}_all_friends`;
      if (!Game.hasFlag(flag) && remaining() === 0) {
        Game.setFlag(flag);
        save();
        await talk(ch.all_friends_dialogue);
      }
    } else if (params.loaded) {
      toast(root, `おかえり、${Game.heroName()}！`);
    }
    if (!alive) return;
    busy = false;
    refresh();
  })();

  return {
    destroy() {
      alive = false;
      cancelAnimationFrame(raf);
    },
  };
}

/** 歩きアニメの 画像を さがす。そろっていなければ null */
async function loadWalkFrames(g, c) {
  const out = {};
  for (const d of ["down", "left", "right"]) {
    out[d] = [];
    for (let n = 0; n < 3; n++) {
      const url = await Assets.findImage("characters", `walk_${g}_${c}_${d}_${n}`);
      if (!url) return null;
      out[d].push(url);
    }
  }
  return out;
}
