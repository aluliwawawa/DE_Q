# 部署相关文件修改清单

本文档记录了为适配公网域名部署（微信云托管/服务器部署）所做的所有代码修改。

## 📋 修改文件总览

### 后端文件 (backend/)

1. **`app.js`**
   - 修改监听地址：`HOST` 从 `localhost` 改为 `0.0.0.0`，允许外部访问
   - 添加 ngrok 浏览器警告跳过中间件
   - 支持通过环境变量 `PORT` 配置端口（默认 3000）

2. **`config/database.js`**
   - 修复 MySQL2 配置警告（移除已废弃的配置项）
   - 支持通过环境变量配置数据库连接（`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`）

3. **`routes/auth.js`**
   - 清理调试日志，保留必要的错误日志

4. **`Dockerfile`** (新建)
   - 创建 Docker 镜像配置文件，用于微信云托管部署
   - 使用 Node.js 18 Alpine 镜像
   - 配置生产环境依赖安装
   - 暴露 80 端口

5. **`.dockerignore`** (新建)
   - 排除不需要的文件（node_modules、.env、文档等）

6. **`WECHAT_CLOUD_DEPLOY.md`** (新建)
   - 微信云托管详细部署指南
   - 包含环境变量配置步骤和常见问题

7. **`ENV_CONFIG.md`** (新建)
   - 环境变量配置快速参考文档

8. **`DEPLOY_CHECKLIST.md`** (新建)
   - 部署检查清单

### 前端文件 (miniprogram/)

1. **`config.js`**
   - 添加 `devApiBaseUrl` 和 `prodApiBaseUrl` 配置
   - 支持开发环境和生产环境不同的 API 地址
   - 添加 `realDeviceIp` 配置（用于真机调试，已废弃）

2. **`app.js`**
   - 添加 `getApiBaseUrl()` 函数，根据小程序环境自动选择 API 地址
   - 使用 `wx.getAccountInfoSync()` 检测环境版本（develop/trial/release）
   - 在 `onLaunch` 中初始化 `apiBaseUrl`，确保环境检测正确

3. **`utils/api.js`**
   - 添加 `ngrok-skip-browser-warning` 请求头，跳过 ngrok 警告页面
   - 改进错误处理，提供更详细的网络错误信息
   - 移除 `wx.getUserProfile`，改用 `wx.login` 获取 code

4. **`pages/index/index.js`**
   - 改进登录错误提示
   - 强制体验版/正式版使用微信登录（忽略 `devMode` 配置）
   - 添加环境检测逻辑

## 🔧 主要修改内容

### 1. 后端监听地址修改

**文件**: `backend/app.js`

```javascript
// 修改前
const HOST = 'localhost';

// 修改后
const HOST = process.env.HOST || '0.0.0.0'; // 监听所有网络接口，允许外部访问
```

**原因**: 默认 `localhost` 只能本机访问，改为 `0.0.0.0` 允许外部网络访问。

### 2. 前端环境检测和 API 地址选择

**文件**: `miniprogram/app.js`

```javascript
function getApiBaseUrl() {
  const accountInfo = wx.getAccountInfoSync();
  const envVersion = accountInfo.miniProgram.envVersion;
  
  if (envVersion === 'release' || envVersion === 'trial') {
    // 体验版/正式版：使用生产环境地址
    return config.prodApiBaseUrl;
  } else {
    // 开发版：使用开发环境地址（支持真机调试 IP 替换）
    let url = config.devApiBaseUrl;
    if (config.realDeviceIp) {
      url = url.replace('localhost', config.realDeviceIp);
    }
    return url;
  }
}
```

**原因**: 根据小程序运行环境自动选择正确的 API 地址，避免手动切换配置。

### 3. 数据库配置支持环境变量

**文件**: `backend/config/database.js`

```javascript
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'de_Q',
  // ... 其他配置
});
```

**原因**: 支持通过环境变量配置数据库连接，适配云托管和服务器部署。

### 4. ngrok 警告页面跳过

**文件**: 
- `backend/app.js`: 添加响应头中间件
- `miniprogram/utils/api.js`: 添加请求头

```javascript
// 后端
app.use((req, res, next) => {
  res.setHeader('ngrok-skip-browser-warning', 'true');
  next();
});

// 前端
header: {
  'ngrok-skip-browser-warning': 'true'
}
```

**原因**: ngrok 免费版会显示警告页面，添加此头可跳过。

### 5. 微信登录方式更新

**文件**: `miniprogram/utils/api.js`

```javascript
// 修改前：使用 wx.getUserProfile
// 修改后：仅使用 wx.login
wx.login({
  success: (res) => {
    if (res.code) {
      // 使用 code 登录
    }
  }
});
```

**原因**: `wx.getUserProfile` 已废弃，改用 `wx.login` 获取 code。

## 📝 环境变量配置

部署时需要配置以下环境变量：

```
PORT=80
NODE_ENV=production
DB_HOST=你的数据库IP
DB_PORT=3306
DB_USER=数据库用户名
DB_PASSWORD=数据库密码
DB_NAME=de_Q
WECHAT_APPID=你的小程序AppID
WECHAT_APPSECRET=你的小程序AppSecret
JWT_SECRET=你的JWT密钥
```

## 🚀 部署流程

1. **后端部署**
   - 上传 `backend` 目录到服务器或微信云托管
   - 配置环境变量
   - 启动服务（`npm start` 或使用 Docker）

2. **前端配置**
   - 更新 `miniprogram/config.js` 中的 `prodApiBaseUrl`
   - 在小程序管理后台配置合法域名
   - 上传体验版/正式版

3. **验证**
   - 访问健康检查接口：`https://your-domain/health`
   - 测试登录功能
   - 检查数据库连接

## 📚 相关文档

- `backend/WECHAT_CLOUD_DEPLOY.md` - 微信云托管部署指南
- `backend/ENV_CONFIG.md` - 环境变量配置参考
- `backend/DEPLOY_CHECKLIST.md` - 部署检查清单
- `DEPLOY.md` - 服务器部署指南（宝塔面板）

