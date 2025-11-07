# 微信小程序配置说明

## ⚠️ 重要：导入正确的目录

微信开发者工具必须导入 `miniprogram` 目录，**不是**项目根目录！

### 正确的导入步骤：

1. 打开微信开发者工具
2. 选择 **"导入项目"**（不是新建项目）
3. **项目目录** 选择：`C:\DDevelop\Arbeit\DE\miniprogram`
   - ❌ 不要选择：`C:\DDevelop\Arbeit\DE`（根目录）
   - ✅ 应该选择：`C:\DDevelop\Arbeit\DE\miniprogram`（小程序目录）
4. 填写 AppID（测试可以使用测试号）
5. 点击确定

### 目录结构说明：

```
DE/                          ← 项目根目录（不要导入这里）
├── backend/                 ← 后端服务
├── database/               ← 数据库脚本
└── miniprogram/             ← ✅ 小程序目录（导入这里）
    ├── app.js              ← 小程序入口
    ├── app.json            ← ✅ 小程序配置文件
    ├── pages/              ← 页面文件
    └── utils/              ← 工具函数
```

### 验证是否正确：

导入后，在微信开发者工具中应该能看到：
- ✅ `app.json` 文件存在
- ✅ `app.js` 文件存在
- ✅ `pages` 目录存在
- ✅ 控制台没有报错 "找不到 app.json"

### 如果还是找不到 app.json：

1. 确认导入的是 `miniprogram` 目录
2. 检查 `miniprogram/app.json` 文件是否存在
3. 尝试重新导入项目
4. 检查文件路径是否有中文或特殊字符

### 配置后端API地址：

编辑 `miniprogram/config.js`：

```javascript
const config = {
  // 本地开发时（需要勾选"不校验合法域名"）
  apiBaseUrl: 'http://localhost:3000/api',
  
  // 或使用云服务器（如果后端已部署）
  // apiBaseUrl: 'https://your-domain.com/api',
  
  publicAccount: {
    qrCodeImage: '/images/qrcode.jpg',
    wechatId: 'your_wechat_id'
  }
};
```

### 开发设置：

1. 在微信开发者工具中：
   - 点击右上角 **"详情"**
   - 勾选 **"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
   - 这样可以在开发阶段访问本地后端API

2. 确认后端服务已启动：
   ```bash
   cd backend
   npm run dev
   ```

### 常见问题：

**Q: 提示找不到 app.json**
- A: 确保导入的是 `miniprogram` 目录，不是根目录

**Q: 无法连接后端API**
- A: 检查后端是否运行在 `http://localhost:3000`
- A: 检查微信开发者工具中是否勾选了"不校验合法域名"

**Q: 导入后显示空白页面**
- A: 检查 `app.json` 中的 `pages` 配置是否正确
- A: 检查第一个页面 `pages/index/index` 文件是否存在


