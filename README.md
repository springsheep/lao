# 漂流瓶小游戏

一个基于Vue 3和Pixi.js的移动端H5漂流瓶小游戏，提供扔漂流瓶和捞漂流瓶的功能，并配有精美的动效和音效。

## 功能特点

- 🌊 精美的海洋场景和波浪动效
- 🍾 扔漂流瓶功能，可以将瓶子扔入大海
- 🎣 捞漂流瓶功能，可以从海中捞起漂流瓶
- 🎵 背景音乐和交互音效
- 📱 针对移动端优化，支持不同设备和屏幕方向
- 🚀 性能优化，在低端设备上也能流畅运行

## 技术栈

- Vue 3 - 前端框架
- Vue Router - 路由管理
- Pixi.js - 2D渲染引擎
- GSAP - 动画库
- 原生JavaScript - 游戏逻辑

## 项目结构

```
├── public/                 # 静态资源
│   ├── index.html          # HTML模板
│   └── favicon.ico         # 网站图标
├── src/                    # 源代码
│   ├── assets/             # 资源文件
│   │   └── css/            # CSS样式
│   │       └── global.css  # 全局样式
│   ├── components/         # 组件
│   │   └── PixiGame.js     # Pixi.js游戏组件
│   ├── utils/              # 工具类
│   │   ├── SoundManager.js # 音效管理器
│   │   └── MobileAdapter.js# 移动端适配工具
│   ├── views/              # 视图组件
│   │   ├── HomeView.vue    # 首页视图
│   │   └── GameView.vue    # 游戏视图
│   ├── router/             # 路由配置
│   │   └── index.js        # 路由定义
│   ├── App.vue             # 根组件
│   └── main.js             # 入口文件
├── babel.config.js         # Babel配置
├── vue.config.js           # Vue配置
├── package.json            # 项目依赖
└── README.md               # 项目说明
```

## 安装与运行

### 前提条件

- Node.js (v12.0.0或更高版本)
- npm (v6.0.0或更高版本)

### 安装步骤

1. 克隆或下载项目到本地

2. 进入项目目录
```bash
cd drift-bottle-game
```

3. 安装依赖
```bash
npm install
```

4. 启动开发服务器
```bash
npm run serve
```

5. 构建生产版本
```bash
npm run build
```

## 游戏玩法

1. 点击"开始游戏"进入游戏界面
2. 点击"扔一扔"按钮将漂流瓶扔入海中
3. 点击"捞瓶子"按钮从海中捞起漂流瓶
4. 捞起的漂流瓶中会有随机的消息
5. 可以通过静音按钮控制游戏音效
6. 点击"返回"按钮回到首页

## 移动端适配

游戏针对移动端进行了全面优化：

- 禁用了默认的触摸行为，如双指缩放、长按菜单等
- 针对不同设备性能进行了优化，低性能设备会自动降低画面质量
- 支持横屏和竖屏模式，并根据屏幕方向自动调整游戏参数
- 针对iOS设备进行了特殊处理，解决了全屏问题

## 自定义开发

### 添加新的漂流瓶消息

在`src/components/PixiGame.js`文件中，可以修改`BOTTLE_MESSAGES`数组来添加或修改漂流瓶消息：

```javascript
const BOTTLE_MESSAGES = [
  '你好，希望捡到这个瓶子的人能够开心每一天！',
  // 添加更多消息...
];
```

### 修改游戏样式

可以在`src/assets/css/global.css`文件中修改全局样式，或在各个Vue组件的`<style>`标签中修改组件样式。

### 添加新功能

如果需要添加新功能，可以在`src/components/PixiGame.js`文件中进行扩展，例如添加更多的交互元素、游戏规则等。

## 许可证

MIT
