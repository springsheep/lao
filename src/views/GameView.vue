<template>
  <div class="game-container">
    <!-- 加载进度提示 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <div class="loading-spinner"></div>
        <div class="loading-text">{{ loadingText }}</div>
        <div class="loading-bar">
          <div class="loading-progress" :style="{ width: loadingProgress + '%' }"></div>
        </div>
      </div>
    </div>

    <div ref="pixiContainer" class="pixi-container"></div>

    <div class="game-ui">
      <!-- 捡一捡和送祝福按钮放在下面 -->
      <div class="bottom-buttons">
        <button class="btn-wish" @click="throwBottle">
          <img :src="zhufuButtonImage" alt="送祝福" class="button-image" />
        </button>
        <button class="btn-lao" @click="catchBottle">
          <img :src="laoButtonImage" alt="捡一捡" class="button-image" />
        </button>
      </div>

      <!-- 静音按钮放在右上角 -->
      <div class="sound-button">
        <button class="btn-sound" @click="toggleSound">
          <svg v-if="!isMuted" class="sound-icon" viewBox="0 0 24 24" width="24" height="24">
            <path
              d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"
            />
          </svg>
          <svg v-else class="sound-icon" viewBox="0 0 24 24" width="24" height="24">
            <path
              d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"
            />
          </svg>
        </button>
      </div>
    </div>
    <div v-if="message" class="message-box" @click.self="closeMessage">
      <div class="message-content" :class="{ 'prize-content': isPrize }">
        <!-- 装饰性粒子效果 -->
        <div v-if="isPrize" class="particles">
          <div class="particle" v-for="i in 20" :key="i"></div>
        </div>

        <!-- 顶部装饰 -->
        <!-- <div class="top-decoration">
          <div class="decoration-line"></div>
          <div class="decoration-icon">{{ isPrize ? "🎁" : "💌" }}</div>
          <div class="decoration-line"></div>
        </div> -->

        <!-- 内容区域 -->
        <div class="content-area">
          <h2 v-if="isPrize" class="prize-title">{{ prizeTitle }}</h2>
          <h3 v-else class="message-title">来自海洋的祝福</h3>
          <p class="message-text">{{ message }}</p>
        </div>

        <!-- 按钮组 -->
        <div class="button-group">
          <button class="btn btn-accept" @click="acceptBottle">
            <span>收下</span>
          </button>
          <button class="btn btn-throw-away" @click="throwAwayBottle">
            <span>丢海里</span>
          </button>
        </div>

        <!-- 底部装饰波浪 -->
        <div class="bottom-waves">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,0 C150,100 350,0 600,50 C850,100 1050,0 1200,50 L1200,120 L0,120 Z" fill="rgba(255,255,255,0.1)"></path>
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import * as PIXI from "pixi.js";
  import { gsap } from "gsap";
  import { onMounted, onBeforeUnmount, ref } from "vue";
  import { useRouter } from "vue-router";
  import PixiGame from "../components/PixiGame";
  import soundManager from "../utils/SoundManager";
  import laoButtonImage from "../assets/lao.png";
  import zhufuButtonImage from "../assets/zhufu.png";

  export default {
    name: "GameView",
    setup() {
      const router = useRouter();
      const pixiContainer = ref(null);
      const message = ref("");
      const isPrize = ref(false);
      const prizeTitle = ref("");
      const isMuted = ref(true); // 默认静音
      const isLoading = ref(true);
      const loadingProgress = ref(0);
      const loadingText = ref("正在加载资源...");
      let game = null;

      onMounted(() => {
        game = new PixiGame(pixiContainer.value);

        // 设置加载进度回调
        game.onLoadProgress = (progress, text) => {
          loadingProgress.value = Math.round(progress * 100);
          loadingText.value = text;

          // 加载完成后隐藏加载界面
          if (progress >= 1) {
            setTimeout(() => {
              isLoading.value = false;
            }, 500);
          }
        };

        game.init();

        // 监听窗口大小变化
        window.addEventListener("resize", handleResize);
      });

      onBeforeUnmount(() => {
        if (game) {
          // game.destroy();
        }
        window.removeEventListener("resize", handleResize);
      });

      const handleResize = () => {
        if (game) {
          game.resize();
        }
      };

      const throwBottle = () => {
        if (game) {
          game.throwBottle(() => {
            setTimeout(() => {
              message.value = "你的漂流瓶已经被扔出去了，希望有人能捡到它！";
            }, 300);
          });
        }
      };

      const catchBottle = () => {
        if (game) {
          game.catchBottle((bottleContent) => {
            if (!bottleContent) {
              message.value = "你捞到了一个漂流瓶，但里面什么也没有...";
              isPrize.value = false;
              return;
            }

            // 判断是奖品还是祝福
            if (bottleContent.type === "prize") {
              isPrize.value = true;
              prizeTitle.value = bottleContent.name;
              message.value = bottleContent.description;
            } else {
              isPrize.value = false;
              message.value = bottleContent.text;
            }
          });
        }
      };

      const acceptBottle = () => {
        // 收下瓶子（后续可以对接后端接口保存）
        console.log("收下了:", isPrize.value ? "奖品 - " + prizeTitle.value : "祝福");
        message.value = "";
        isPrize.value = false;
        prizeTitle.value = "";
      };

      const throwAwayBottle = () => {
        // 丢海里（后续可以对接后端接口）
        console.log("丢掉了:", isPrize.value ? "奖品 - " + prizeTitle.value : "祝福");

        // 关闭弹窗
        message.value = "";
        isPrize.value = false;
        prizeTitle.value = "";

        // 把瓶子重新丢回海里
        if (game) {
          game.throwBottle();
        }
      };

      const closeMessage = () => {
        message.value = "";
        isPrize.value = false;
        prizeTitle.value = "";
      };

      const goBack = () => {
        router.push("/");
      };

      const toggleSound = () => {
        isMuted.value = soundManager.toggleMute();
        // 开启声音时播放背景音乐
        if (!isMuted.value) {
          soundManager.playBGM();
        } else {
          soundManager.stopBGM();
        }
      };

      const sendWish = () => {
        message.value = "你的祝福已经发送出去，希望能给他人带来幸福！";
      };

      return {
        pixiContainer,
        message,
        isPrize,
        prizeTitle,
        isMuted,
        isLoading,
        loadingProgress,
        loadingText,
        laoButtonImage,
        zhufuButtonImage,
        throwBottle,
        catchBottle,
        sendWish,
        acceptBottle,
        throwAwayBottle,
        closeMessage,
        goBack,
        toggleSound,
      };
    },
  };
