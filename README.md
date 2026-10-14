# 抗遗忘单词复习小程序

项目包含 Taro 微信小程序前端和 Next.js 教师/学员后台 API。

## 目录

- `src/`：Taro 小程序前端
- `admin-web/`：Next.js 后台和 API
- `抗遗忘单词复习-完整PRD-v1.0.md`、`抗遗忘单词复习-精简版需求梳理.md`：产品需求

## 本地运行

### 小程序

```bash
npm install
npm run dev:weapp
```

使用微信开发者工具打开项目目录，开发者工具项目配置读取根目录的 `project.config.json`。打包可运行 `npm run build:weapp`。

### 后台

```bash
cd admin-web
npm install
cp .env.example .env.local
npx prisma db push
npm run dev
```

后台默认运行在 `http://localhost:3000`。本地数据库使用 SQLite，文件位于 `admin-web/prisma/dev.db`，不纳入 Git。

## 部署前需要配置

1. 在 `admin-web/.env.local`（生产环境则在部署平台环境变量中）设置独立随机的 `JWT_SECRET` 和 `JWT_SECRET_C`，并按实际 H5 来源设置 `CORS_ORIGIN`。示例见 `admin-web/.env.example`。
2. 将 `src/services/cloud.ts` 中的 `API_BASE` 改为已部署后台的 HTTPS 地址。真机微信小程序还需在微信公众平台配置对应的 request 合法域名。
3. `project.config.json` 当前包含微信小程序 AppID；如需使用其他小程序账号，请换成对应 AppID。
4. 当前后台登录仍使用演示账号 `teacher` / `123456`；上线前需改为真实账号体系和安全的密码管理。
5. 数据库目前配置为 SQLite（见 `admin-web/prisma/schema.prisma`），适合本地开发。正式部署时需确认运行环境有持久化磁盘，或迁移到托管数据库并更新 Prisma schema。

目前 OCR 接口返回模拟词条；仓库和运行配置暂不需要大模型 API Key。`OPENAI_API_KEY` 只有在后续接入真实 OCR/模型服务时才需要。
