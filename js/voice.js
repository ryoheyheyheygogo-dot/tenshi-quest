// 会話の音声係。
// 1) assets/voice/<音声ID>.mp3（m4a / ogg / wav も可）が あれば 再生
// 2) なければ ブラウザの よみあげ（Web Speech API）
// 3) どちらも 使えなければ なにもしない（ゲームは 止まらない）

import { Assets } from "./assets.js?v=20261109201037";
import { Game } from "./game.js?v=20261109201037";

export const SILENT = "data:audio/wav;base64,UklGRrQBAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YZABAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICA";
const audio = new Audio();
let token = 0;
let unlocked = false;

function jaVoice() {
  if (!("speechSynthesis" in window)) return null;
  const voices = speechSynthesis.getVoices();
  return voices.find((v) => v.lang === "ja-JP") || voices.find((v) => v.lang && v.lang.startsWith("ja")) || null;
}

function clean(text) {
  return String(text).replace(/[「」『』…〜（）]/g, " ");
}

export const Voice = {
  /** iPhone などは 最初の タッチの中で 音を 一度 鳴らさないと 以後 鳴らないので その準備 */
  unlock() {
    if (unlocked) return;
    unlocked = true;
    audio.src = SILENT;
    audio.play().catch(() => {});
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      speechSynthesis.speak(u);
    }
  },

  async speak(text, voiceId = "") {
    this.stop();
    if (!Game.settings.voice || !text) return;
    const my = ++token;
    const url = await Assets.findAudio("voice", voiceId);
    if (my !== token) return; // とちゅうで つぎの こえが きた
    if (url) {
      audio.src = url;
      audio.play().catch(() => {});
      return;
    }
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(clean(text));
    u.lang = "ja-JP";
    const v = jaVoice();
    if (v) u.voice = v;
    u.rate = 0.95;
    u.pitch = 1.15;
    speechSynthesis.speak(u);
  },

  stop() {
    token++;
    if (!audio.paused) audio.pause();
    if ("speechSynthesis" in window) speechSynthesis.cancel();
  },
};

// 声の一覧は あとから 届くことがあるので 先に よんでおく
if ("speechSynthesis" in window) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}
