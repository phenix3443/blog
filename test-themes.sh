#!/bin/bash

echo "启动本地测试服务器..."
echo ""
echo "Bootstrap 主题: http://localhost:1313"
echo "FixIt 主题:     http://localhost:1314"
echo "Next 主题:      http://localhost:1315"
echo ""
echo "按 Ctrl+C 停止所有服务器"
echo ""

# 启动三个服务器
hugo server --config "config/_default,config/bootstrap" --port 1313 --bind 0.0.0.0 &
PID1=$!

hugo server --config "config/_default,config/fixit" --port 1314 --bind 0.0.0.0 &
PID2=$!

hugo server --config "config/_default,config/next" --port 1315 --bind 0.0.0.0 &
PID3=$!

# 等待用户中断
trap "kill $PID1 $PID2 $PID3 2>/dev/null; exit" INT TERM

wait
