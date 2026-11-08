// ときの とびら（スタンプカード）
// すきな じだいを えらんで とびらを くぐる。クリアした じだいには スタンプ。
import { Assets } from "../assets.js?v=20261108231158";
import { DB } from "../data.js?v=20261108231158";
import { Game } from "../game.js?v=20261108231158";
import { Voice } from "../voice.js?v=20261108231158";
import { el, place, anim } from "../util.js?v=20261108231158";
import { label, button, toast, dialogue } from "../ui.js?v=20261108231158";

export async function build(root, params) {
  const bg = Assets.visual("backgrounds", "doors", 1280, 720, "bg_doors");
  place(bg, 0, 0);
  root.appendChild(bg);
  label(root, DB.eras.title || "ときの とびら", { y: 14, h: 90, size: 64, color: "#fff59d", outline: "#5e35b1", outlineWidth: 6 });

  // ときの とびらを まもる てんし（画像が あれば）
  if (await Assets.findImage("characters", "angel")) {
    const angel = Assets.visual("characters", "angel", 110, 150, "box");
    place(angel, 40, 8);
    angel.classList.add("bob");
    root.appendChild(angel);
  }

  const eras = DB.eras.eras || [];
  const got = eras.filter((e) => Game.isCleared(e.chapter)).length;
  label(root, `えがおの かけら  ${got} / ${eras.length}`, { x: 0, y: 96, w: 1280, h: 50, size: 32, color: "#fff", outline: "#5e35b1", outlineWidth: 3 });

  const DW = 250, DH = 400, GAP = 40;
  const x0 = (1280 - (eras.length * DW + (eras.length - 1) * GAP)) / 2;
  eras.forEach((e, i) => {
    const cleared = Game.isCleared(e.chapter);
    const holder = el("div", { cls: "obj", parent: root });
    place(holder, x0 + i * (DW + GAP), 160, DW, DH);
    const door = Assets.visual("ui", "door_ch" + e.chapter, DW, 330, "door", e.color);
    place(door, 0, 0);
    holder.appendChild(door);
    label(holder, e.short, { x: -10, y: 334, w: DW + 20, h: 60, size: 40, color: "#fff", outline: e.color, outlineWidth: 4 });
    if (cleared) {
      const st = Assets.visual("ui", "stamp", 150, 150, "stamp");
      place(st, DW - 130, 190);
      holder.appendChild(st);
      if (params.justCleared === e.chapter) anim(st, [{ transform: "scale(3) rotate(-30deg)", opacity: 0 }, { transform: "scale(1) rotate(-12deg)", opacity: 1 }], { duration: 400, easing: "ease-in" });
      else st.style.transform = "rotate(-12deg)";
    } else {
      door.classList.add("bob");
    }
    holder.addEventListener("click", () => enter(e));
  });

  button(root, "ずかん", { x: 20, y: 590, w: 170, h: 110, color: "#ffb74d", size: 28, icon: "book", iconSize: 56, onClick: () => Game.goto("zukan", { back: "doors" }) });
  button(root, "タイトル", { x: 1090, y: 590, w: 170, h: 110, color: "#90a4ae", size: 26, icon: "home", iconSize: 56, onClick: () => Game.goto("title") });
  if (Game.allCleared()) {
    const end = button(root, "おいわいの き", { x: 440, y: 590, w: 400, h: 110, color: "#e91e63", size: 40, icon: "star", iconSize: 56, onClick: () => Game.goto("ending") });
    end.classList.add("wiggle");
  }

  function enter(e) {
    const n = e.chapter;
    const first = !Game.hasFlag(`ch${n}_visited`);
    Game.setFlag(`ch${n}_visited`);
    Game.state.chapter = n;
    Game.save();
    Voice.speak(e.name + "へ しゅっぱつ！");
    Game.goto("map", { new_game: first });
  }

  // はじめて とびらが ひらいたとき 園長先生が せつめい
  if (params.opened && !Game.hasFlag("doors_intro")) {
    Game.setFlag("doors_intro");
    Game.save();
    await new Promise((r) => setTimeout(r, 400));
    dialogue(root, DB.eras.hub_intro || []);
  } else if (params.loaded) {
    toast(root, `おかえり、${Game.heroName()}！`);
    Voice.speak("きょうは どの じだいに いく？", "hub/choose");
  } else {
    Voice.speak("きょうは どの じだいに いく？", "hub/choose");
  }
}
