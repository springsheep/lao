@echo off
echo 正在清除 Vue CLI 缓存...
rmdir /s /q node_modules\.cache
echo 缓存已清除！
echo 现在可以尝试运行 npm run serve 了。
pause
