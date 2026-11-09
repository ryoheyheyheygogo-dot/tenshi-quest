// エンディング：4つの かけらで おいわいの きに はなが さく
import { Assets } from "../assets.js?v=20261109115231";
import { DB } from "../data.js?v=20261109115231";
import { Game } from "../game.js?v=20261109115231";
import { Voice } from "../voice.js?v=20261109115231";
import { el, place, anim, wait, rand } from "../util.js?v=20261109115231";
import { label, button, dialogue } from "../ui.js?v=20261109115231";

export async function build(root) {
  let alive = true;
  const bg = Assets.visual("backgrounds", "ending", 1280, 720, "bg_title");
  place(bg, 0, 0);
  root.appendChild(bg);

  // エンディング画像（文字入り）が あるときは、はじめに うすい まくを かけて きに はなを さかせ、
  // さいたら きと まくを けして おいわいの 絵を みせる（文字と きが かさならない）
  const bgHasTitle = !!(await Assets.findImage("backgrounds", "ending"));
  const veil = bgHasTitle ? el("div", { cls: "fill", parent: root, style: { background: "rgba(255,248,230,.93)" } }) : null;
  const tree = Assets.visual("ui", "tree", 420, 420, "tree");
  place(tree, 430, 130);
  root.appendChild(tree);
  const bloom = Assets.visual("ui", "tree_bloom", 420, 420, "tree_bloom");
  place(bloom, 430, 130);
  bloom.style.opacity = 0;
  root.appendChild(bloom);

  const run = async () => {
    await wait(500);
    // 4つの かけらが きに あつまる
    const corners = [[60, 80], [1100, 80], [60, 520], [1100, 520]];
    const pieces = corners.map(([x, y], i) => {
      const k = Assets.visual("ui", "kakera_" + (i + 1), 120, 120, "kakera");
      place(k, x, y);
      root.appendChild(k);
      return k;
    });
    await Promise.all(pieces.map((k, i) => {
      const [x, y] = corners[i];
      return anim(k, [{ transform: "translate(0,0) scale(1)" }, { transform: `translate(${580 - x}px, ${300 - y}px) scale(.4)`, opacity: 0.2 }],
        { duration: 1200, delay: i * 250, easing: "ease-in" });
    }));
    pieces.forEach((k) => k.remove());
    if (!alive) return;
    // はなが さく
    const flash = el("div", { cls: "fill", parent: root, style: { background: "#fff" } });
    anim(flash, [{ opacity: 1 }, { opacity: 0 }], 700).then(() => flash.remove());
    bloom.style.opacity = 1;
    tree.style.opacity = 0;
    Assets.sound("clear");
    for (let i = 0; i < 30; i++) {
      const p = Assets.visual("effects", "petal", 36, 36, "petal");
      place(p, rand(0, 1240), -40);
      root.appendChild(p);
      anim(p, [{ transform: "translate(0,0) rotate(0)" }, { transform: `translate(${rand(-120, 120)}px, 800px) rotate(${rand(180, 720)}deg)` }],
        { duration: rand(3500, 6500), delay: rand(0, 3000), easing: "linear" }).then(() => p.remove());
    }
    if (bgHasTitle) {
      // さいた きを すこし みせてから、おいわいの 絵へ
      await wait(2600);
      if (!alive) return;
      await anim(bloom, [{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: "forwards" });
      await anim(veil, [{ opacity: 1 }, { opacity: 0 }], { duration: 800, fill: "forwards" });
      veil.remove(); bloom.remove(); tree.remove();
    }
    const t = bgHasTitle ? el("div", { parent: root }) : label(root, "75さい おめでとう！", { y: 20, h: 130, size: 92, color: "#fff176", outline: "#e91e63", outlineWidth: 8 });
    anim(t, [{ transform: "scale(.3)", opacity: 0 }, { transform: "scale(1.1)", opacity: 1, offset: 0.7 }, { transform: "scale(1)", opacity: 1 }], 600);
    await wait(1200);
    if (!alive) return;
    await dialogue(root, DB.eras.ending || []);
    if (!alive) return;
    Game.setFlag("ending_seen");
    Game.save();
    const count = `${Game.state.cards.length}/${DB.cards.length}`;
    if (bgHasTitle) {
      // 絵の キャラクターに かからないよう、ボタンは すみに 小さく
      button(root, `ずかん ${count}`, { x: 16, y: 604, w: 220, h: 100, color: "#ffb74d", size: 30, icon: "book", iconSize: 48, onClick: () => Game.goto("zukan", { back: "doors" }) });
      button(root, "タイトル", { x: 1044, y: 604, w: 220, h: 100, color: "#4db6ac", size: 30, icon: "home", iconSize: 48, onClick: () => Game.goto("title") });
    } else {
      label(root, `ぼうけんしゃ ${Game.heroName()}（${Game.job().name || ""}）　おもいでカード ${count}まい`,
        { y: 548, h: 44, size: 30, color: "#fff", outline: "#5d4037", outlineWidth: 3 });
      button(root, "ずかん", { x: 300, y: 598, w: 300, h: 110, color: "#ffb74d", size: 40, icon: "book", iconSize: 56, onClick: () => Game.goto("zukan", { back: "doors" }) });
      button(root, "タイトル", { x: 680, y: 598, w: 300, h: 110, color: "#4db6ac", size: 40, icon: "home", iconSize: 56, onClick: () => Game.goto("title") });
    }
  };
  run();
  return { destroy() { alive = false; } };
}
