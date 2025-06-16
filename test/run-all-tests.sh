#!/bin/bash

# 运行所有端到端测试的脚本

echo "开始运行所有端到端测试..."
echo "================================"

# 设置测试环境变量
export NODE_ENV=test

# 运行所有测试文件
echo "运行认证模块测试..."
npm run test:e2e -- auth.e2e-spec.ts

echo "运行文章模块测试..."
npm run test:e2e -- articles.e2e-spec.ts

echo "运行分类模块测试..."
npm run test:e2e -- categories.e2e-spec.ts

echo "运行评论模块测试..."
npm run test:e2e -- comments.e2e-spec.ts

echo "运行动态模块测试..."
npm run test:e2e -- moments.e2e-spec.ts

echo "运行作品模块测试..."
npm run test:e2e -- works.e2e-spec.ts

echo "运行用户模块测试..."
npm run test:e2e -- users.e2e-spec.ts

echo "================================"
echo "所有测试完成！"