// しゅじんこう えらび（おとこのこ／おんなのこ と すきな いろ）
import { Assets } from "../assets.js";
import { DB } from "../data.js";
import { Game } from "../game.js";
import { Voice } from "../voice.js";
import { el, place } from "../util.js";
import { label, button } from "../ui.js";

export function build(root) {
  el("div", { cls: "fill", parent: root, style: { background: "linear-gradient(#22356f, #142352)" } });
  label(root, "どっちで あそぶ？", { y: 16, h: 90, size: 56, color: "#fff", outline: "#ff8a65", outlineWidth: 5 });

  const cards = {};
  (DB.heroes.genders || []).forEach((g, i) => {
    const b = button(root, "", { x: 190 + i * 500, y: 110, w: 400, h: 400, color: "#ffffff", onClick: () => {
      Game.state.hero.gender = g.id;
      refresh();
      Voice.speak(g.label);
    } });
    const holder = el("div", { cls: "abs", parent: b });
    place(holder, 66, 26, 260, 264);
    label(b, g.label, { x: 0, y: 300, w: 392, h: 70, size: 44 });
    cards[g.id] = { b, holder, kind: g.kind };
  });

  const colorBtns = {};
  (DB.heroes.colors || []).forEach((c, i) => {
    colorBtns[c.id] = button(root, c.label, { x: 40 + i * 192, y: 548, w: 180, h: 110, color: c.color, size: 36, onClick: () => {
      Game.state.hero.color = c.id;
      refresh();
      Voice.speak(c.label);
    } });
  });

  button(root, "つぎへ", { x: 1030, y: 560, w: 220, h: 130, color: "#4db6ac", size: 36, icon: "next", iconSize: 64, onClick: () => Game.goto("name") });

  function refresh() {
    const gender = Game.heroGender();
    const colorId = Game.heroColorId();
    for (const [gid, info] of Object.entries(cards)) {
      info.holder.innerHTML = "";
      info.holder.appendChild(Assets.visual("characters", [`hero_${gid}_${colorId}`, `hero_${gid}`], 280, 280, info.kind, Game.heroColor()));
      const on = gid === gender;
      info.b.style.background = on ? "#fff59d" : "#ffffff";
      info.b.style.borderColor = on ? "#ff8a65" : "#d7ccc8";
      info.b.classList.toggle("selected", on);
    }
    for (const [cid, b] of Object.entries(colorBtns)) {
      const c = DB.heroes.colors.find((x) => x.id === cid);
      b.querySelector(".tx").textContent = (cid === colorId ? "★ " : "") + c.label;
      b.classList.toggle("selected", cid === colorId);
    }
  }
  refresh();
  Voice.speak("おとこのこ？ おんなのこ？ すきな ほうと いろを タッチしてね。", "system/hero_select");
}
