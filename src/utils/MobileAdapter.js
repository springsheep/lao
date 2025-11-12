/**
 * 移动端适配工具
 */
class MobileAdapter {
  /**
   * 初始化移动端适配
   */
  static init() {
    // 设置视口
    MobileAdapter.setViewport();
    
    // 禁用默认的触摸行为
    MobileAdapter.disableDefaultTouchBehavior();
    
    // 监听屏幕方向变化
    MobileAdapter.handleOrientationChange();
    
    // 处理iOS全屏问题
    MobileAdapter.handleIOSFullscreen();
  }
  
  /**
   * 设置适合移动端的视口
   */
  static setViewport() {
    // 阻止双指缩放
    document.addEventListener('gesturestart', function(e) {
      e.preventDefault();
    });
    
    // 处理iOS设备上的橡皮筋效果
    document.body.addEventListener('touchmove', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    }, { passive: false });
  }
  
  /**
   * 禁用默认的触摸行为
   */
  static disableDefaultTouchBehavior() {
    // 阻止长按菜单
    document.body.addEventListener('contextmenu', function(e) {
      e.preventDefault();
    });
    
    // 阻止选择文本
    document.body.addEventListener('selectstart', function(e) {
      e.preventDefault();
    });
  }
  
  /**
   * 处理屏幕方向变化
   */
  static handleOrientationChange() {
    window.addEventListener('orientationchange', function() {
      // 延迟执行以确保方向变化完成
      setTimeout(function() {
        // 强制重新计算视口
        const viewportMetaTag = document.querySelector('meta[name=viewport]');
        if (viewportMetaTag) {
          viewportMetaTag.setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        }
        
        // 触发resize事件
        window.dispatchEvent(new Event('resize'));
      }, 300);
    });
  }
  
  /**
   * 处理iOS全屏问题
   */
  static handleIOSFullscreen() {
    // iOS设备上添加特殊处理
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
      // 处理iOS上的高度问题
      window.addEventListener('resize', function() {
        document.documentElement.style.height = `${window.innerHeight}px`;
        document.body.style.height = `${window.innerHeight}px`;
      });
      
      // 初始设置
      document.documentElement.style.height = `${window.innerHeight}px`;
      document.body.style.height = `${window.innerHeight}px`;
    }
  }
  
  /**
   * 检测设备类型
   * @returns {Object} 设备类型信息
   */
  static detectDevice() {
    const ua = navigator.userAgent;
    const isAndroid = /Android/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua);
    const isMobile = isAndroid || isIOS || /Mobile/i.test(ua);
    const isTablet = /Tablet|iPad/i.test(ua);
    
    return {
      isAndroid,
      isIOS,
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet
    };
  }
  
  /**
   * 优化触摸事件
   * @param {HTMLElement} element 需要优化触摸事件的元素
   * @param {Function} callback 回调函数
   */
  static optimizeTouchEvent(element, callback) {
    let touchStartTime = 0;
    let touchStartX = 0;
    let touchStartY = 0;
    const touchThreshold = 10; // 触摸阈值，小于此值视为点击
    
    element.addEventListener('touchstart', function(e) {
      touchStartTime = Date.now();
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    
    element.addEventListener('touchend', function(e) {
      const touchEndTime = Date.now();
      const touchDuration = touchEndTime - touchStartTime;
      
      // 如果触摸时间小于300ms，并且移动距离小于阈值，视为点击
      if (touchDuration < 300) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const distanceX = Math.abs(touchEndX - touchStartX);
        const distanceY = Math.abs(touchEndY - touchStartY);
        
        if (distanceX < touchThreshold && distanceY < touchThreshold) {
          callback(e);
        }
      }
    }, { passive: true });
  }
}

export default MobileAdapter;
