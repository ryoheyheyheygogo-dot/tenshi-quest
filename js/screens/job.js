// しょくぎょう えらび（せんし・まほうつかい・そうりょ）
import { Assets } from "../assets.js?v=20261109115231";
import { DB } from "../data.js?v=20261109115231";
import { Game } from "../game.js?v=20261109115231";
import { Voice } from "../voice.js?v=20261109115231";
import { el, place } from "../util.js?v=20261109115231";
import { label, button } from "../ui.js?v=20261109115231";
import { shadeColor } from "../color.js?v=20261109115231";

export function build(root) {
  el("div", { cls: "fill", parent: root, style: { background: "linear-gradient(#22356f, #142352)" } });
  label(root, "しょくぎょうを えらぼう", { y: 10, h: 80, size: 52, color: "#fff", outline: "#ab47bc", outlineWidth: 5 });

  let selected = "";
  const cards = {};
  const g = Game.heroGender();
  DB.jobs.forEach((j, i) => {
    const col = j.color || "#ff8a65";
    const b = button(root, "", { x: 40 + i * 410, y: 100, w: 380, h: 460, color: "#ffffff", onClick: () => select(j.id) });
    // 絵は まどの 中に（画像の はしが きれていても まどの ふちに そろえて 自然に 見せる）
    const win = el("div", { cls: "abs", parent: b });
    place(win, 56, 14, 260, 222);
    Object.assign(win.style, { overflow: "hidden", borderRadius: "18px", background: shadeColor(col, 0.82), border: `4px solid ${shadeColor(col, 0.5)}`, pointerEvents: "none" });
    const art = Assets.visual("characters", [`job_${j.id}_${g}`, `job_${j.id}`], 230, 206, `hero_${g}`, col);
    place(art, j.art_align && j.art_align.startsWith("left") ? 0 : 11, 6);
    art.classList.add("job-art");
    art.style.setProperty("--pos", j.art_align || "center bottom");
    win.appendChild(art);
    label(b, j.name, { x: 0, y: 240, w: 372, h: 70, size: 48, color: "#fff", outline: shadeColor(col, -0.2), outlineWidth: 4 });
    const ic = Assets.icon("special", 50);
    place(ic, 16, 330);
    b.appendChild(ic);
    const sp = label(b, j.special || "", { x: 72, y: 312, w: 290, h: 120, size: 28, color: shadeColor(col, -0.3), align: "left" });
    sp.style.whiteSpace = "normal";
    cards[j.id] = { b, col };
  });

  const ok = button(root, "これに する！", { x: 420, y: 580, w: 440, h: 120, color: "#ff8a65", size: 44, onClick: () => {
    if (!selected) return;
    Game.state.job = selected;
    Game.state.chapter = 1;
    Game.save();
    Game.goto("map", { new_game: true });
  } });
  ok.style.visibility = "hidden";

  function select(id) {
    selected = id;
    for (const [jid, c] of Object.entries(cards)) {
      const on = jid === id;
      c.b.style.background = on ? "#fffde7" : "#ffffff";
      c.b.style.borderColor = on ? c.col : "#d7ccc8";
      c.b.classList.toggle("selected", on);
    }
    ok.style.visibility = "visible";
    ok.classList.add("wiggle");
    const j = DB.job(id);
    Voice.speak(j.name + "。" + (j.description || ""), "system/job_" + id);
  }
  Voice.speak("しょくぎょうを えらぼう。タッチすると せつめいが きけるよ。", "system/job");
}
