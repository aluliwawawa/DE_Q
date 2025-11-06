# 德国移居问卷小程序

这是一个用于帮助用户判断是否推荐移居德国的微信小程序项目。

## 项目结构

```
DE/
├── backend/              # 后端服务（Node.js + Express）
│   ├── config/          # 配置文件
│   ├── routes/          # API路由
│   ├── services/        # 业务逻辑服务
│   ├── middleware/      # 中间件
│   ├── app.js          # 应用入口
│   └── package.json    # 依赖配置
├── miniprogram/         # 微信小程序前端
├── database/            # 数据库脚本
│   ├── schema.sql      # 数据库表结构
│   └── demo_data.sql   # Demo数据（20道题目）
├── TECHNICAL_PLAN.md    # 技术方案文档
└── README.md           # 项目说明
```

## 功能特性

- ✅ 微信登录授权（获取openid和昵称）
- ✅ 20道1-5分符合度选择题
- ✅ 自动评分计算（权重×选项值）
- ✅ 基于总分区间的建议文案
- ✅ 极端属性识别和定制反馈（选择1或5的题目）
- ✅ 每日答题限制（每个openid每天只能答一次）
- ✅ 答题进度条显示
- ✅ 结果页引流内容（公众号二维码+微信号）

## 技术栈

### 后端
- Node.js + Express
- MySQL
- JWT认证
- 微信API集成

### 前端（小程序）
- 原生微信小程序
- WXML + WXSS + JavaScript

## 快速开始

### 1. 环境要求

- Node.js 16+
- MySQL 5.7+ 或 8.0+
- 微信开发者工具

### 2. 数据库配置

```bash
# 创建数据库并导入表结构
mysql -u root -p < database/schema.sql

# 导入demo数据（20道题目）
mysql -u root -p < database/demo_data.sql
```

### 3. 后端配置

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑.env文件，配置以下信息：
# - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
# - WECHAT_APPID, WECHAT_APPSECRET
# - JWT_SECRET unten
# - PUBLIC_ACCOUNT_WECHAT_ID
```

### 4. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

后端服务默认运行在 `http://localhost:3000`

### 5. 小程序配置

1. 使用微信开发者工具打开 `miniprogram` 目录
2. 在 `miniprogram/config.js` 中配置后端API地址
3. 在小程序管理后台配置AppID和AppSecret

## API接口

### 认证
- `POST /api/auth/wechat/login` - 微信登录

### 问卷
- `GET /api/questionnaire/current` - 获取当前问卷题目（需登录）

### 答题
- `POST /api/responses/submit` - 提交答题（需登录）
- `GET /api/responses/:id` - 获取答题结果（需登录）

详细API文档请参考 `TECHNICAL_PLAN.md`

## 数据库说明

### 主要表结构

- `users` - 用户表（openid、昵称）
- `questionnaire` - 问卷题目表（20道题目）
- `responses` - 答题记录表
- `score_rules` - 评分规则表（区间规则、极端反馈规则）

详细表结构请查看 `database/schema.sql`

## 开发说明

### 修改题目内容

直接编辑 `database/demo_data.sql` 文件中的题目，或直接在数据库中修改 `questionnaire` 表。

### 修改评分规则

编辑 `score_rules` 表：
- `rule_type = 'score_interval'` - 总分区间规则
- `rule_type = 'extreme_feedback'` - 极端反馈规则

### 修改权重和category

在 `questionnaire` 表中修改对应题目的 `weight` 和 `category` 字段。

## 部署到服务器

1. 将代码上传到服务器
2. 在服务器上安装Node.js和MySQL
3. 配置环境变量（.env文件）
4. 导入数据库
5. 使用PM2启动服务：
   ```bash
   pm2 start backend/app.js --name de-questionnaire
   ```
6. 配置Nginx反向代理（小程序必须HTTPS）
7. 配置SSL证书

## 注意事项

- ⚠️ 小程序必须使用HTTPS协议
- ⚠️ 需要配置微信小程序的合法域名
- ⚠️ 确保数据库字符集为utf8mb4
- ⚠️ JWT_SECRET在生产环境必须修改为强密码

## License

ISC
