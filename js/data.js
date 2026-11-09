// ゲームデータ（data/*.json）を 読み込む。文章や モンスターは JSON を 直せば 変わる。
import { VERSION } from "./version.js?v=20261109201037";

async function loadJson(path) {
  const res = await fetch(`${path}?v=${VERSION}`, { cache: "no-cache" });
  if (!res.ok) throw new Error("データを よみこめませんでした: " + path);
  return res.json();
}

export const DB = {
  heroes: {},
  jobs: [],
  commands: {},
  speakers: {},
  monsters: {},
  cards: [],
  chapters: {},
  eras: {},
  ngWords: {},

  async load() {
    const [heroes, jobs, commands, chars, monsters, cards, eras, ng] = await Promise.all([
      loadJson("data/heroes.json"),
      loadJson("data/jobs.json"),
      loadJson("data/commands.json"),
      loadJson("data/characters.json"),
      loadJson("data/monsters.json"),
      loadJson("data/cards.json"),
      loadJson("data/eras.json"),
      loadJson("data/ng_words.json").catch(() => ({})),
    ]);
    this.heroes = heroes;
    this.jobs = jobs.jobs || [];
    this.commands = commands;
    this.speakers = chars.speakers || {};
    this.monsters = monsters.monsters || {};
    this.cards = cards.cards || [];
    this.eras = eras;
    this.ngWords = ng;
  },

  async loadChapter(n) {
    if (!this.chapters[n]) this.chapters[n] = await loadJson(`data/chapters/chapter${n}.json`);
    return this.chapters[n];
  },
  chapter(n) { return this.chapters[n] || {}; },

  job(id) { return this.jobs.find((j) => j.id === id) || this.jobs[0] || {}; },
  commandList() { return this.commands.commands || []; },
  command(id) { return this.commandList().find((c) => c.id === id) || {}; },
  monster(id) { return this.monsters[id] || {}; },
  card(id) { return this.cards.find((c) => c.id === id) || {}; },
  heroColor(id) { return ((this.heroes.colors || []).find((c) => c.id === id) || {}).color || "#e8505b"; },
  speakerName(id) { return (this.speakers[id] || {}).name || ""; },
};

/** なまえが つかえない ことばか しらべる（カタカナ・ちいさい もじ・のばしぼうは ととのえてから） */
export function isNgName(name) {
  const norm = (s) => String(s)
    .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
    .replace(/[ぁぃぅぇぉっゃゅょゎ]/g, (c) => ({ ぁ: "あ", ぃ: "い", ぅ: "う", ぇ: "え", ぉ: "お", っ: "つ", ゃ: "や", ゅ: "ゆ", ょ: "よ", ゎ: "わ" })[c])
    .replace(/[ー\s・]/g, "");
  const n = norm(name);
  if (!n) return false;
  const ng = DB.ngWords || {};
  if ((ng.contains || []).some((w) => n.includes(norm(w)))) return true;
  if ((ng.exact || []).some((w) => n === norm(w))) return true;
  return false;
}
