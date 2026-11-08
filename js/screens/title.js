// タイトル画面
import { Assets } from "../assets.js";
import { Game } from "../game.js";
import { Voice } from "../voice.js";
import { place, el } from "../util.js";
import { label, button, panel, dim, toast } from "../ui.js";

export async function build(root) {
  const bg = Assets.visual("backgrounds", "title", 1280, 720, "bg_title");
  place(bg, 0, 0);
  root.appendChild(bg);

  // タイトル画像に 文字が 入っているときは 文字を かさねない
  const bgHasTitle = !!(await Assets.findImage("backgrounds", "title"));
  const logoUrl = await Assets.findImage("ui", "logo");
  if (bgHasTitle) {
    // なにもしない
  } else if (logoUrl) {
    const logo = Assets.visual("ui", "logo", 900, 220, "box");
    place(logo, 190, 100);
    root.appendChild(logo);
  } else {
    label(root, "てんし ようちえん 75しゅうねん きねん", { y: 40, h: 70, size: 40, color: "#fff", outline: "#5c8fd6", outlineWidth: 4 });
    const t = label(root, "ようちえん クエスト", { y: 110, h: 180, size: 120, color: "#fff176", outline: "#e8505b", outlineWidth: 9 });
    t.classList.add("sway");
  }

  const hasSave = Game.hasSave();
  const start = button(root, "はじめから", { x: hasSave ? 200 : 440, y: 540, w: 400, h: 130, color: "#ff8a65", size: 44, icon: "play", iconSize: 60,
    onClick: () => (hasSave ? askOverwrite(root) : beginNew()) });
  if (hasSave) {
    const cont = button(root, "つづきから", { x: 680, y: 540, w: 400, h: 130, color: "#4db6ac", size: 44, icon: "continue", iconSize: 60,
      onClick: () => {
        if (!Game.load()) { toast(root, "データが よめなかったよ"); return; }
        if (Game.doorsOpen()) Game.goto("doors", { loaded: true });
        else Game.goto("map", { loaded: true });
      } });
    cont.classList.add("wiggle");
  } else {
    start.classList.add("wiggle");
  }

  button(root, "", { x: 1150, y: 20, w: 110, h: 110, color: "#9575cd", icon: Game.settings.voice ? "speaker" : "speaker_off", iconSize: 64,
    onClick: () => { Game.setVoice(!Game.settings.voice); Game.goto("title"); } }); // こえ・きょく まとめて オン／オフ
}

function beginNew() {
  Game.newGame();
  Game.goto("hero");
}

function askOverwrite(root) {
  const box = el("div", { cls: "fill", parent: root });
  box.style.zIndex = 30;
  dim(box);
  const p = panel(box, 240, 160, 800, 400);
  label(p, "いままでの きろくが きえるよ。\nはじめから あそぶ？", { x: 0, y: 40, w: 790, h: 160, size: 42 });
  button(p, "はい", { x: 70, y: 230, w: 300, h: 130, color: "#ff8a65", size: 44, icon: "check", iconSize: 60,
    onClick: () => { Game.deleteSave(); beginNew(); } });
  button(p, "いいえ", { x: 420, y: 230, w: 300, h: 130, color: "#90a4ae", size: 44, icon: "cross", iconSize: 60, onClick: () => box.remove() });
  Voice.speak("いままでの きろくが きえるよ。はじめから あそぶ？");
}
