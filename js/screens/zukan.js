// おもいで ずかん（あつめた カード）
import { Assets } from "../assets.js?v=20261108231158";
import { DB } from "../data.js?v=20261108231158";
import { Game } from "../game.js?v=20261108231158";
import { Voice } from "../voice.js?v=20261108231158";
import { el, place } from "../util.js?v=20261108231158";
import { label, button, cardPopup } from "../ui.js?v=20261108231158";

const CW = 148, CH = 198; // 7まい × 2だん

export function build(root, params) {
  el("div", { cls: "fill", parent: root, style: { background: "#fff8e1" } });
  const have = DB.cards.filter((c) => Game.hasCard(c.id)).length;
  label(root, `おもいで ずかん  ${have} / ${DB.cards.length}`, { y: 14, h: 80, size: 52, color: "#fff", outline: "#ffa000", outlineWidth: 5 });
  button(root, "もどる", { x: 20, y: 14, w: 170, h: 110, color: "#90a4ae", size: 28, icon: "back", iconSize: 56, onClick: () => Game.goto(params.back || "map") });

  DB.cards.forEach((c, i) => {
    const owned = Game.hasCard(c.id);
    const x = 46 + (i % 7) * 172, y = 136 + Math.floor(i / 7) * 285;
    const holder = el("div", { cls: "obj", parent: root });
    place(holder, x, y, CW, CH + 56);
    const art = owned ? Assets.visual("cards", c.id, CW, CH, "card", "#ffb74d") : Assets.visual("cards", "card_back", CW, CH, "card_back");
    place(art, 0, 0);
    holder.appendChild(art);
    const t = label(holder, owned ? c.title : "？？？", { x: -12, y: CH + 2, w: CW + 24, h: 56, size: 20 });
    t.style.whiteSpace = "normal";
    holder.addEventListener("click", () => {
      if (owned) cardPopup(root, c.id, false);
      else Voice.speak("まだ みつけていない カードだよ。");
    });
  });
  Voice.speak("おもいで ずかん。カードを タッチすると おはなしが きけるよ。", "system/zukan");
}
