// じだい（章）クリア がめん
import { Assets } from "../assets.js?v=20261109115231";
import { DB } from "../data.js?v=20261109115231";
import { Game } from "../game.js?v=20261109115231";
import { Voice } from "../voice.js?v=20261109115231";
import { el, place } from "../util.js?v=20261109115231";
import { label, button } from "../ui.js?v=20261109115231";

export async function build(root) {
  const n = Game.chapterNumber();
  const ch = await DB.loadChapter(n);
  const bg = Assets.visual("backgrounds", "clear", 1280, 720, "bg_title");
  place(bg, 0, 0);
  root.appendChild(bg);
  el("div", { cls: "fill", parent: root, style: { background: "rgba(255,250,230,.55)" } });

  label(root, `${ch.title || ""} クリア！`, { y: 20, h: 140, size: 80, color: "#fff176", outline: "#e8505b", outlineWidth: 7 });
  const k = Assets.visual("ui", ch.kakera || "kakera", 260, 260, "kakera");
  place(k, 510, 160);
  k.classList.add("wiggle");
  root.appendChild(k);

  const got = (DB.eras.eras || []).filter((e) => Game.isCleared(e.chapter)).length;
  const total = (DB.eras.eras || []).length || 4;
  let text;
  if (Game.allCleared()) text = "『えがおの かけら』が 4つ そろった！\nおいわいの きを みに いこう！";
  else if (n === 1) text = "『えがおの かけら』を てに いれた！\n『ときの とびら』が ひらいたよ！";
  else text = `『えがおの かけら』を てに いれた！（${got} / ${total}）\nほかの じだいにも いってみよう！`;
  label(root, text, { y: 430, h: 120, size: 38 });

  button(root, "ずかん", { x: 300, y: 570, w: 300, h: 130, color: "#ffb74d", size: 40, icon: "book", iconSize: 60, onClick: () => Game.goto("zukan", { back: "chapter_clear" }) });
  let next;
  if (Game.allCleared()) {
    next = button(root, "おいわいへ", { x: 680, y: 570, w: 300, h: 130, color: "#e91e63", size: 40, icon: "star", iconSize: 60, onClick: () => Game.goto("ending") });
  } else {
    next = button(root, "ときの とびら", { x: 680, y: 570, w: 300, h: 130, color: "#9575cd", size: 36, icon: "door", iconSize: 60, onClick: () => Game.goto("doors", { opened: n === 1, justCleared: n }) });
  }
  next.classList.add("wiggle");

  // クリアの 音と 読み上げは はじめて 見たときの 1回だけ
  const seen = `ch${n}_clear_seen`;
  const first = !Game.hasFlag(seen);
  Game.setFlag(seen);
  Game.save();
  if (!first) return;
  Assets.sound("clear");
  Voice.speak(`${ch.title || ""} クリア！ ${text.replace("\n", " ")}`, `system/chapter_clear_${n}`);
}
