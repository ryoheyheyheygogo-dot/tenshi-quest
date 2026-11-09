// なまえを いれる（ひらがな 4もじまで）
import { Assets } from "../assets.js?v=20261109115231";
import { DB } from "../data.js?v=20261109115231";
import { Game } from "../game.js?v=20261109115231";
import { Voice } from "../voice.js?v=20261109115231";
import { el, place } from "../util.js?v=20261109115231";
import { label, button, panel, keyboard, applyModifier } from "../ui.js?v=20261109115231";

export function build(root) {
  const max = DB.heroes.max_name_length || 4;
  let name = Game.state.hero.name || "";
  el("div", { cls: "fill", parent: root, style: { background: "linear-gradient(#22356f, #142352)" } });

  const g = Game.heroGender();
  const hero = Assets.visual("characters", [`hero_${g}_${Game.heroColorId()}`, `hero_${g}`], 170, 170, `hero_${g}`, Game.heroColor());
  place(hero, 40, 30);
  root.appendChild(hero);
  label(root, "おなまえは？", { x: 230, y: 20, w: 380, h: 80, size: 52, color: "#fff", outline: "#42a5f5", outlineWidth: 5 });

  const slots = [];
  for (let i = 0; i < max; i++) {
    const p = panel(root, 250 + i * 110, 110, 96, 110, { bg: "#fff", border: "#90caf9", radius: 18 });
    slots.push(label(p, "", { x: 0, y: 0, w: 86, h: 100, size: 64 }));
  }
  const refresh = () => slots.forEach((s, i) => (s.textContent = name[i] || ""));

  keyboard(root, 20, 250, (ch) => {
    if (ch === "゛" || ch === "゜" || ch === "ちいさい") name = applyModifier(name, ch);
    else if ([...name].length < max) name += ch;
    refresh();
    Voice.speak(name);
  });
  button(root, "けす", { x: 1118, y: 250, w: 150, h: 190, color: "#90a4ae", size: 36, icon: "erase", iconSize: 70, onClick: () => {
    name = name.slice(0, -1);
    refresh();
  } });
  button(root, "おわり", { x: 1118, y: 452, w: 150, h: 220, color: "#ff8a65", size: 36, icon: "check", iconSize: 80, onClick: () => {
    Game.state.hero.name = name;
    Game.goto("job");
  } });
  refresh();
  Voice.speak("おなまえを いれてね。できたら おわりを タッチしてね。", "system/name");
}