</script>

<style scoped>
  .game-container {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    /* 适配iOS安全距离 */
    padding-top: constant(safe-area-inset-top);
    padding-top: env(safe-area-inset-top);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }

  /* 加载界面 */
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999;
    animation: fadeIn 0.3s ease-out;
  }

  .loading-content {
    text-align: center;
    color: white;
  }

  .loading-spinner {
    width: 80px;
    height: 80px;
    margin: 0 auto 30px;
    border: 6px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 30px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  }

  .loading-bar {
    width: 400px;
    max-width: 80vw;
    height: 12px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 6px;
    overflow: hidden;
    margin: 0 auto;
  }

  .loading-progress {
    height: 100%;
    background: linear-gradient(90deg, #56ab2f 0%, #a8e063 100%);
    border-radius: 6px;
    transition: width 0.3s ease;
    box-shadow: 0 0 10px rgba(168, 224, 99, 0.5);
  }

  .pixi-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .game-ui {
    position: absolute;
    bottom: 0px; /* 增加底部间距 */
    left: 0;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    z-index: 10;
  }

  /* 右侧扔一扔按钮 - 按750px设计稿 */
  .throw-button-right {
    position: fixed;
    bottom: 150px; /* 750px设计稿下的尺寸 */
    right: 30px;
    z-index: 15;
  }

  .bottom-buttons {
    display: flex;
    gap: 60px; /* 增大间距 */
    margin-bottom: 60px;
  }

  .sound-button {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 20;
  }

  .btn-throw {
    background-color: #ff9800;
    color: white;
    font-size: 28px; /* 750px设计稿下的字体 */
    padding: 16px 40px; /* 加大按钮 */
    border-radius: 40px;
    border: 4px solid #fff;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    cursor: pointer;
  }

  .btn-throw:hover {
    transform: translateY(-6px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }

  .btn-wish,
  .btn-lao {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    margin: 0 20px;
  }

  .button-image {
    width: 250px; /* 750px设计稿下的尺寸 */
    height: auto;
    transition: transform 0.3s ease, filter 0.3s ease;
  }

  .button-image:hover {
    transform: scale(1.1);
    filter: brightness(1.1);
  }

  .btn-sound {
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 50%;
    width: 80px; /* 750px设计稿下的尺寸 */
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .btn-sound:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: scale(1.1);
  }

  .sound-icon {
    fill: #333;
    width: 48px; /* 750px设计稿下的尺寸 */
    height: 48px;
  }

  .message-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: radial-gradient(circle at center, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%);
    backdrop-filter: blur(10px);
    z-index: 20;
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .message-content {
    position: relative;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 60px 50px;
    border-radius: 30px;
    width: 85%;
    max-width: 600px;
    text-align: center;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow: hidden;
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(50px) scale(0.9);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .prize-content {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #ffd700 100%);
    box-shadow: 0 20px 60px rgba(255, 87, 108, 0.6), 0 0 100px rgba(255, 215, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.3) inset;
    animation: slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), prizeGlow 2s ease-in-out infinite;
  }

  @keyframes prizeGlow {
    0%,
    100% {
      box-shadow: 0 20px 60px rgba(255, 87, 108, 0.6), 0 0 100px rgba(255, 215, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.3) inset;
    }
    50% {
      box-shadow: 0 25px 80px rgba(255, 87, 108, 0.8), 0 0 150px rgba(255, 215, 0, 0.6), 0 0 0 3px rgba(255, 255, 255, 0.5) inset;
    }
  }

  /* 粒子效果 */
  .particles {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }

  .particle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: radial-gradient(circle, #fff 0%, transparent 70%);
    border-radius: 50%;
    animation: float 3s infinite ease-in-out;
    opacity: 0;
  }

  .particle:nth-child(1) {
    left: 10%;
    animation-delay: 0s;
  }
  .particle:nth-child(2) {
    left: 20%;
    animation-delay: 0.2s;
  }
  .particle:nth-child(3) {
    left: 30%;
    animation-delay: 0.4s;
  }
  .particle:nth-child(4) {
    left: 40%;
    animation-delay: 0.6s;
  }
  .particle:nth-child(5) {
    left: 50%;
    animation-delay: 0.8s;
  }
  .particle:nth-child(6) {
    left: 60%;
    animation-delay: 1s;
  }
  .particle:nth-child(7) {
    left: 70%;
    animation-delay: 1.2s;
  }
  .particle:nth-child(8) {
    left: 80%;
    animation-delay: 1.4s;
  }
  .particle:nth-child(9) {
    left: 90%;
    animation-delay: 1.6s;
  }
  .particle:nth-child(10) {
    left: 15%;
    animation-delay: 1.8s;
  }
  .particle:nth-child(11) {
    left: 25%;
    animation-delay: 2s;
  }
  .particle:nth-child(12) {
    left: 35%;
    animation-delay: 2.2s;
  }
  .particle:nth-child(13) {
    left: 45%;
    animation-delay: 2.4s;
  }
  .particle:nth-child(14) {
    left: 55%;
    animation-delay: 2.6s;
  }
  .particle:nth-child(15) {
    left: 65%;
    animation-delay: 2.8s;
  }
  .particle:nth-child(16) {
    left: 75%;
    animation-delay: 0.3s;
  }
  .particle:nth-child(17) {
    left: 85%;
    animation-delay: 0.5s;
  }
  .particle:nth-child(18) {
    left: 95%;
    animation-delay: 0.7s;
  }
  .particle:nth-child(19) {
    left: 5%;
    animation-delay: 0.9s;
  }
  .particle:nth-child(20) {
    left: 50%;
    animation-delay: 1.1s;
  }

  @keyframes float {
    0% {
      transform: translateY(100%) scale(0);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      transform: translateY(-100%) scale(1);
      opacity: 0;
    }
  }

  /* 顶部装饰 */
  .top-decoration {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
    gap: 20px;
  }

  .decoration-line {
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%);
  }

  .decoration-icon {
    font-size: 60px;
    animation: rotate 3s linear infinite;
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
  }

  @keyframes rotate {
    0%,
    100% {
      transform: rotate(0deg) scale(1);
    }
    50% {
      transform: rotate(180deg) scale(1.2);
    }
  }

  /* 内容区域 */
  .content-area {
    position: relative;
    z-index: 1;
    margin: 20px 0;
  }

  .prize-title {
    font-size: 52px;
    font-weight: 900;
    color: #fff;
    margin-bottom: 20px;
    text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 107, 107, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3);
    animation: titlePulse 1.5s ease-in-out infinite;
    letter-spacing: 2px;
  }

  @keyframes titlePulse {
    0%,
    100% {
      transform: scale(1);
      text-shadow: 0 0 20px rgba(255, 215, 0, 0.8), 0 0 40px rgba(255, 107, 107, 0.6), 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
    50% {
      transform: scale(1.05);
      text-shadow: 0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 107, 107, 0.8), 2px 2px 4px rgba(0, 0, 0, 0.3);
    }
  }

  .message-title {
    font-size: 42px;
    font-weight: bold;
    color: #fff;
    margin-bottom: 20px;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    letter-spacing: 1px;
  }

  .message-text {
    font-size: 36px;
    line-height: 1.6;
    color: #fff;
    margin: 30px 0;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    font-weight: 500;
  }

  .prize-content .message-text {
    font-weight: 600;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }

  /* 底部波浪 */
  .bottom-waves {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px;
    overflow: hidden;
  }

  .bottom-waves svg {
    width: 100%;
    height: 100%;
    animation: wave 8s linear infinite;
  }

  @keyframes wave {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .button-group {
    display: flex;
    gap: 30px;
    justify-content: center;
    margin-top: 40px;
    position: relative;
    z-index: 2;
  }

  .btn {
    position: relative;
    padding: 20px 60px;
    font-size: 36px;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    font-weight: bold;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .btn::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.3);
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }

  .btn:active::before {
    width: 300px;
    height: 300px;
  }

  .btn-icon {
    font-size: 28px;
    font-weight: bold;
  }

  .btn-accept {
    background: linear-gradient(135deg, #56ab2f 0%, #a8e063 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(86, 171, 47, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.2) inset;
  }

  .btn-accept:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 40px rgba(86, 171, 47, 0.6), 0 0 0 3px rgba(255, 255, 255, 0.3) inset;
  }

  .btn-accept:active {
    transform: translateY(-2px) scale(1.02);
  }

  .btn-throw-away {
    background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%);
    color: white;
    box-shadow: 0 8px 25px rgba(44, 62, 80, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.2) inset;
  }

  .btn-throw-away:hover {
    transform: translateY(-5px) scale(1.05);
    box-shadow: 0 15px 40px rgba(44, 62, 80, 0.6), 0 0 0 3px rgba(255, 255, 255, 0.3) inset;
  }

  .btn-throw-away:active {
    transform: translateY(-2px) scale(1.02);
  }

  .prize-content .btn-accept {
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
    box-shadow: 0 8px 30px rgba(255, 107, 107, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3) inset;
    animation: btnPulse 2s ease-in-out infinite;
  }

  .prize-content .btn-accept:hover {
    box-shadow: 0 15px 50px rgba(255, 107, 107, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.5) inset;
    animation: none;
  }

  @keyframes btnPulse {
    0%,
    100% {
      box-shadow: 0 8px 30px rgba(255, 107, 107, 0.6), 0 0 0 2px rgba(255, 255, 255, 0.3) inset;
    }
    50% {
      box-shadow: 0 12px 40px rgba(255, 107, 107, 0.8), 0 0 0 3px rgba(255, 255, 255, 0.5) inset;
    }
  }
</style>
