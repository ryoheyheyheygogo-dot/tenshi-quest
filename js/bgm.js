// BGM（バトル曲など）。ファイルは assets/sounds/<ID>.mp3
// ※ iPhone は プログラムから 音量を 変えられないため、曲の ファイル自体を 小さめの 音量で 作ってある。
//    もっと 小さく／大きく したいときは data/commands.json の "bgm_volume"（PC・Android のみ有効）か、ファイルを 作り直す。

import { Assets } from "./assets.js?v=20261109115231";
import { Game } from "./game.js?v=20261109115231";
import { SILENT } from "./voice.js?v=20261109115231";

const audio = new Audio();
audio.loop = true;
let current = "";
let fadeTimer = null;

function fadeTo(target, ms, done) {
  clearInterval(fadeTimer);
  const start = audio.volume, t0 = performance.now();
  fadeTimer = setInterval(() => {
    const t = Math.min(1, (performance.now() - t0) / ms);
    try { audio.volume = start + (target - start) * t; } catch (e) { /* iPhone */ }
    if (t >= 1) { clearInterval(fadeTimer); if (done) done(); }
  }, 30);
}

export const Bgm = {
  get playing() { return !audio.paused && current; },
  /** 最初の タッチで 再生できるように しておく（iPhone 対策） */
  unlock() {
    if (audio.src) return;
    audio.src = SILENT;
    audio.play().then(() => audio.pause()).catch(() => {});
  },

  async play(id, volume = 1) {
    if (!Game.settings.voice || !id) return;
    if (current === id && !audio.paused) return;
    const url = await Assets.findAudio("sounds", id);
    if (!url) return;
    current = id;
    audio.src = url;
    audio.currentTime = 0;
    try { audio.volume = 0; } catch (e) { /* iPhone */ }
    audio.play().catch(() => {});
    fadeTo(volume, 800);
  },

  stop(ms = 600) {
    if (audio.paused) { current = ""; return; }
    fadeTo(0, ms, () => { audio.pause(); current = ""; });
  },
};
