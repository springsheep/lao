import bgm from "../assets/mp3/mp0.mp3";
import throwSound from "../assets/mp3/mp1.wav";
import catchSound from "../assets/mp3/mp3.mp3";
import clickSound from "../assets/mp3/mp3.mp3";
import prizeSound from "../assets/mp3/mp4.mp3";
class SoundManager {
  constructor() {
    this.sounds = {};
    this.isMuted = true; // 默认静音
    this.bgmPlaying = false;
  }

  // 预加载音效
  preload() {
    // 背景音乐 - 使用更可靠的 CDN
    this.load("bgm", bgm);

    // 扔瓶子音效
    this.load("throw", throwSound);

    // 捞瓶子音效
    this.load("catch", catchSound);

    // 按钮点击音效
    this.load("click", clickSound);

    // 奖品音效
    this.load("prize", prizeSound);
  }

  // 加载单个音效
  load(name, url) {
    const audio = new Audio();
    audio.src = url;
    audio.preload = "auto";

    this.sounds[name] = audio;

    return new Promise((resolve, reject) => {
      audio.addEventListener("canplaythrough", resolve);
      audio.addEventListener("error", reject);
    });
  }

  // 播放音效
  play(name, options = {}) {
    if (this.isMuted) return;

    const sound = this.sounds[name];
    if (!sound) return;

    // 如果需要循环播放
    if (options.loop) {
      sound.loop = true;
    }

    // 设置音量
    if (options.volume !== undefined) {
      sound.volume = options.volume;
    }

    // 重置音频并播放
    sound.currentTime = 0;
    sound.play().catch((e) => console.log("播放音频失败:", e));

    return sound;
  }

  // 停止音效
  stop(name) {
    const sound = this.sounds[name];
    if (!sound) return;

    sound.pause();
    sound.currentTime = 0;
  }

  // 暂停音效
  pause(name) {
    const sound = this.sounds[name];
    if (!sound) return;

    sound.pause();
  }

  // 恢复音效
  resume(name) {
    if (this.isMuted) return;

    const sound = this.sounds[name];
    if (!sound) return;

    sound.play().catch((e) => console.log("恢复音频失败:", e));
  }

  // 播放背景音乐
  playBGM() {
    if (this.bgmPlaying) return;

    const bgm = this.play("bgm", { loop: true, volume: 0.5 });
    if (bgm) {
      this.bgmPlaying = true;
    }
  }

  // 停止背景音乐
  stopBGM() {
    this.stop("bgm");
    this.bgmPlaying = false;
  }

  // 静音所有音效
  mute() {
    this.isMuted = true;

    Object.values(this.sounds).forEach((sound) => {
      sound.pause();
    });
  }

  // 取消静音
  unmute() {
    this.isMuted = false;

    // 如果背景音乐之前在播放，则恢复
    if (this.bgmPlaying) {
      this.resume("bgm");
    }
  }

  // 切换静音状态
  toggleMute() {
    if (this.isMuted) {
      this.unmute();
    } else {
      this.mute();
    }

    return this.isMuted;
  }
}

// 创建单例
const soundManager = new SoundManager();
export default soundManager;
