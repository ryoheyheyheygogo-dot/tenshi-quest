// 進行状況・フラグ・カード・セーブ（ブラウザの localStorage に 保存）

import { DB } from "./data.js";

const SAVE_KEY = "youchien_quest_save_v1";
const SETTINGS_KEY = "youchien_quest_settings_v1";

export const Game = {
  state: {},
  settings: { voice: true },
  _router: null,

  init(router) {
    this._router = router;
    this.newGame();
    try {
      const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
      this.settings = { voice: true, ...s };
    } catch (e) { /* そのまま */ }
  },

  goto(name, params = {}) { this._router(name, params); },

  newGame() {
    this.state = {
      version: 1,
      hero: { gender: "boy", color: "aka", name: "" },
      job: "senshi",
      chapter: 1,
      flags: {},
      cards: [],
      pos: {}, // じだい（章）ごとの いばしょ { "1": [x, y] }
    };
  },

  heroName() { return this.state.hero.name || DB.heroes.default_name || "ゆうしゃ"; },
  heroGender() { return this.state.hero.gender; },
  heroColorId() { return this.state.hero.color; },
  heroColor() { return DB.heroColor(this.state.hero.color); },
  job() { return DB.job(this.state.job); },
  chapterNumber() { return this.state.chapter || 1; },
  isCleared(n) { return this.hasFlag(`ch${n}_clear`); },
  allCleared() { return (DB.eras.eras || []).every((e) => this.isCleared(e.chapter)); },
  doorsOpen() { return this.isCleared(1); },

  setFlag(f, v = true) { this.state.flags[f] = v; },
  hasFlag(f) { return !!this.state.flags[f]; },
  /** ["talked_encho", "!ch1_clear"] を すべて みたすか */
  check(conds = []) {
    return conds.every((c) => (c.startsWith("!") ? !this.hasFlag(c.slice(1)) : this.hasFlag(c)));
  },

  hasCard(id) { return this.state.cards.includes(id); },
  /** 新しいカードなら true */
  addCard(id) {
    if (!id || this.hasCard(id)) return false;
    this.state.cards.push(id);
    return true;
  },

  format(text = "", extra = {}) {
    let t = String(text).replaceAll("{name}", this.heroName());
    const j = this.job();
    t = t.replaceAll("{job}", j.name || "").replaceAll("{special}", j.special || "");
    for (const k of Object.keys(extra)) t = t.replaceAll(`{${k}}`, String(extra[k]));
    return t;
  },

  save() {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)); return true; }
    catch (e) { console.warn("セーブできませんでした", e); return false; }
  },
  hasSave() {
    try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; }
  },
  load() {
    try {
      const data = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!data || typeof data !== "object") return false;
      this.newGame();
      Object.assign(this.state, data);
      this.state.flags = this.state.flags || {};
      this.state.cards = this.state.cards || [];
      if (!this.state.pos || Array.isArray(this.state.pos)) this.state.pos = {};
      return true;
    } catch (e) { return false; }
  },
  deleteSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* なし */ } },

  setVoice(on) {
    this.settings.voice = on;
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings)); } catch (e) { /* なし */ }
  },
};
