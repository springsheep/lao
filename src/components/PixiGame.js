import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import soundManager from "../utils/SoundManager";
import MobileAdapter from "../utils/MobileAdapter";

// 导入图片资源
import bottleImage from "../assets/bottle.png";
import bottle1Image from "../assets/bottle1.png"; // 海里飘着的瓶子
import netImage from "../assets/net.png";
import titleImage from "../assets/biaoti.png";
import dao1Image from "../assets/dao1.png";
import dao2Image from "../assets/dao2.png";
import beachImage from "../assets/沙滩.png"; // 沙滩背景图

// ==================== 游戏元素缩放配置 ====================
// 所有元素的大小都在这里统一配置，方便调整
const ELEMENT_SCALES = {
  // 瓶子相关
  bottle: {
    inSea: 1.2, // 海里漂浮的瓶子 (bottle1.png)
    throwing: 1.8, // 扔出时的瓶子 (bottle.png)
    landed: 1.2, // 落地后的瓶子 (bottle1.png)
    caught: 0.04, // 被捕获的瓶子
  },

  // 场景元素
  island: {
    left: 0.8, // 左侧小岛
    right: 1.5, // 右侧小岛
  },

  title: 0.8, // 标题

  // 动物和自然元素
  fish: {
    min: 8, // 小鱼最小尺寸
    max: 20, // 小鱼最大尺寸
  },

  bubble: {
    min: 2, // 气泡最小尺寸
    max: 10, // 气泡最大尺寸
  },

  cloud: {
    min: 1, // 云朵最小缩放
    max: 4, // 云朵最大缩放
  },

  // 太阳
  sun: {
    outerGlow: 60, // 外部光晕半径
    middleGlow: 45, // 中间光晕半径
    innerGlow: 35, // 内部光晕半径
    body: 30, // 太阳主体半径
    innerSun: 15, // 内部纹理半径
  },

  // 工具
  net: 0.5, // 渔网
};

// 预设的漂流瓶消息
const BOTTLE_MESSAGES = [
  "你好，希望捡到这个瓶子的人能够开心每一天！",
  "世界很大，但缘分让我们相遇。",
  "无论你在哪里，愿你被这个世界温柔以待。",
  "有时候，最美的风景是你看不见的地方。",
  "生活不易，但请相信美好终会到来。",
  "我在这里放一个小秘密：我很喜欢看星星。",
  "希望你的生活充满阳光，就像这片海一样蔚蓝。",
  "不管多远，心意都能传达。",
  "这是一个小小的心愿：愿你平安喜乐。",
  "陌生人，愿你的旅途一路顺风。",
];

// 预设的奖品列表
const BOTTLE_PRIZES = [
  { type: "prize", name: "🎁 神秘礼盒", description: "恭喜你获得神秘礼盒一个" },
  { type: "prize", name: "💎 幸运宝石", description: "恭喜你获得幸运宝石" },
  { type: "prize", name: "🌟 星愿卡", description: "恭喜你获得星愿卡，愿望成真" },
  { type: "prize", name: "🎈 幸运气球", description: "恭喜你获得幸运气球" },
  { type: "prize", name: "🎊 惊喜彩蛋", description: "恭喜你获得惊喜彩蛋" },
  { type: "prize", name: "🏆 荣耀奖杯", description: "恭喜你获得荣耀奖杯" },
  { type: "prize", name: "🎪 欢乐券", description: "恭喜你获得欢乐券一张" },
  { type: "prize", name: "🌈 彩虹祝福", description: "恭喜你获得彩虹祝福" },
];

// 奖品概率配置（30%概率获得奖品）
const PRIZE_PROBABILITY = 1;

class PixiGame {
  constructor(container) {
    this.container = container;
    this.app = null;
    this.sea = null;
    this.bottle = null;
    this.bottles = [];
    this.isAnimating = false;
    this.bottlesInSea = [];

    // 加载资源
    this.loader = null;
    this.resources = null;

    // 海浪动画
    this.waveTime = 1;

    // 瓶子生成参数
    this.bottleGenerationTimer = 0;
    this.bottleGenerationInterval = 8000; // 8秒生成一个瓶子
    this.maxBottlesInSea = 5; // 海中最大瓶子数量
    this.initialBottleCount = 3; // 初始瓶子数量

    // 气泡参数
    this.bubbles = [];
    this.bubbleGenerationTimer = 0;
    this.bubbleGenerationInterval = 500; // 0.5秒生成一个气泡
    this.maxBubbles = 10; // 最大气泡数量

    // 小鱼参数
    this.fishes = [];
    this.fishGenerationTimer = 0;
    this.fishGenerationInterval = 2000; // 3秒生成一条鱼
    this.maxFishes = 10; // 最大鱼数量

    // 白云参数
    this.clouds = [];
    this.maxClouds = 3; // 最大云数量

    // 检测设备类型
    this.deviceInfo = MobileAdapter.detectDevice();

    // 性能优化参数
    this.lastFrameTime = 0;
    this.frameInterval = 1000 / 30; // 目标帧率为30fps
    this.isLowPerformanceMode = this.deviceInfo.isMobile; // 移动端默认低性能模式

    // 图片资源 - 使用导入的真实图片
    this.bottleImageUrl = bottleImage; // 完整瓶子(用于扔和捞)
    this.bottle1ImageUrl = bottle1Image; // 海里飘着的瓶子
    this.netImageUrl = netImage; // 使用导入的捕网图片
    this.titleImageUrl = titleImage; // 使用导入的标题图片
    this.dao1ImageUrl = dao1Image; // 左侧小岛图片
    this.dao2ImageUrl = dao2Image; // 右侧小岛图片
    this.beachImageUrl = beachImage; // 沙滩背景图片

    // 响应式缩放因子 - 配合750px设计稿
    this.baseWidth = 750; // 与postcss配置一致
    this.baseHeight = 1334; // iPhone 6/7/8标准高度
    this.scaleFactor = this.calculateScaleFactor();
  }

  // 计算缩放因子 - 基于750px设计稿
  calculateScaleFactor() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // 根据屏幕宽度计算缩放因子(主要以宽度为准)
    const widthScale = screenWidth / this.baseWidth;
    const heightScale = screenHeight / this.baseHeight;

    // 使用宽度缩放,保证横向充满
    const scale = widthScale;

    console.log(`屏幕尺寸: ${screenWidth}x${screenHeight}, 缩放因子: ${scale.toFixed(3)}`);

