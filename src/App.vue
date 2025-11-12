<template>
  <router-view />
</template>

<style>
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    position: fixed;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    /* 适配iOS安全距离 */
    padding-top: constant(safe-area-inset-top); /* iOS < 11.2 */
    padding-top: env(safe-area-inset-top);
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: constant(safe-area-inset-left);
    padding-left: env(safe-area-inset-left);
    padding-right: constant(safe-area-inset-right);
    padding-right: env(safe-area-inset-right);
  }

  #app {
    font-family: "Microsoft YaHei", "Avenir", Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: fixed;
    top: 0;
    left: 0;
  }
</style>
