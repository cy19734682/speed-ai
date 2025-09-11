# Speed-AI 项目

Speed-AI 是一个集成了 AI 助手功能和 MCP 服务管理的一体化解决方案，包含前端用户界面和后台管理服务。

## 🧡说明
该项目主要代码使用DeepSeek生成。

## 项目概述

Speed-AI 由两个核心组件构成：

1. **Client** - 基于 Next.js 的前端应用
2. **MCP-Server** - 基于 Express.js 的后端服务


## 功能特点

### Client (前端)
- 🧩 **DeepSeek API 集成**：无缝接入 DeepSeek AI 能力
- 🚀 **MCP 服务管理**：创建、监控和管理 MCP 服务
- 🌐 **联网搜索功能**：实时获取网络信息增强AI回答
- 🤖 **AI 助手交互界面**：友好的聊天式用户界面
- ⚙️ **服务状态监控**：实时查看 MCP 服务运行状态

### MCP-Server (后端)
- ⏱️ **活跃连接检测**：定时检查并维护活跃连接
- 🔌 **连接池管理**：高效管理客户端连接
- 📊 **服务健康监控**：实时监控服务健康状况
- 🔐 **认证与授权**：安全的API访问控制
- 📈 **性能指标收集**：收集并报告服务性能数据

## 技术栈

### Client
- **框架**: Next.js (React)
- **状态管理**: Zustand
- **样式库**: Tailwind CSS
- **API 通信**: Fetch
- **测试**: Jest, React Testing Library

### MCP-Server
- **运行时**: Node.js
- **框架**: Express.js
- **任务调度**: node-cron

## 快速开始

### 先决条件
- Node.js v18+
- npm v9+ 或 yarn
- MongoDB (如果使用)

### 安装与运行

**1. 安装依赖**
```bash
pnpm install
```

**2. 配置环境变量**

在 client 目录下创建 `.env` 文件，并添加以下配置：

```
# AI提供商配置
DEEPSEEK_API_KEY=sk-...
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

# 默认使用的AI模型
DEFAULT_MODEL=deepseek-chat
```

在 mcp-server 目录下创建 `.env` 文件，并添加以下配置：

```
# 服务器配置
PORT=8003
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=info
HEARTBEAT_INTERVAL=30000
```

**3. 运行**
```bash
pnpm dev
```
打开浏览器访问 `http://localhost:3000`


## 项目结构

```
speed-ai/
├── packages/
│   ├── client/         # Next.js 客户端应用
│   │   ├── app/            # Next.js 页面和路由
│   │   └── public/         # 静态资源
│   └── mcp-sse-server/     # MCP 服务器
│       ├── src/            # 服务器源代码
├── package.json           # 项目配置
└── README.md               # 项目文档
```

## 技术栈

- **前端**: Next.js, React, TypeScript, Tailwind CSS
- **后端**: Node.js, TypeScript
- **通信**: Server-Sent Events (SSE)
- **API**: DeepSeek API, Model Context Protocol (MCP)

## 项目参考

https://github.com/Ulanxx/mcp-deepseek-demo