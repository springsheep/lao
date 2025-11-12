<template>
  <div class="game2-container">
    <!-- 游戏容器 -->
    <div ref="gameContainer" class="game-content"></div>

    <!-- 标题图片将在游戏中加载 -->

    <!-- 底部按钮 -->
    <div class="bottom-buttons">
      <button class="btn-throw" @click="throwBottle">
        <img :src="throwButtonImage" alt="捞一捞" class="button-image" />
      </button>
      <button class="btn-wish" @click="sendWish">
        <img :src="wishButtonImage" alt="送祝福" class="button-image" />
      </button>
    </div>

    <!-- 静音按钮 -->
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

    <!-- 返回按钮 -->
    <div class="back-button">
      <button @click="goBack">返回首页</button>
    </div>

    <!-- 消息弹窗 -->
    <div v-if="message" class="message-box">
      <div class="message-content">
        <p>{{ message }}</p>
        <button class="btn-close" @click="closeMessage">关闭</button>
      </div>
    </div>
  </div>
</template>

<script>
  import { ref, onMounted, onBeforeUnmount } from "vue";
  import { useRouter } from "vue-router";
  import * as PIXI from "pixi.js";
  import { gsap } from "gsap";
  import soundManager from "../utils/SoundManager";
  import laoButtonImg from "../assets/lao.png";
  import wishButtonImg from "../assets/zhufu.png";
  import titleImg from "../assets/biaoti.png";
  import bottleImg from "../assets/bottle.png";

  export default {
    name: "Game2View",
    setup() {
      const router = useRouter();
      const gameContainer = ref(null);
      const message = ref("");
      const isMuted = ref(false);

      // PIXI应用实例
      let app = null;

      // 游戏元素
      let sea = null;
      let bottles = [];
      let clouds = [];
      let titleSprite = null;

      // 游戏状态
      let isAnimating = false;
      let waveTime = 0;

      onMounted(() => {
        initGame();
        window.addEventListener("resize", handleResize);
      });

      onBeforeUnmount(() => {
        destroyGame();
        window.removeEventListener("resize", handleResize);
      });

      // 初始化游戏
      const initGame = () => {
        // 创建PIXI应用
        app = new PIXI.Application({
          width: window.innerWidth,
          height: window.innerHeight,
          backgroundColor: 0x87ceeb, // 天空蓝色
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
        });

        // 添加到DOM
        gameContainer.value.appendChild(app.view);

        // 初始化游戏元素
        createGameLayout();
        loadTitleImage();
        createBottles();

        // 启动游戏循环
        app.ticker.add(gameLoop);

        // 播放背景音乐
        soundManager.playBGM();
      };

      // 创建游戏布局（上中下三部分）
      const createGameLayout = () => {
        const totalHeight = app.screen.height;
        const skyHeight = totalHeight * 0.375; // 上部天空区域高度，占总高度3/8
        const seaHeight = totalHeight * 0.375; // 中部海面区域高度，占总高度3/8
        const beachHeight = totalHeight * 0.25; // 下部沙滩区域高度，占总高度2/8

        // 创建天空区域（已经有了背景色）

        // 创建海面区域 - 使用渐变色让海洋更逼真
        sea = new PIXI.Graphics();

        // 绘制渐变海洋（从浅到深）
        const seaGradientSteps = 20;
        for (let i = 0; i < seaGradientSteps; i++) {
          const ratio = i / seaGradientSteps;
          // 从浅蓝色(0x4a9eff)渐变到深蓝色(0x0066cc)
          const r = Math.floor(74 + (0 - 74) * ratio);
          const g = Math.floor(158 + (102 - 158) * ratio);
          const b = Math.floor(255 + (204 - 255) * ratio);
          const color = (r << 16) | (g << 8) | b;

          const y = skyHeight + (seaHeight / seaGradientSteps) * i;
          const h = seaHeight / seaGradientSteps + 1;

          sea.beginFill(color);
          sea.drawRect(0, y, app.screen.width, h);
          sea.endFill();
        }
        app.stage.addChild(sea);

        // 添加海面波光效果
        const shimmer = new PIXI.Graphics();
        shimmer.beginFill(0xffffff, 0.15);
        shimmer.drawRect(0, skyHeight, app.screen.width, seaHeight * 0.3);
        shimmer.endFill();
        app.stage.addChild(shimmer);

        // 创建多层海浪效果
        for (let layer = 0; layer < 3; layer++) {
          const waves = new PIXI.Graphics();
          const alpha = 0.3 - layer * 0.08;
          waves.alpha = alpha;

          waves.beginFill(0x87ceeb);
          waves.moveTo(0, skyHeight + seaHeight);

          const waveSegments = 30;
          const waveWidth = app.screen.width / waveSegments;
          const waveHeight = 10 + layer * 5;
          const offset = layer * 0.5;

          for (let i = 0; i <= waveSegments; i++) {
            const x = i * waveWidth;
            const y = skyHeight + seaHeight - Math.sin(i * 0.8 + offset) * waveHeight;
            waves.lineTo(x, y);
          }

          waves.lineTo(app.screen.width, skyHeight + seaHeight);
          waves.lineTo(0, skyHeight + seaHeight);
          waves.endFill();
          app.stage.addChild(waves);
        }

        // 创建沙滩区域
        const beach = new PIXI.Graphics();
        beach.beginFill(0xf5deb3); // 沙色
        beach.drawRect(0, skyHeight + seaHeight, app.screen.width, beachHeight);
        beach.endFill();
        app.stage.addChild(beach);

        // 保存布局信息供后续使用
        app.layout = {
          skyHeight,
          seaHeight,
          beachHeight,
          seaTop: 0,
          seaMiddle: skyHeight + seaHeight / 2,
          seaBottom: skyHeight + seaHeight,
          totalHeight,
          seaLevel: skyHeight + seaHeight, // 海面高度位置
        };
      };

      // 加载标题图片
      const loadTitleImage = () => {
        // 使用标题图片
        const titleTexture = PIXI.Texture.from(titleImg);
        titleSprite = new PIXI.Sprite(titleTexture);

        // 调整图片大小和位置
        const scale = Math.min((app.screen.width * 0.6) / titleSprite.width, 0.5);
        titleSprite.scale.set(scale);

        // 居中显示，放在天空区域
        titleSprite.anchor.set(0.5, 0.5);
        titleSprite.x = app.screen.width / 2;
        titleSprite.y = app.layout.skyHeight / 2;

        // 添加到舞台
        app.stage.addChild(titleSprite);

        // 添加简单的浮动动画
        titleSprite.y &&
          gsap.to(titleSprite, {
            y: titleSprite.y + 5,
            duration: 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
      };

      // 创建瓶子
      const createBottles = () => {
        // 清空瓶子数组
        bottles = [];

        const seaWidth = app.screen.width;
        const skyHeight = app.layout.skyHeight;
        const seaHeight = app.layout.seaHeight;

        // 定义5个瓶子的位置：上2个，中1个，下2个
        const positions = [
          // 上面2个
          { x: seaWidth * 0.3, y: skyHeight + seaHeight * 0.25 },
          { x: seaWidth * 0.7, y: skyHeight + seaHeight * 0.25 },
          // 中间1个
          { x: seaWidth * 0.5, y: skyHeight + seaHeight * 0.5 },
          // 下面2个
          { x: seaWidth * 0.3, y: skyHeight + seaHeight * 0.75 },
          { x: seaWidth * 0.7, y: skyHeight + seaHeight * 0.75 },
        ];

        positions.forEach((pos, i) => {
          // 创建瓶子精灵
          const bottle = createBottle();

          // 设置瓶子位置
          bottle.x = pos.x;
          bottle.y = pos.y;
          bottle.scale.set(0.4);
          bottle.baseY = pos.y; // 记录基准Y坐标，用于浮动动画
          bottle.offset = Math.random() * Math.PI * 2; // 随机偏移，使每个瓶子的浮动不同步
          bottle.rotation = Math.PI * 0.2; // 微微倾斜

          // 添加到舞台
          app.stage.addChild(bottle);
          bottles.push(bottle);

          // 创建水波纹效果
          createBottleRipples(bottle);
        });
      };

      // 创建单个瓶子
      const createBottle = () => {
        // 创建容器
        const container = new PIXI.Container();

        // 添加光晕效果
        const glow = new PIXI.Graphics();
        glow.beginFill(0xffffff, 0.3);
        glow.drawCircle(0, 0, 30);
        glow.endFill();
        glow.filters = [new PIXI.BlurFilter(10)];
        glow.alpha = 0.4;
        container.addChild(glow);

        // 使用瓶子图片创建精灵
        const bottleTexture = PIXI.Texture.from(bottleImg);
        const bottleSprite = new PIXI.Sprite(bottleTexture);

        // 设置锚点为中心
        bottleSprite.anchor.set(0.5, 0.5);

        // 设置瓶子大小
        bottleSprite.scale.set(0.08);

        container.addChild(bottleSprite);

        return container;
      };

      // 为瓶子创建水波纹效果
      const createBottleRipples = (bottle) => {
        // 创建3个水波纹
        for (let i = 0; i < 3; i++) {
          const ripple = new PIXI.Graphics();
          ripple.lineStyle(2, 0x87ceeb, 0.6);
          ripple.drawCircle(0, 0, 20 + i * 10);
          ripple.x = bottle.x;
          ripple.y = bottle.y;
          ripple.alpha = 0;
          app.stage.addChildAt(ripple, 0); // 放在最底层

          // 保存到瓶子对象上
          if (!bottle.ripples) {
            bottle.ripples = [];
          }
          bottle.ripples.push(ripple);

          // 创建循环动画
          const animateRipple = () => {
            gsap.to(ripple, {
              alpha: 0.6,
              duration: 0.5,
              ease: "power1.out",
            });

            gsap.to(ripple.scale, {
              x: 1.5,
              y: 1.5,
              duration: 2,
              ease: "power1.out",
              onComplete: () => {
                // 重置并重新开始
                ripple.scale.set(1);
                ripple.alpha = 0;
                setTimeout(animateRipple, i * 800); // 错开时间
              },
            });
          };

          // 延迟启动，让每个波纹错开
          setTimeout(animateRipple, i * 800);
        }
      };

      // 游戏循环
      const gameLoop = (delta) => {
        // 更新游戏元素
        waveTime += 0.01;

        // 更新瓶子浮动动画
        updateBottles();
      };

      // 更新瓶子浮动动画
      const updateBottles = () => {
        if (!bottles || bottles.length === 0) return;

        // 更新每个瓶子的浮动效果
        for (let i = 0; i < bottles.length; i++) {
          const bottle = bottles[i];

          // 浮动效果 - 结合多个正弦波
          const primaryWave = Math.sin(waveTime * 0.7 + bottle.offset) * 8; // 主要波动
          const secondaryWave = Math.sin(waveTime * 1.2 + bottle.offset * 2) * 3; // 次要波动
          bottle.y = bottle.baseY + primaryWave + secondaryWave;

          // 微微旋转
          bottle.rotation = Math.PI * 0.1 + Math.sin(waveTime * 0.3 + bottle.offset) * 0.05;

          // 更新光晕效果
          if (bottle.children[0]) {
            bottle.children[0].alpha = 0.3 + Math.sin(waveTime * 0.5) * 0.1;
          }

          // 更新水波纹位置
          if (bottle.ripples) {
            bottle.ripples.forEach((ripple) => {
              ripple.x = bottle.x;
              ripple.y = bottle.y;
            });
          }
        }
      };

      // 处理窗口大小变化
      const handleResize = () => {
        if (app) {
          // 重新设置渲染器大小
          app.renderer.resize(window.innerWidth, window.innerHeight);

          // 重新创建游戏布局
          app.stage.removeChildren();
          createGameLayout();
          loadTitleImage();
          createBottles();
        }
      };

      // 扔瓶子
      const throwBottle = () => {
        if (isAnimating) return;

        message.value = "你的漂流瓶已经被扔出去了，希望有人能捡到它！";
        soundManager.play("click");
      };

      // 送祝福
      const sendWish = () => {
        message.value = "你的祝福已经发送出去，希望能给他人带来幸福！";
        soundManager.play("click");
      };

      // 关闭消息
      const closeMessage = () => {
        message.value = "";
      };

      // 返回首页
      const goBack = () => {
        router.push("/");
      };

      // 切换声音
      const toggleSound = () => {
        isMuted.value = soundManager.toggleMute();
      };

      // 销毁游戏
      const destroyGame = () => {
        if (app) {
          soundManager.stopBGM();
          //   app.destroy(true, { children: true, texture: true, baseTexture: true });
          app = null;
        }
      };

      // 准备按钮图片
      const throwButtonImage = laoButtonImg;
      const wishButtonImage = wishButtonImg;

      return {
        gameContainer,
        message,
        isMuted,
        throwButtonImage,
        wishButtonImage,
        throwBottle,
        sendWish,
        closeMessage,
        goBack,
        toggleSound,
      };
    },
  };
</script>

<style scoped>
  .game2-container {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
    /* 适配iOS安全距离 */
    padding-top: constant(safe-area-inset-top);
    padding-top: env(safe-area-inset-top);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }

  .game-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  /* 底部按钮样式 */
  .bottom-buttons {
    position: absolute;
    bottom: 20px;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    gap: 40px;
    z-index: 10;
  }

  .btn-throw,
  .btn-wish {
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .button-image {
    height: auto;
    width: 150px;
    transition: transform 0.3s ease, filter 0.3s ease;
  }

  .button-image:hover {
    transform: scale(1.1);
    filter: brightness(1.1);
  }

  /* 静音按钮样式 */
  .sound-button {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: 20;
  }

  .btn-sound {
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
  }

  .btn-sound:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: scale(1.1);
  }

  .sound-icon {
    fill: #333;
    width: 24px;
    height: 24px;
  }

  /* 返回按钮样式 */
  .back-button {
    position: absolute;
    top: 10px;
    left: 10px;
    z-index: 20;
  }

  .back-button button {
    padding: 8px 15px;
    background-color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .back-button button:hover {
    background-color: rgba(255, 255, 255, 0.9);
    transform: scale(1.05);
  }

  /* 消息框样式 */
  .message-box {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 30;
  }

  .message-content {
    background-color: white;
    padding: 20px;
    border-radius: 10px;
    max-width: 80%;
    text-align: center;
  }

  .message-content p {
    margin-bottom: 20px;
    font-size: 18px;
  }

  .btn-close {
    background-color: #f44336;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.3s ease;
  }

  .btn-close:hover {
    background-color: #d32f2f;
    transform: scale(1.05);
  }
</style>