    return scale;
  }

  init() {
    // 创建PIXI应用
    this.app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x87ceeb,
      resolution: window.devicePixelRatio || 1, // 始终使用设备像素比，适配高DPI屏幕
      autoDensity: true,
      antialias: true, // 开启抗锯齿，提高画质
      powerPreference: "high-performance",
      autoStart: true,
    });

    // 添加到DOM
    this.container.appendChild(this.app.view);

    // 监听窗口大小变化
    window.addEventListener("resize", () => this.handleResize());

    // 优化渲染器设置
    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR; // 使用线性缩放，画质更好
    PIXI.settings.ROUND_PIXELS = false; // 不取整像素，避免位置偏移

    // 预加载音效
    soundManager.preload();

    // 加载资源
    this.loadResources();
  }

  // 处理窗口大小变化
  handleResize() {
    if (!this.app) return;

    // 重新计算缩放因子
    this.scaleFactor = this.calculateScaleFactor();

    // 调整画布大小，保持 resolution
    const resolution = window.devicePixelRatio || 1;
    this.app.renderer.resize(window.innerWidth, window.innerHeight);
    this.app.renderer.resolution = resolution;

    // 重新布局所有元素
    this.repositionElements();
  }

  // 重新布局元素
  repositionElements() {
    // 重新布局标题 - 750px设计稿
    if (this.titleSprite) {
      this.titleSprite.x = this.app.screen.width / 2;
      this.titleSprite.y = 100 * this.scaleFactor;
      this.titleSprite.scale.set(ELEMENT_SCALES.title * this.scaleFactor);
    }

    // 重新布局小岛 - 750px设计稿
    if (this.island1) {
      this.island1.scale.set(ELEMENT_SCALES.island.left * this.scaleFactor);
      this.island1.y = this.app.screen.height * 0.6;
    }
    if (this.island2) {
      this.island2.scale.set(ELEMENT_SCALES.island.right * this.scaleFactor);
      this.island2.x = this.app.screen.width;
      this.island2.y = this.app.screen.height * 0.61;
    }

    // 重新计算海中瓶子位置
    this.bottlesInSea.forEach((bottle) => {
      bottle.baseY = this.app.screen.height * 0.62;
    });

    // 重新布局沙滩
    if (this.beachSprite) {
      const scaleX = this.app.screen.width / this.beachSprite.texture.width;
      this.beachSprite.scale.set(scaleX); // 使用相同的缩放比例保持宽高比
      this.beachSprite.x = 0;
      this.beachSprite.y = this.app.screen.height - this.beachSprite.height;
    }
  }

  loadResources() {
    try {
      // 直接创建纹理，因为我们已经导入了图片
      this.resources = {
        bottle: { texture: PIXI.Texture.from(this.bottleImageUrl) },
        bottle1: { texture: PIXI.Texture.from(this.bottle1ImageUrl) },
        net: { texture: PIXI.Texture.from(this.netImageUrl) },
        title: { texture: PIXI.Texture.from(this.titleImageUrl) },
        dao1: { texture: PIXI.Texture.from(this.dao1ImageUrl) },
        dao2: { texture: PIXI.Texture.from(this.dao2ImageUrl) },
        beach: { texture: PIXI.Texture.from(this.beachImageUrl) },
      };

      console.log("资源加载成功:", this.resources);

      // 等待沙滩纹理加载完成后再创建场景
      const beachTexture = this.resources.beach.texture;
      if (beachTexture.baseTexture.valid) {
        // 纹理已经加载完成
        this.setupScene();
      } else {
        // 等待纹理加载完成
        beachTexture.baseTexture.on("loaded", () => {
          this.setupScene();
        });
      }
    } catch (error) {
      console.error("加载资源失败:", error);
      console.log("尝试使用绘制的瓶子代替");

      // 初始化空资源对象
      this.resources = {};

      // 即使加载失败也继续设置场景
      this.setupScene();
    }
  }

  setupScene() {
    // 创建海面
    this.createSea();

    // 创建标题
    this.createTitle();

    // 初始化海中瓶子
    this.initializeBottlesInSea();

    // 初始化气泡
    this.initializeBubbles();

    // 初始化小鱼
    this.initializeFishes();

    // 初始化白云
    this.initializeClouds();

    // 创建小岛装饰
    this.createIslands();

    // 播放背景音乐
    soundManager.playBGM();

    // 开始游戏循环
    this.app.ticker.add(this.gameLoop.bind(this));
  }

  initializeBottlesInSea() {
    // 初始化海中瓶子
    for (let i = 0; i < this.initialBottleCount; i++) {
      this.generateRandomBottle();
    }
  }

  initializeBubbles() {
    // 初始生成一些气泡
    for (let i = 0; i < 10; i++) {
      this.generateBubble();
    }
  }

  generateBubble() {
    // 如果气泡数量超过上限，则不生成
    if (this.bubbles.length >= this.maxBubbles) {
      return null;
    }

    // 创建气泡
    const bubble = new PIXI.Graphics();

    // 随机大小 - 750px设计稿
    const baseSize = (ELEMENT_SCALES.bubble.min + Math.random() * ELEMENT_SCALES.bubble.max) * this.scaleFactor;
    const size = baseSize;

    // 半透明白色外圈，透明内部
    bubble.lineStyle(1, 0xffffff, 0.8);
    bubble.beginFill(0xffffff, 0.2);
    bubble.drawCircle(0, 0, size);
    bubble.endFill();

    // 添加高光
    const highlight = new PIXI.Graphics();
    highlight.beginFill(0xffffff, 0.5);
    highlight.drawCircle(-size * 0.3, -size * 0.3, size * 0.2);
    highlight.endFill();
    bubble.addChild(highlight);

    // 随机位置（海底）
    bubble.x = Math.random() * this.app.screen.width;
    bubble.y = this.app.screen.height * 0.8 + Math.random() * (this.app.screen.height * 0.2);

    // 设置气泡属性
    bubble.speed = 0.5 + Math.random() * 1.5; // 上升速度
    bubble.wobble = {
      speed: 0.02 + Math.random() * 0.03,
      amplitude: 0.5 + Math.random() * 1.5,
      offset: Math.random() * Math.PI * 2,
    };

    // 添加到容器中
    this.bubbleContainer.addChild(bubble);
    this.bubbles.push(bubble);

    return bubble;
  }

  updateBubbles(deltaTime) {
    // 生成新气泡
    this.bubbleGenerationTimer += deltaTime;
    if (this.bubbleGenerationTimer >= this.bubbleGenerationInterval) {
      this.bubbleGenerationTimer = 0;
      this.generateBubble();
    }

    // 更新所有气泡
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const bubble = this.bubbles[i];

      // 上升
      bubble.y -= bubble.speed;

      // 左右摇摆
      bubble.x += Math.sin(this.waveTime * bubble.wobble.speed + bubble.wobble.offset) * bubble.wobble.amplitude;

      // 如果气泡到达水面，则移除
      if (bubble.y < this.app.screen.height * 0.55) {
        this.bubbleContainer.removeChild(bubble);
        this.bubbles.splice(i, 1);

        // 在水面创建小水花
        this.createTinyRipple(bubble.x, this.app.screen.height * 0.55);
      }
    }
  }

  createTinyRipple(x, y) {
    // 创建小水花
    const ripple = new PIXI.Graphics();
    ripple.lineStyle(1, 0x87ceeb, 0.5);
    ripple.drawCircle(0, 0, 3);
    ripple.x = x;
    ripple.y = y;
    this.app.stage.addChild(ripple);

    // 水花动画
    gsap.to(ripple, {
      alpha: 0,
      scale: 2,
      duration: 0.8,
      ease: "power1.out",
      onComplete: () => {
        this.app.stage.removeChild(ripple);
      },
    });
  }

  initializeFishes() {
    // 初始生成一些小鱼
    for (let i = 0; i < 5; i++) {
      this.generateFish();
    }
  }

  generateFish() {
    // 如果小鱼数量超过上限，则不生成
    if (this.fishes.length >= this.maxFishes) {
      return null;
    }

    // 创建小鱼容器
    const fish = new PIXI.Container();

    // 随机大小 - 750px设计稿
    const baseSize = (ELEMENT_SCALES.fish.min + Math.random() * ELEMENT_SCALES.fish.max) * this.scaleFactor;
    const size = baseSize;

    // 随机鱼的颜色
    const fishColors = [
      0xff6347, // 橙红色
      0xffd700, // 金色
      0x20b2aa, // 浅绿色
      0x4682b4, // 钢蓝色
      0xda70d6, // 紫色
    ];
    const fishColor = fishColors[Math.floor(Math.random() * fishColors.length)];

    // 创建鱼身
    const fishBody = new PIXI.Graphics();
    fishBody.beginFill(fishColor);

    // 绘制鱼形状
    fishBody.moveTo(size * 2, 0); // 鱼头
    fishBody.bezierCurveTo(size * 1.5, -size * 0.8, -size * 1, -size * 0.8, -size * 2, 0);
    fishBody.bezierCurveTo(-size * 1, size * 0.8, size * 1.5, size * 0.8, size * 2, 0);
    fishBody.endFill();

    // 创建鱼尾容器（用于独立控制缩放）
    const fishTail = new PIXI.Graphics();
    fishTail.beginFill(fishColor);
    // 以(0,0)为缩放中心绘制鱼尾
    fishTail.moveTo(0, 0);
    fishTail.lineTo(-size * 1.5, -size * 0.8);
    fishTail.lineTo(-size * 1.5, size * 0.8);
    fishTail.lineTo(0, 0);
    fishTail.endFill();
    // 设置鱼尾位置在鱼身尾部
    fishTail.x = -size * 2;
    fishTail.y = 0;

    // 创建鱼眼
    const fishEye = new PIXI.Graphics();
    fishEye.beginFill(0xffffff);
    fishEye.drawCircle(size, -size * 0.2, size * 0.3);
    fishEye.endFill();
    fishEye.beginFill(0x000000);
    fishEye.drawCircle(size + size * 0.15, -size * 0.2, size * 0.15);
    fishEye.endFill();

    // 添加所有部分到鱼容器
    fish.addChild(fishBody);
    fish.addChild(fishTail);
    fish.addChild(fishEye);

    // 设置鱼的初始位置 - 只在70%以下游动
    const fromRight = Math.random() > 0.5;
    fish.x = fromRight ? this.app.screen.width + size * 4 : -size * 4;
    fish.y = this.app.screen.height * 0.62 + Math.random() * (this.app.screen.height * 0.2);

    // 设置鱼的方向
    fish.scale.x = fromRight ? -1 : 1; // 如果从右边来，则需要翻转

    // 设置鱼的属性
    fish.speed = 0.5 + Math.random() * 2; // 移动速度
    fish.direction = fromRight ? -1 : 1; // 移动方向
    fish.wobble = {
      speed: 0.02 + Math.random() * 0.03,
      amplitude: 1 + Math.random() * 3,
      offset: Math.random() * Math.PI * 2,
    };
    fish.tailAnimation = {
      speed: 0.15 + Math.random() * 0.25, // 增加摆动速度
      offset: Math.random() * Math.PI * 2,
    };

    // 添加到容器中
    this.fishContainer.addChild(fish);
    this.fishes.push(fish);

    return fish;
  }

  updateFishes(deltaTime) {
    // 生成新鱼
    this.fishGenerationTimer += deltaTime;
    if (this.fishGenerationTimer >= this.fishGenerationInterval) {
      this.fishGenerationTimer = 0;
      this.generateFish();
    }

    // 更新所有鱼
    for (let i = this.fishes.length - 1; i >= 0; i--) {
      const fish = this.fishes[i];

      // 水平移动
      fish.x += fish.speed * fish.direction;

      // 上下摇摆，限制在70%以下
      const newY = fish.y + Math.sin(this.waveTime * fish.wobble.speed + fish.wobble.offset) * 0.5;
      // 确保鱼只在70%以下游动
      if (newY >= this.app.screen.height * 0.7 && newY <= this.app.screen.height) {
        fish.y = newY;
      }

      // 鱼尾左右摆动动画（使用scale.x实现）
      const fishTail = fish.children[1];
      if (fishTail) {
        // 使用Date.now()确保动画持续更新
        const time = Date.now() * 0.001; // 转换为秒
        const tailSwing = Math.sin(time * 3 + fish.tailAnimation.offset);
        // 使用scale.x实现左右摆动，范围0.6到1.0
        fishTail.scale.x = 0.8 + tailSwing * 0.2;
      }

      // 如果鱼游出屏幕，则移除
      if ((fish.direction > 0 && fish.x > this.app.screen.width + 50) || (fish.direction < 0 && fish.x < -50)) {
        this.fishContainer.removeChild(fish);
        this.fishes.splice(i, 1);
      }
    }
  }

  initializeClouds() {
    // 初始生成一些白云
    for (let i = 0; i < this.maxClouds; i++) {
      this.generateCloud();
    }
  }

  createTitle() {
    // 创建标题图片
    if (this.resources && this.resources.title && this.resources.title.texture) {
      // 使用加载的标题图片
      this.titleSprite = new PIXI.Sprite(this.resources.title.texture);

      // 调整图片大小和位置
      const scale = 0.8 * this.scaleFactor; // 根据屏幕宽度调整大小，最大为原始大小的0.5倍
      this.titleSprite.scale.set(scale);

      // 居中显示 - 响应式位置(750px设计稿)
      this.titleSprite.anchor.set(0.5, 0);
      this.titleSprite.x = this.app.screen.width / 2;
      this.titleSprite.y = 100 * this.scaleFactor; // 750px设计稿下100px

      // 添加到舞台
      this.app.stage.addChild(this.titleSprite);

      // 添加简单的动画效果
      // gsap.to(this.titleSprite, {
      //   y: 10,
      //   duration: 3,
      //   repeat: -1,
      //   yoyo: true,
      //   ease: "sine.inOut",
      // });
    } else {
      console.log("标题图片加载失败");
    }
  }

  createIslands() {
    // 创建左侧小岛
    if (this.resources && this.resources.dao1 && this.resources.dao1.texture) {
      this.island1 = new PIXI.Sprite(this.resources.dao1.texture);

      // 调整大小和位置 - 放在海天交接处的左侧(750px设计稿)
      const scale = 0.8 * this.scaleFactor; // 750px设计稿下的尺寸
      this.island1.scale.set(scale);
      this.island1.anchor.set(0, 1); // 锚点在左下角
      this.island1.x = 0; // 左侧
      this.island1.y = this.app.screen.height * 0.58; // 海天交接处

      // 添加到舞台，确保在瓶子下层
      this.app.stage.addChildAt(this.island1, 1);

      console.log("左侧小岛创建成功");
    } else {
      console.log("左侧小岛图片加载失败");
    }

    // 创建右侧小岛
    if (this.resources && this.resources.dao2 && this.resources.dao2.texture) {
      this.island2 = new PIXI.Sprite(this.resources.dao2.texture);

      // 调整大小和位置 - 放在海天交接处的右侧(750px设计稿)
      const scale = 1.5 * this.scaleFactor; // 750px设计稿下的尺寸
      this.island2.scale.set(scale);
      this.island2.anchor.set(1, 1); // 锚点在右下角
      this.island2.x = this.app.screen.width; // 右侧
      this.island2.y = this.app.screen.height * 0.59; // 往下调整一点

      // 添加到舞台，确保在瓶子下层
      this.app.stage.addChildAt(this.island2, 1);

      console.log("右侧小岛创建成功");
    } else {
      console.log("右侧小岛图片加载失败");
    }
  }

  generateCloud() {
    // 如果云数量超过上限，则不生成
    if (this.clouds.length >= this.maxClouds) {
      return null;
    }

    // 创建云容器
    const cloud = new PIXI.Container();

    // 随机云的大小 - 750px设计稿
    const cloudScale = (ELEMENT_SCALES.cloud.min + Math.random() * ELEMENT_SCALES.cloud.max) * this.scaleFactor;
    const scale = cloudScale;

    // 创建云朵
    const createCloudPuff = (x, y, size) => {
      const puff = new PIXI.Graphics();
      puff.beginFill(0xffffff, 0.9);
      puff.drawCircle(0, 0, size);
      puff.endFill();
      puff.x = x;
      puff.y = y;
      return puff;
    };

    // 添加多个云朵组成一朵云
    const baseSize = 20 * scale;
    cloud.addChild(createCloudPuff(0, 0, baseSize));
    cloud.addChild(createCloudPuff(baseSize * 0.8, -baseSize * 0.2, baseSize * 0.7));
    cloud.addChild(createCloudPuff(-baseSize * 0.8, -baseSize * 0.1, baseSize * 0.6));
    cloud.addChild(createCloudPuff(baseSize * 0.4, baseSize * 0.2, baseSize * 0.8));
    cloud.addChild(createCloudPuff(-baseSize * 0.4, baseSize * 0.1, baseSize * 0.7));

    // 设置云的位置
    cloud.x = Math.random() * this.app.screen.width;
    cloud.y = Math.random() * (this.app.screen.height * 0.3); // 只在屏幕上方30%的区域

    // 设置云的属性
    cloud.speed = 0.1 + Math.random() * 0.3; // 移动速度
    cloud.direction = Math.random() > 0.5 ? 1 : -1; // 随机方向

    // 添加到容器中
    this.cloudContainer.addChild(cloud);
    this.clouds.push(cloud);

    return cloud;
  }

  createSun() {
    // 创建太阳容器
    this.sunContainer = new PIXI.Container();

    // 太阳位置（右上角）
    const sunX = this.app.screen.width * 0.9;
    const sunY = this.app.screen.height * 0.12;
    this.sunContainer.x = sunX;
    this.sunContainer.y = sunY;

    // 创建外部光晕（最大的）- 750px设计稿
    const outerGlow = new PIXI.Graphics();
    outerGlow.beginFill(0xffffcc, 0.15);
    outerGlow.drawCircle(0, 0, ELEMENT_SCALES.sun.outerGlow * this.scaleFactor);
    outerGlow.endFill();
    outerGlow.filters = [new PIXI.BlurFilter(30 * this.scaleFactor)];
    this.sunContainer.addChild(outerGlow);

    // 创建中间光晕
    const middleGlow = new PIXI.Graphics();
    middleGlow.beginFill(0xffff99, 0.25);
    middleGlow.drawCircle(0, 0, ELEMENT_SCALES.sun.middleGlow * this.scaleFactor);
    middleGlow.endFill();
    middleGlow.filters = [new PIXI.BlurFilter(15 * this.scaleFactor)];
    this.sunContainer.addChild(middleGlow);

    // 创建内部光晕
    const innerGlow = new PIXI.Graphics();
    innerGlow.beginFill(0xffff66, 0.35);
    innerGlow.drawCircle(0, 0, ELEMENT_SCALES.sun.innerGlow * this.scaleFactor);
    innerGlow.endFill();
    innerGlow.filters = [new PIXI.BlurFilter(8 * this.scaleFactor)];
    this.sunContainer.addChild(innerGlow);

    // 创建太阳主体
    const sun = new PIXI.Graphics();
    const gradient = this.createRadialGradient(ELEMENT_SCALES.sun.body * this.scaleFactor, 0xffff00, 0xffa500);
    sun.beginTextureFill({ texture: gradient });
    sun.drawCircle(0, 0, ELEMENT_SCALES.sun.body * this.scaleFactor);
    sun.endFill();
    this.sunContainer.addChild(sun);

    // 创建太阳内部纹理 - 750px设计稿
    const innerSun = new PIXI.Graphics();
    innerSun.beginFill(0xffffff, 0.5);
    innerSun.drawCircle(0, 0, ELEMENT_SCALES.sun.innerSun * this.scaleFactor);
    innerSun.endFill();
    innerSun.filters = [new PIXI.BlurFilter(3 * this.scaleFactor)];
    this.sunContainer.addChild(innerSun);

    // 创建太阳光芒 - 使用三角形而非直线
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const length = 25 + Math.random() * 15;

      // 使用三角形光芒
      const ray = new PIXI.Graphics();
      ray.beginFill(0xffff33, 0.7);

      // 三角形宽度
      const width = 3 + Math.random() * 2;

      // 绘制三角形光芒
      ray.moveTo(0, 0);
      ray.lineTo(Math.cos(angle - 0.02) * length, Math.sin(angle - 0.02) * length);
      ray.lineTo(Math.cos(angle + 0.02) * length, Math.sin(angle + 0.02) * length);
      ray.lineTo(0, 0);
      ray.endFill();

      this.sunContainer.addChild(ray);

      // 添加动画参数
      ray.baseLength = length;
      ray.speed = 0.01 + Math.random() * 0.02;
      ray.offset = Math.random() * Math.PI * 2;
      ray.width = width;
    }

    // 添加到舞台
    this.app.stage.addChild(this.sunContainer);

    // 添加旋转动画
    gsap.to(this.sunContainer, {
      rotation: Math.PI * 2,
      duration: 120,
      repeat: -1,
      ease: "none",
    });
  }

  createRadialGradient(radius, innerColor, outerColor) {
    // 创建径向渐变纹理
    const canvas = document.createElement("canvas");
    const size = radius * 2;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const gradient = ctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    gradient.addColorStop(0, `#${innerColor.toString(16).padStart(6, "0")}`);
    gradient.addColorStop(1, `#${outerColor.toString(16).padStart(6, "0")}`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return PIXI.Texture.from(canvas);
  }

  updateSun() {
    // 更新太阳光芒
    if (this.sunContainer && this.sunContainer.children && this.sunContainer.children.length >= 5) {
      try {
        // 跳过前5个元素（三个光晕、太阳主体和内部纹理）
        for (let i = 5; i < this.sunContainer.children.length; i++) {
          const ray = this.sunContainer.children[i];
          if (!ray || !ray.baseLength || !ray.speed || !ray.offset) continue;

          const newLength = ray.baseLength * (0.7 + Math.sin(this.waveTime * ray.speed + ray.offset) * 0.3);
          const angle = ((i - 5) / (this.sunContainer.children.length - 5)) * Math.PI * 2;

          // 清除并重新绘制光芒
          ray.clear();
          ray.beginFill(0xffff33, 0.6);

          // 绘制三角形光芒
          ray.moveTo(0, 0);
          ray.lineTo(Math.cos(angle - 0.02) * newLength, Math.sin(angle - 0.02) * newLength);
          ray.lineTo(Math.cos(angle + 0.02) * newLength, Math.sin(angle + 0.02) * newLength);
          ray.lineTo(0, 0);
          ray.endFill();
        }

        // 添加脉动效果
        const sun = this.sunContainer.children[3];
        const innerSun = this.sunContainer.children[4];
        if (sun && sun.scale && innerSun && innerSun.scale) {
          const pulseScale = 1 + Math.sin(this.waveTime * 0.05) * 0.03;
          sun.scale.set(pulseScale); // 太阳主体
          innerSun.scale.set(pulseScale * 1.1); // 内部纹理
        }
      } catch (error) {
        console.error("Error updating sun:", error);
      }
    }
  }

  updateClouds() {
    // 更新所有云
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];

      // 水平移动
      cloud.x += cloud.speed * cloud.direction;

      // 如果云移出屏幕，则从另一侧重新进入
      if (cloud.direction > 0 && cloud.x > this.app.screen.width + 100) {
        cloud.x = -100;
        cloud.y = Math.random() * (this.app.screen.height * 0.3);
      } else if (cloud.direction < 0 && cloud.x < -100) {
        cloud.x = this.app.screen.width + 100;
        cloud.y = Math.random() * (this.app.screen.height * 0.3);
      }
    }
  }

  generateRandomBottle() {
    // 检查海中瓶子数量是否超过上限
    if (this.bottlesInSea.length >= this.maxBottlesInSea) {
      return;
    }

    // 创建一个新瓶子
    const newBottle = this.createRandomBottle();

    // 随机位置 - 往下调整,避免跑到小岛上
    newBottle.x = Math.random() * this.app.screen.width * 0.8 + this.app.screen.width * 0.1; // 避免靠近边缘
    newBottle.baseY = this.app.screen.height * 0.62 + (Math.random() - 0.5) * 15; // 调整到海域中间位置
    newBottle.y = newBottle.baseY;
    newBottle.offset = Math.random() * Math.PI * 2;
    newBottle.scale.set(ELEMENT_SCALES.bottle.inSea * this.scaleFactor); // 海里漂浮的瓶子

    // 添加瓶子到海中
    this.app.stage.addChild(newBottle);
    this.bottlesInSea.push(newBottle);

    return newBottle;
  }

  createRandomBottle() {
    // 创建一个海里飘着的瓶子(使用bottle1)
    const bottleContainer = new PIXI.Container();

    // 使用加载的bottle1图片
    const sprite = new PIXI.Sprite(this.resources.bottle1.texture);

    // 调整图片大小和位置 - 响应式缩放
    sprite.anchor.set(0.5, 0.5); // 居中锚点
    sprite.scale.set(ELEMENT_SCALES.bottle.inSea * this.scaleFactor); // 海里漂浮的瓶子
    sprite.rotation = Math.PI * -0.25; // 与瓶子旋转一致

    bottleContainer.addChild(sprite);

    return bottleContainer;
  }

  createCompleteBottle() {
    // 创建完整的瓶子(用于扔和捞起展示)
    const bottleContainer = new PIXI.Container();

    // 使用完整的bottle图片
    const sprite = new PIXI.Sprite(this.resources.bottle.texture);

    // 调整图片大小和位置 - 750px设计稿
    sprite.anchor.set(0.5);
    sprite.scale.set(0.05 * this.scaleFactor); // 750px设计稿下的尺寸

    bottleContainer.addChild(sprite);

    return bottleContainer;
  }

  createSea() {
    // 创建海洋容器
    this.seaContainer = new PIXI.Container();
    this.seaContainer.width = this.app.screen.width; // 确保海洋容器宽度与屏幕一致
    this.seaContainer.height = this.app.screen.height; // 确保海洋容器高度与屏幕一致
    this.app.stage.addChild(this.seaContainer);

    // 创建气泡容器
    this.bubbleContainer = new PIXI.Container();
    this.app.stage.addChild(this.bubbleContainer);

    // 创建小鱼容器
    this.fishContainer = new PIXI.Container();
    this.app.stage.addChild(this.fishContainer);

    // 创建白云容器
    this.cloudContainer = new PIXI.Container();
    this.app.stage.addChild(this.cloudContainer);

    // 在右上角添加太阳
    // this.createSun();

    // 海域高度提高10%（从60%到70%）
    const seaTopPosition = this.app.screen.height * 0.2; // 海面从30%开始
    const seaHeight = this.app.screen.height * 0.8; // 海域占70%

    // 创建深海背景 - 使用用户指定的蓝色渐变
    const deepSeaGradient = this.createGradientTexture(
      [0x26cbf0, 0x2dc3f4, 0x20cfef, 0x1c8ded], // 用户指定的蓝色组
      this.app.screen.width + 20, // 增加宽度确保覆盖全屏幕加上一点缓冲
      seaHeight * 0.8
    );

    this.deepSea = new PIXI.Sprite(deepSeaGradient);
    this.deepSea.width = this.app.screen.width + 20; // 确保宽度足够
    this.deepSea.y = seaTopPosition + seaHeight * 0.4;
    this.seaContainer.addChild(this.deepSea);

    // 创建海底 - 使用用户指定的颜色
    const seabedTexture = this.createNoiseTexture(0x2dc3f4, 0x26cbf0, 0.12);
    this.seabed = new PIXI.Sprite(seabedTexture);
    this.seabed.width = this.app.screen.width + 20; // 增加宽度确保覆盖全屏幕加上一点缓冲
    this.seabed.height = seaHeight * 1.6;
    this.seabed.y = seaTopPosition + seaHeight * 0.4;
    this.seaContainer.addChild(this.seabed);

    // 创建波浪容器
    this.wavesContainer = new PIXI.Container();
    this.wavesContainer.width = this.app.screen.width + 20; // 增加宽度确保覆盖全屏幕加上一点缓冲
    this.wavesContainer.height = this.app.screen.height;
    this.seaContainer.addChild(this.wavesContainer);

    // 创建多层波浪，使用用户指定的颜色
    this.waves = [];
    const waveColors = [
      { color: 0x26cbf0, alpha: 0.7, amplitude: 22, speed: 0.01, offset: 0 },
      { color: 0x2dc3f4, alpha: 0.5, amplitude: 28, speed: 0.015, offset: 2 },
      { color: 0x20cfef, alpha: 0.3, amplitude: 18, speed: 0.02, offset: 4 },
    ];

    for (let i = 0; i < waveColors.length; i++) {
      const wave = new PIXI.Graphics();
      wave.waveData = waveColors[i];
      this.waves.push(wave);
      this.wavesContainer.addChild(wave);
    }

    // 创建水面光照效果
    this.createWaterHighlights();

    // 添加沙滩背景图（在海浪之后，确保不被遮挡）
    if (this.resources && this.resources.beach && this.resources.beach.texture) {
      this.beachSprite = new PIXI.Sprite(this.resources.beach.texture);
      // 计算缩放比例，让沙滩宽度等于屏幕宽度
      const scaleX = this.app.screen.width / this.beachSprite.texture.width;
      this.beachSprite.scale.set(scaleX); // 使用相同的缩放比例保持宽高比
      // 定位在底部
      this.beachSprite.x = 0;
      this.beachSprite.y = this.app.screen.height - this.beachSprite.height;
      this.app.stage.addChild(this.beachSprite);
    }

    // 初始更新海面
    this.updateSea();
  }

  createGradientTexture(colors, width, height) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // 创建更自然的渐变效果
      const gradient = ctx.createLinearGradient(0, 0, 0, height);

      // 使用更多的颜色停靠点创建更平滑的渐变
      if (colors.length === 2) {
        // 如果只提供了两种颜色，添加中间过渡色
        gradient.addColorStop(0, this.hexToRgba(colors[0]));
        gradient.addColorStop(0.5, this.hexToRgba(this.blendColors(colors[0], colors[1], 0.5)));
        gradient.addColorStop(1, this.hexToRgba(colors[1]));
      } else {
        // 多种颜色的平滑过渡
        for (let i = 0; i < colors.length; i++) {
          gradient.addColorStop(i / (colors.length - 1), this.hexToRgba(colors[i]));
        }
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      return PIXI.Texture.from(canvas);
    } catch (error) {
      console.error("Error creating gradient texture:", error);
      // 创建一个简单的纯色纹理作为后备
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = this.hexToRgba(colors[0]);
      ctx.fillRect(0, 0, width, height);
      return PIXI.Texture.from(canvas);
    }
  }

  // 混合两种颜色
  blendColors(color1, color2, ratio) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;

    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;

    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    return (r << 16) + (g << 8) + b;
  }

  createNoiseTexture(color1, color2, scale = 0.1) {
    try {
      const canvas = document.createElement("canvas");
      const size = 512; // 增大纹理尺寸以获得更多细节
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");

      const imageData = ctx.createImageData(size, size);
      const data = imageData.data;

      // 使用柱面噪点生成更自然的纹理
      const frequency = 0.01; // 噪点频率
      const octaves = 4; // 叠加多层噪点

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = (y * size + x) * 4;

          // 生成多层噪点
          let noise = 0;
          let amplitude = 1;
          let totalAmplitude = 0;

          // 叠加多个频率的噪点
          for (let o = 0; o < octaves; o++) {
            // 使用伪随机函数生成柱面噪点
            const nx = x * frequency * Math.pow(2, o);
            const ny = y * frequency * Math.pow(2, o);
            const noiseValue = this.pseudoRandom(nx, ny) * 2 - 1;

            noise += noiseValue * amplitude;
            totalAmplitude += amplitude;
            amplitude *= 0.5;
          }

          // 归一化噪点值
          noise = (noise / totalAmplitude + 1) / 2;

          // 添加一些细小的细节
          noise = noise * 0.85 + Math.random() * 0.15;

          // 混合两种颜色
          const r1 = (color1 >> 16) & 0xff;
          const g1 = (color1 >> 8) & 0xff;
          const b1 = color1 & 0xff;

          const r2 = (color2 >> 16) & 0xff;
          const g2 = (color2 >> 8) & 0xff;
          const b2 = color2 & 0xff;

          // 根据噪点值混合颜色
          const mixRatio = noise * scale;
          data[index] = r1 + (r2 - r1) * mixRatio;
          data[index + 1] = g1 + (g2 - g1) * mixRatio;
          data[index + 2] = b1 + (b2 - b1) * mixRatio;
          data[index + 3] = 255;
        }
      }

      ctx.putImageData(imageData, 0, 0);
      return PIXI.Texture.from(canvas);
    } catch (error) {
      console.error("Error creating noise texture:", error);
      // 创建简单的纯色纹理作为后备
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = this.hexToRgba(color1);
      ctx.fillRect(0, 0, 256, 256);
      return PIXI.Texture.from(canvas);
    }
  }

  // 伪随机函数生成柱面噪点
  pseudoRandom(x, y) {
    // 基于正弦函数的伪随机数生成
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
    return n - Math.floor(n);
  }

  // 将十六进制颜色转换为RGBA格式
  hexToRgba(hex, alpha = 1) {
    try {
      // 提取RGB值
      const r = (hex >> 16) & 0xff;
      const g = (hex >> 8) & 0xff;
      const b = hex & 0xff;

      // 返回RGBA字符串
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    } catch (error) {
      console.error("Error converting hex to rgba:", error);
      return "rgba(0, 0, 0, 1)";
    }
  }

  drawSeaweed(seaweed, time) {
    if (!seaweed || !seaweed.segments) return;

    seaweed.clear();
    seaweed.beginFill(seaweed.color);

    let prevX = 0;
    let prevY = 0;

    for (let i = 0; i <= seaweed.segments; i++) {
      const segmentY = -i * seaweed.segmentHeight;
      const waveOffset = Math.sin(time * seaweed.waveSpeed + seaweed.waveOffset + i * 0.3) * seaweed.waveAmplitude;
      const segmentX = waveOffset * (i / seaweed.segments);

      if (i === 0) {
        seaweed.moveTo(segmentX - seaweed.width / 2, segmentY);
      } else {
        const cpX1 = prevX;
        const cpY1 = prevY - seaweed.segmentHeight * 0.5;
        const cpX2 = segmentX;
        const cpY2 = segmentY + seaweed.segmentHeight * 0.5;

        seaweed.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, segmentX, segmentY);
      }

      prevX = segmentX;
      prevY = segmentY;
    }

    // 绘制右侧
    for (let i = seaweed.segments; i >= 0; i--) {
      const segmentY = -i * seaweed.segmentHeight;
      const waveOffset = Math.sin(time * seaweed.waveSpeed + seaweed.waveOffset + i * 0.3) * seaweed.waveAmplitude;
      const segmentX = waveOffset * (i / seaweed.segments) + seaweed.width;

      if (i === seaweed.segments) {
        seaweed.lineTo(segmentX, segmentY);
      } else {
        const cpX1 = prevX;
        const cpY1 = prevY + seaweed.segmentHeight * 0.5;
        const cpX2 = segmentX;
        const cpY2 = segmentY - seaweed.segmentHeight * 0.5;

        seaweed.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, segmentX, segmentY);
      }

      prevX = segmentX;
      prevY = segmentY;
    }

    seaweed.endFill();
  }

  createWaterHighlights() {
    try {
      // 创建水面反光容器
      this.highlights = new PIXI.Container();
      this.wavesContainer.addChild(this.highlights); // 添加到波浪容器而不是海洋容器

      // 减少反光点数量，提高质量
      for (let i = 0; i < 15; i++) {
        const highlight = new PIXI.Graphics();

        // 降低反光透明度，使其更自然
        highlight.beginFill(0xffffff, 0.2 + Math.random() * 0.3);

        // 更自然的大小变化
        const size = 3 + Math.random() * 12;
        highlight.drawEllipse(0, 0, size, size * 0.4); // 更扁平的椒圈
        highlight.endFill();

        // 分布在水面附近，避免过于分散
        highlight.x = Math.random() * this.app.screen.width;
        highlight.y = this.app.screen.height * 0.6 + Math.random() * 15 - 8;
        highlight.scale.set(0.4 + Math.random() * 0.4);
        highlight.alpha = 0.1 + Math.random() * 0.2;
        highlight.blendMode = PIXI.BLEND_MODES.SCREEN; // 使用SCREEN混合模式更自然

        // 动画参数 - 更缓慢的动画
        highlight.speed = 0.003 + Math.random() * 0.008;
        highlight.amplitude = 3 + Math.random() * 8;
        highlight.offset = Math.random() * Math.PI * 2;
        highlight.baseY = highlight.y;

        this.highlights.addChild(highlight);
      }
    } catch (error) {
      console.error("Error creating water highlights:", error);
    }
  }

  updateSea() {
    try {
      // 更新多层波浪
      for (let i = 0; i < this.waves.length; i++) {
        const wave = this.waves[i];
        const data = wave.waveData;

        wave.clear();
        wave.beginFill(data.color, data.alpha);

        // 根据性能模式调整精度
        const step = this.isLowPerformanceMode ? 20 : 8;

        // 使用贝塞尔曲线绘制波浪
        const points = [];
        const waterSurfaceY = this.app.screen.height * 0.545;

        // 生成波浪点 - 增加绘制范围确保覆盖全屏幕
        for (let x = -20; x <= this.app.screen.width + 20; x += step) {
          // 使用多个正弦波叠加创建自然的波浪
          const waveHeight = Math.sin(x * 0.01 + this.waveTime * data.speed + data.offset) * data.amplitude;
          const detailWave = Math.sin(x * 0.03 + this.waveTime * data.speed * 1.5) * (data.amplitude * 0.3);
          const smallDetail = Math.sin(x * 0.1 + this.waveTime * data.speed * 2) * (data.amplitude * 0.1);

          // 添加小的随机波动增加自然感
          const randomNoise = (Math.random() - 0.5) * (data.amplitude * 0.05);

          const y = waterSurfaceY + waveHeight + detailWave + smallDetail + randomNoise;
          points.push({ x, y });
        }

        // 绘制第一个点
        wave.moveTo(points[0].x, points[0].y);

        // 使用平滑的曲线连接所有点
        for (let j = 1; j < points.length - 2; j++) {
          const xc = (points[j].x + points[j + 1].x) / 2;
          const yc = (points[j].y + points[j + 1].y) / 2;
          wave.quadraticCurveTo(points[j].x, points[j].y, xc, yc);
        }

        // 处理最后两个点
        if (points.length > 2) {
          const last = points.length - 1;
          wave.quadraticCurveTo(points[last - 1].x, points[last - 1].y, points[last].x, points[last].y);
        }

        // 完成波浪形状 - 增大范围确保覆盖全屏幕
        wave.lineTo(this.app.screen.width + 20, this.app.screen.height);
        wave.lineTo(-20, this.app.screen.height);
        wave.endFill();
      }
    } catch (error) {
      console.error("Error updating sea:", error);
    }

    // 更新水面反光
    if (this.highlights) {
      for (let i = 0; i < this.highlights.children.length; i++) {
        const highlight = this.highlights.children[i];
        highlight.y = highlight.baseY + Math.sin(this.waveTime * highlight.speed + highlight.offset) * highlight.amplitude;
        highlight.alpha = 0.1 + Math.abs(Math.sin(this.waveTime * 0.2 + i)) * 0.3;
      }
    }
  }

  gameLoop(delta) {
    // 性能优化，控制帧率
    const currentTime = Date.now();
    if (this.isLowPerformanceMode && currentTime - this.lastFrameTime < this.frameInterval) {
      return; // 跳过这一帧
    }

    // 计算帧间时间，限制最大帧间时间以避免大幅跳动
    const deltaTime = Math.min(currentTime - this.lastFrameTime, 100); // 限制最大帧间时间为100ms
    this.lastFrameTime = currentTime;

    // 使用requestAnimationFrame的delta值来平滑动画
    const smoothDelta = delta / PIXI.settings.TARGET_FPMS / 60;

    // 更新波浪动画
    this.waveTime += this.isLowPerformanceMode ? 0.005 : 0.01; // 低性能模式下减慢动画
    this.updateSea();

    // 更新气泡
    this.updateBubbles(deltaTime);

    // 更新小鱼
    this.updateFishes(deltaTime);

    // 更新白云
    this.updateClouds();

    // 更新太阳
    this.updateSun();

    // 自动生成瓶子
    this.bottleGenerationTimer += deltaTime;
    if (this.bottleGenerationTimer >= this.bottleGenerationInterval) {
      this.bottleGenerationTimer = 0;
      this.generateRandomBottle();
    }

    // 更新海中的瓶子
    for (let i = this.bottlesInSea.length - 1; i >= 0; i--) {
      // 先检查瓶子是否存在
      if (!this.bottlesInSea[i] || !this.bottlesInSea[i].parent) {
        // 如果瓶子不存在或已经被移除，则从数组中删除
        this.bottlesInSea.splice(i, 1);
        continue;
      }

      const bottle = this.bottlesInSea[i];

      // 增强的浮动效果 - 结合多个正弦波形成更自然的运动
      const primaryWave = Math.sin(this.waveTime * 0.7 + bottle.offset) * 18; // 增大振幅到18
      const secondaryWave = Math.sin(this.waveTime * 1.2 + bottle.offset * 2) * 8; // 增大第二个波形到8
      bottle.y = bottle.baseY + primaryWave + secondaryWave;

      // 斜着放在水面上，加上更明显的摇摆
      bottle.rotation = Math.PI * 0.25 + Math.sin(this.waveTime * 0.3 + bottle.offset) * 0.15; // 增大旋转幅度

      // 更新瓶子光晕位置
      if (bottle.glow) {
        bottle.glow.x = bottle.x;
        bottle.glow.y = bottle.y;
        bottle.glow.rotation = bottle.rotation;
        bottle.glow.alpha = 0.2 + Math.sin(this.waveTime * 0.5) * 0.1; // 光晕强度变化
      }

      // 更新瓶子内水波纹理
      if (bottle.waterPattern && bottle.waterPattern.parent) {
        try {
          bottle.waterPattern.y = Math.sin(this.waveTime * 0.5 + bottle.offset) * 2;
        } catch (error) {
          console.error("Error updating bottle water pattern:", error);
        }
      }

      // 更新瓶子光晕
      if (bottle.glow && bottle.glow.parent) {
        try {
          bottle.glow.x = bottle.x;
          bottle.glow.y = bottle.y;
          bottle.glow.alpha = 0.2 + Math.sin(this.waveTime * 0.2) * 0.1;
        } catch (error) {
          console.error("Error updating bottle glow:", error);
        }
      }

      // 海面漂流效果
      bottle.x += Math.sin(this.waveTime * 0.2 + bottle.offset) * 0.3;

      // 保持瓶子在屏幕内
      if (bottle.x < 0) {
        bottle.x = this.app.screen.width;
      } else if (bottle.x > this.app.screen.width) {
        bottle.x = 0;
      }
    }

    // 更新主瓶子的水波纹理动画
    if (this.bottle && this.bottle.visible && this.bottle.waterPattern) {
      try {
        this.bottle.waterPattern.y = Math.sin(this.waveTime * 0.5) * 2;
      } catch (error) {
        console.error("Error updating main bottle water pattern:", error);
      }
    }

    // 更新主瓶子光晕
    if (this.bottle && this.bottle.parent && this.bottleGlow && this.bottleGlow.parent) {
      try {
        this.bottleGlow.x = this.bottle.x;
        this.bottleGlow.y = this.bottle.y;
        this.bottleGlow.alpha = 0.3 + Math.sin(this.waveTime * 0.4) * 0.1;
        this.bottleGlow.scale.set(1 + Math.sin(this.waveTime * 0.2) * 0.05);
      } catch (error) {
        console.error("Error updating main bottle glow:", error);
      }
    }
  }

  throwBottle(callback) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // 播放按钮点击音效
    soundManager.play("click");

    // 创建完整的瓶子用于扔 - 750px设计稿
    const throwingBottle = this.createCompleteBottle();
    throwingBottle.scale.set(ELEMENT_SCALES.bottle.throwing * this.scaleFactor); // 扔出时的瓶子

    // 设置瓶子的起始位置（送祝福按钮位置：底部中间偏左）
    const startX = this.app.screen.width * 0.35; // 送祝福按钮的X位置
    const startY = this.app.screen.height * 0.88; // 送祝福按钮的Y位置（底部）
    throwingBottle.x = startX;
    throwingBottle.y = startY;
    throwingBottle.rotation = 0; // 初始旋转角度

    // 创建瓶子光晕 - 750px设计稿
    const bottleGlow = new PIXI.Graphics();
    bottleGlow.beginFill(0x87ceeb, 0.3);
    bottleGlow.drawCircle(0, 0, 20 * this.scaleFactor);
    bottleGlow.endFill();
    bottleGlow.filters = [new PIXI.BlurFilter(8 * this.scaleFactor)];
    bottleGlow.x = throwingBottle.x;
    bottleGlow.y = throwingBottle.y;

    this.app.stage.addChild(bottleGlow);
    this.app.stage.addChild(throwingBottle);

    // 设置着陆点（海面上）
    const landX = this.app.screen.width * 0.65; // 落地X位置
    const landY = this.app.screen.height * 0.58; // 海面高度

    // 抛物线参数
    const peakX = startX + (landX - startX) * 0.5; // 抛物线顶点X（中间位置）
    const peakY = this.app.screen.height * 0.35; // 抛物线顶点Y（屏幕中上部）
    const duration = 1.5; // 总持续时间（秒）

    // 创建一个简单的动画序列
    const tl = gsap.timeline({
      onComplete: () => {
        // 播放水花音效
        soundManager.play("throw");

        // 创建水花效果
        this.createSplash(landX, landY);

        // 创建一个新的瓶子留在海里
        const newBottle = this.createRandomBottle();
        newBottle.scale.set(ELEMENT_SCALES.bottle.landed * this.scaleFactor); // 落地后的瓶子
        newBottle.x = landX;
        newBottle.y = landY;
        newBottle.baseY = this.app.screen.height * 0.62;
        newBottle.offset = Math.random() * Math.PI * 2;
        newBottle.rotation = Math.PI * 0.25; // 斜着放在水面上

        // 创建瓶子光晕 - 使用扇形而非圆形
        const bottleGlow = new PIXI.Graphics();
        bottleGlow.beginFill(0x87ceeb, 0.2);
        bottleGlow.drawEllipse(0, 0, 25, 15); // 改为扇形，更符合瓶子形状
        bottleGlow.endFill();
        bottleGlow.filters = [new PIXI.BlurFilter(8)];
        bottleGlow.x = landX;
        bottleGlow.y = landY;
        bottleGlow.alpha = 0.3;
        bottleGlow.rotation = Math.PI * 0.25; // 与瓶子旋转一致

        // 将光晕和瓶子添加到游戏中
        this.app.stage.addChild(bottleGlow);
        this.app.stage.addChild(newBottle);
        newBottle.glow = bottleGlow;

        this.bottlesInSea.push(newBottle);
        while (this.bottlesInSea.length > this.maxBottlesInSea) {
          const oldestBottle = this.bottlesInSea.shift();
          if (oldestBottle && oldestBottle.glow) {
            this.app.stage.removeChild(oldestBottle.glow);
          }
          if (oldestBottle) {
            this.app.stage.removeChild(oldestBottle);
          }
        }

        // 移除飞行中的瓶子和光晕
        this.app.stage.removeChild(throwingBottle);
        this.app.stage.removeChild(bottleGlow);

        // 添加水波纹效果
        for (let i = 0; i < 3; i++) {
          const ripple = new PIXI.Graphics();
          ripple.lineStyle(1, 0x87ceeb, 0.5);
          ripple.drawCircle(0, 0, 5 + i * 10);
          ripple.x = landX + (Math.random() - 0.5) * 15;
          ripple.y = landY + (Math.random() - 0.5) * 5;
          this.app.stage.addChild(ripple);

          // 水波纹动画
          gsap.to(ripple, {
            alpha: 0,
            scale: 2,
            duration: 1.5,
            ease: "power1.out",
            onComplete: () => {
              this.app.stage.removeChild(ripple);
            },
          });
        }

        // 结束动画
        this.isAnimating = false;
        if (callback) callback();
      },
    });

    // 使用自定义抛物线运动（二次贝塞尔曲线）
    tl.to(throwingBottle, {
      duration: duration,
      ease: "none", // 匀速运动
      onUpdate: function () {
        // 计算当前进度 (0-1)
        const t = this.progress();

        // 二次贝塞尔曲线公式：B(t) = (1-t)²P0 + 2(1-t)tP1 + t²P2
        const oneMinusT = 1 - t;
        const x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * peakX + t * t * landX;
        const y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * peakY + t * t * landY;

        // 更新瓶子位置
        throwingBottle.x = x;
        throwingBottle.y = y;
        throwingBottle.rotation = Math.PI * 1.5 * t; // 旋转1.5圈

        // 更新光晕位置
        bottleGlow.x = x;
        bottleGlow.y = y;
        bottleGlow.rotation = throwingBottle.rotation;
        // 光晕在落地前逐渐消失
        bottleGlow.alpha = 0.3 * (1 - t * 0.5);
      },
    });
  }

  catchBottle(callback) {
    if (this.isAnimating) {
      if (callback) callback("正在捕捉瓶子，请稍等...");
      return;
    }

    if (this.bottlesInSea.length === 0) {
      // 如果没有瓶子，则立即生成一个
      const newBottle = this.generateRandomBottle();
      if (!newBottle) {
        if (callback) callback("海里没有漂流瓶，正在生成新瓶子，请稍后再试...");
        return;
      }
    }

    // 播放按钮点击音效
    soundManager.play("click");

    this.isAnimating = true;

    // 创建捕网容器
    const netContainer = new PIXI.Container();
    this.app.stage.addChild(netContainer);

    // 使用图片创建捕网
    let netSprite;

    // 使用加载的捕网图片
    netSprite = new PIXI.Sprite(this.resources.net.texture);

    // 调整图片大小和位置 - 750px设计稿
    netSprite.anchor.set(0.5, 0);
    netSprite.scale.set(ELEMENT_SCALES.net * this.scaleFactor); // 渔网
    netContainer.addChild(netSprite);

    netSprite.rotation = -1.4;

    // 添加光晕效果
    const netGlow = new PIXI.Graphics();
    netGlow.beginFill(0xffffff, 0.3);
    netGlow.drawCircle(0, 0, 40);
    netGlow.endFill();
    netGlow.filters = [new PIXI.BlurFilter(10)];
    netGlow.alpha = 0.4;

    // 添加光晕到容器
    netContainer.addChild(netGlow);

    // 设置初始位置（捞一捞按钮位置：底部中间偏右）
    netContainer.x = this.app.screen.width * 0.65; // 捞一捞按钮的X位置
    netContainer.y = this.app.screen.height * 0.88; // 捞一捞按钮的Y位置（底部）
    netContainer.pivot.set(0, 0); // 设置旋转中心
    netContainer.rotation = 0; // 初始角度

    // 随机选择一个瓶子
    const randomIndex = Math.floor(Math.random() * this.bottlesInSea.length);
    const targetBottle = this.bottlesInSea[randomIndex];

    // 捞到瓶子时才判断是祝福还是奖品（后续对接后端接口）
    let bottleContent;
    let isPrize;
    if (Math.random() < PRIZE_PROBABILITY) {
      // 奖品
      const randomPrize = BOTTLE_PRIZES[Math.floor(Math.random() * BOTTLE_PRIZES.length)];
      bottleContent = randomPrize;
      isPrize = true;
    } else {
      // 祝福
      bottleContent = { type: "message", text: BOTTLE_MESSAGES[Math.floor(Math.random() * BOTTLE_MESSAGES.length)] };
      isPrize = false;
    }

    // 准备动画
    gsap.to(netContainer, {
      rotation: 0.2,
      duration: 0.5,
      ease: "power1.inOut",
      onComplete: () => {
        // 创建捞瓶子的动画
        gsap.to(netContainer, {
          x: targetBottle.x,
          y: targetBottle.y - 30, // 网在瓶子上方
          rotation: -0.1,
          duration: 1.2,
          ease: "power2.inOut",
          onComplete: () => {
            // 下沉动画
            gsap.to(netContainer, {
              y: targetBottle.y + 10,
              rotation: 0,
              duration: 0.5,
              ease: "power1.in",
              onComplete: () => {
                // 播放水花音效
                soundManager.play("catch");

                // 创建水花效果
                this.createSplash(targetBottle.x, targetBottle.y);

                // 添加水波纹效果
                for (let i = 0; i < 5; i++) {
                  const ripple = new PIXI.Graphics();
                  ripple.lineStyle(1, 0x87ceeb, 0.5);
                  ripple.drawCircle(0, 0, 5 + i * 5);
                  ripple.x = targetBottle.x + (Math.random() - 0.5) * 30;
                  ripple.y = targetBottle.y + (Math.random() - 0.5) * 10;
                  this.app.stage.addChild(ripple);

                  // 水波纹动画
                  gsap.to(ripple, {
                    alpha: 0,
                    scale: 2,
                    duration: 1,
                    ease: "power1.out",
                    onComplete: () => {
                      this.app.stage.removeChild(ripple);
                    },
                  });
                }

                // 将瓶子附加到网上
                if (targetBottle.glow) {
                  this.app.stage.removeChild(targetBottle.glow);
                }
                this.app.stage.removeChild(targetBottle);
                this.bottlesInSea.splice(randomIndex, 1);

                // 创建捕获到的瓶子
                let caughtBottle;
                // 使用加载的瓶子图片
                caughtBottle = new PIXI.Sprite(this.resources.bottle.texture);

                // 调整图片大小和位置 - 750px设计稿
                caughtBottle.anchor.set(0.5);
                caughtBottle.scale.set(ELEMENT_SCALES.bottle.caught * this.scaleFactor); // 捕获的瓶子
                caughtBottle.x = 25;
                caughtBottle.y = 10;
                caughtBottle.rotation = -0.5;
                netContainer.addChild(caughtBottle);

                // 网收回动画
                gsap.to(netContainer, {
                  y: netContainer.y - 20,
                  rotation: -0.2,
                  duration: 0.5,
                  ease: "back.out(1.5)",
                  onComplete: () => {
                    // 返回动画（返回到捞一捞按钮位置）
                    gsap.to(netContainer, {
                      x: this.app.screen.width * 0.65,
                      y: this.app.screen.height * 0.88,
                      rotation: 0,
                      duration: 1.2,
                      ease: "power2.inOut",
                      onComplete: () => {
                        // 最终动画
                        gsap.to(netContainer, {
                          y: netContainer.y - 20,
                          rotation: -0.3,
                          duration: 0.5,
                          ease: "back.out(1.2)",
                          onComplete: () => {
                            // 创建瓶子弹出效果
                            gsap.to(caughtBottle, {
                              x: 50,
                              y: -50,
                              rotation: Math.PI,
                              scale: 0,
                              duration: 0.5,
                              ease: "back.in(1.5)",
                              onComplete: () => {
                                // 移除网和瓶子
                                this.app.stage.removeChild(netContainer);
                                this.isAnimating = false;

                                // 根据内容类型播放音效和返回信息
                                if (isPrize) {
                                  // 播放奖品音效
                                  soundManager.play("prize");
                                  if (callback) callback(bottleContent);
                                } else {
                                  // 播放奖品音效（祝福也播放）
                                  soundManager.play("prize");
                                  if (callback) callback(bottleContent);
                                }
                              },
                            });
                          },
                        });
                      },
                    });
                  },
                });
              },
            });
          },
        });
      },
    });
  }

  createSplash(x, y) {
    // 创建水花容器
    const splashContainer = new PIXI.Container();
    splashContainer.x = x;
    splashContainer.y = y;
    this.app.stage.addChild(splashContainer);

    // 创建水花底层（增大尺寸）
    const splashBase = new PIXI.Graphics();
    splashBase.beginFill(0x87ceeb, 0.6); // 增加透明度
    splashBase.drawCircle(0, 0, 25); // 增大半径
    splashBase.endFill();
    splashContainer.addChild(splashBase);

    // 添加水花粒子（增加数量和大小）
    const particleCount = 30; // 增加粒子数量
    const particles = [];

    for (let i = 0; i < particleCount; i++) {
      const particle = new PIXI.Graphics();
      const size = 3 + Math.random() * 6; // 增大粒子尺寸
      const angle = Math.random() * Math.PI * 2;
      const distance = 8 + Math.random() * 30; // 增大距离
      const speed = 0.8 + Math.random() * 2.0; // 增快速度

      // 绘制粒子
      particle.beginFill(0xffffff, 0.7 + Math.random() * 0.3);
      particle.drawCircle(0, 0, size);
      particle.endFill();

      // 设置初始位置
      particle.x = Math.cos(angle) * distance * 0.2;
      particle.y = Math.sin(angle) * distance * 0.2;

      // 设置粒子属性
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed - 2; // 向上的初始速度
      particle.gravity = 0.1 + Math.random() * 0.1;
      particle.life = 0.7 + Math.random() * 0.5;
      particle.maxLife = particle.life;

      splashContainer.addChild(particle);
      particles.push(particle);
    }

    // 创建水花环（增大尺寸）
    const splashRing = new PIXI.Graphics();
    splashRing.lineStyle(3, 0x87ceeb, 0.8); // 增加线宽和透明度
    splashRing.drawCircle(0, 0, 10); // 增大半径
    splashRing.alpha = 0.9;
    splashContainer.addChild(splashRing);

    // 添加第二个水花环（新增）
    const splashRing2 = new PIXI.Graphics();
    splashRing2.lineStyle(2, 0xadd8e6, 0.6);
    splashRing2.drawCircle(0, 0, 15);
    splashRing2.alpha = 0.8;
    splashContainer.addChild(splashRing2);

    // 添加水花光晕（增大尺寸）
    const splashGlow = new PIXI.Graphics();
    splashGlow.beginFill(0xffffff, 0.6); // 增加透明度
    splashGlow.drawCircle(0, 0, 20); // 增大半径
    splashGlow.endFill();
    splashGlow.filters = [new PIXI.BlurFilter(12)]; // 增大模糊半径
    splashGlow.alpha = 0.8; // 增加透明度
    splashContainer.addChild(splashGlow);

    // 水花动画
    let elapsed = 0;
    const animateSplash = () => {
      elapsed += 0.016; // 大约每帧 16ms

      // 更新粒子
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.life -= 0.016;
        p.alpha = p.life / p.maxLife;
        p.scale.set(p.alpha);

        if (p.life <= 0) {
          splashContainer.removeChild(p);
          particles.splice(i, 1);
        }
      }

      // 更新环（增强动画效果）
      splashRing.clear();
      splashRing.lineStyle(3, 0x87ceeb, 0.8 * (1 - elapsed / 1.5)); // 增加持续时间
      splashRing.drawCircle(0, 0, 10 + elapsed * 60); // 增大扩散半径
      splashRing.alpha = 1 - elapsed / 1.5; // 增加持续时间

      // 更新第二个环
      splashRing2.clear();
      splashRing2.lineStyle(2, 0xadd8e6, 0.6 * (1 - elapsed / 1.3));
      splashRing2.drawCircle(0, 0, 15 + elapsed * 45);
      splashRing2.alpha = 0.8 * (1 - elapsed / 1.3);

      // 更新底层
      splashBase.scale.set(1 + elapsed * 0.5);
      splashBase.alpha = 0.5 * (1 - elapsed / 0.8);

      // 更新光晕
      splashGlow.scale.set(1 + elapsed);
      splashGlow.alpha = 0.7 * (1 - elapsed / 1);

      if (elapsed < 1.5 && particles.length > 0) {
        // 增加持续时间
        requestAnimationFrame(animateSplash);
      } else {
        this.app.stage.removeChild(splashContainer);
      }
    };

    // 开始动画
    animateSplash();

    // 添加水波纹
    for (let i = 0; i < 3; i++) {
      const ripple = new PIXI.Graphics();
      ripple.lineStyle(1, 0x87ceeb, 0.5);
      ripple.drawCircle(0, 0, 10);
      ripple.x = x;
      ripple.y = y;
      this.app.stage.addChild(ripple);

      // 水波纹动画
      gsap.to(ripple, {
        alpha: 0,
        scale: 3 + i,
        duration: 1 + i * 0.3,
        ease: "power1.out",
        delay: i * 0.2,
        onComplete: () => {
          this.app.stage.removeChild(ripple);
        },
      });
    }
  }

  resize() {
    if (this.app) {
      // 调整应用尺寸以适应窗口大小
      this.app.renderer.resize(window.innerWidth, window.innerHeight);

      // 调整海洋容器尺寸
      if (this.seaContainer) {
        this.seaContainer.width = this.app.screen.width;
        this.seaContainer.height = this.app.screen.height;
      }

      // 调整波浪容器尺寸
      if (this.wavesContainer) {
        this.wavesContainer.width = this.app.screen.width + 20;
        this.wavesContainer.height = this.app.screen.height;
      }

      // 调整深海和海底尺寸
      if (this.deepSea) {
        this.deepSea.width = this.app.screen.width + 20;
        this.deepSea.y = this.app.screen.height * 0.6;
      }

      if (this.seabed) {
        this.seabed.width = this.app.screen.width + 20;
        this.seabed.height = this.app.screen.height * 0.4;
        this.seabed.y = this.app.screen.height * 0.6;
      }

      // 更新海面
      this.updateSea();

      // 更新标题图片位置
      if (this.titleSprite) {
        // 调整图片大小和位置
        const scale = Math.min((this.app.screen.width * 0.8) / this.titleSprite.width, 0.5);
        this.titleSprite.scale.set(scale);
        this.titleSprite.x = this.app.screen.width / 2;
      }

      // 更新瓶子位置
      if (this.bottle) {
        this.bottle.x = this.app.screen.width / 2;
        this.bottle.y = this.app.screen.height * 0.3;
      }

      // 更新海中瓶子的位置
      for (let i = 0; i < this.bottlesInSea.length; i++) {
        const bottle = this.bottlesInSea[i];
        bottle.baseY = this.app.screen.height * 0.55;
      }

      // 根据方向调整游戏参数
      if (isLandscape) {
        // 横屏模式下的调整
        this.frameInterval = 1000 / 60; // 横屏可以提高帧率
      } else {
        // 竖屏模式下的调整
        this.frameInterval = 1000 / 30; // 竖屏保持较低帧率以节省电量
      }
    }
  }

  destroy() {
    if (this.app) {
      // 停止背景音乐
      soundManager.stopBGM();

      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }
  }
}

export default PixiGame;
