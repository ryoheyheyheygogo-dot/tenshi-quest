// ゲームデータ（data/*.json）を 読み込む。文章や モンスターは JSON を 直せば 変わる。
import { VERSION } from "./version.js?v=20261109115231";

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

  async load() {
    const [heroes, jobs, commands, chars, monsters, cards, eras] = await Promise.all([
      loadJson("data/heroes.json"),
      loadJson("data/jobs.json"),
      loadJson("data/commands.json"),
      loadJson("data/characters.json"),
      loadJson("data/monsters.json"),
      loadJson("data/cards.json"),
      loadJson("data/eras.json"),
    ]);
    this.heroes = heroes;
    this.jobs = jobs.jobs || [];
    this.commands = commands;
    this.speakers = chars.speakers || {};
    this.monsters = monsters.monsters || {};
    this.cards = cards.cards || [];
    this.eras = eras;
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
