# 移动端适配说明

## 使用的适配方案

本项目使用 **postcss-px-to-viewport** 插件进行移动端适配。

### 安装依赖

```bash
npm install
```

或者单独安装适配插件:

```bash
npm install postcss-px-to-viewport autoprefixer --save-dev
```

### 配置说明

#### 1. postcss.config.js
- **viewportWidth**: 1920 (设计稿宽度)
- **viewportHeight**: 1080 (设计稿高度)
- **viewportUnit**: 'vw' (使用vw单位)
- 自动将CSS中的px转换为vw单位

#### 2. 工作原理
- CSS中写的px会自动转换为vw
- 例如: `width: 100px` → `width: 5.208vw` (100/1920*100)
- 不同屏幕尺寸会自动按比例缩放

#### 3. 不需要转换的情况
在类名中添加 `.ignore` 或 `.hairlines` 前缀:
```css
.ignore-element {
  width: 100px; /* 不会被转换 */
}
```

### 优势

1. **自动适配**: 无需手动计算缩放比例
2. **开发便捷**: 直接按设计稿尺寸写px即可
3. **性能优化**: CSS层面处理,无JS计算开销
4. **精确还原**: 完美还原设计稿比例

### 支持的设备

- 📱 手机 (320px ~ 768px)
- 💻 平板 (768px ~ 1024px)
- 🖥️ 桌面 (1024px ~ 1920px)
- 🖥️ 大屏 (≥1920px)

### 注意事项

1. PixiJS游戏场景仍使用JS缩放因子
2. Vue组件UI使用postcss自动转换
3. 修改设计稿尺寸需同步更新 `postcss.config.js`

### 运行项目

```bash
npm run dev
```

访问 http://localhost:3000
