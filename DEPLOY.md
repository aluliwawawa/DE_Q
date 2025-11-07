# 后端部署到腾讯云服务器指南

## 前置条件

- ✅ 腾讯云服务器（已安装宝塔面板）
- ✅ 已配置域名（用于HTTPS）
- ✅ 服务器已安装 Node.js 和 MySQL

## 一、服务器准备

### 1.1 登录宝塔面板

1. 访问宝塔面板地址（通常是 `http://你的服务器IP:8888`）
2. 登录宝塔面板

### 1.2 安装必要软件

在宝塔面板中安装：
- **Node.js 版本管理器**（推荐 Node.js 16+）
- **MySQL**（5.7+ 或 8.0+）
- **PM2 管理器**（用于进程管理）

### 1.3 创建网站

1. 在宝塔面板中点击 **"网站"** → **"添加站点"**
2. 填写域名（例如：`api.yourdomain.com`）
3. 选择 **"纯静态"** 或 **"PHP项目"**（我们只需要反向代理）
4. 创建完成后，记录网站根目录路径（例如：`/www/wwwroot/api.yourdomain.com`）

## 二、上传代码到服务器

### 方法1：使用 Git（推荐）

```bash
# SSH 登录服务器
ssh root@你的服务器IP

# 进入网站目录
cd /www/wwwroot/api.yourdomain.com

# 克隆项目（如果有Git仓库）
git clone https://github.com/aluliwawawa/DE_Q.git .

# 或者直接进入 backend 目录
cd /www/wwwroot/api.yourdomain.com/backend
```

### 方法2：使用宝塔文件管理器

1. 在宝塔面板中打开 **"文件"**
2. 进入网站目录
3. 上传项目文件（压缩包上传后解压）

### 方法3：使用 FTP/SFTP

使用 FileZilla 等工具上传项目文件到服务器

## 三、配置后端服务

### 3.1 安装依赖

```bash
cd /www/wwwroot/api.yourdomain.com/backend
npm install --production
```

### 3.2 配置环境变量

在宝塔文件管理器中，进入 `backend` 目录，创建 `.env` 文件：

```env
# 服务器配置
PORT=3000
NODE_ENV=production

# MySQL数据库配置（使用服务器上的MySQL）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=de_Q

# 微信小程序配置
WECHAT_APPID=你的小程序AppID
WECHAT_APPSECRET=你的小程序AppSecret

# JWT密钥（生产环境请使用强随机字符串）
JWT_SECRET=你的强随机JWT密钥（至少32位）

# 引流内容配置
PUBLIC_ACCOUNT_WECHAT_ID=你的微信号
```

### 3.3 导入数据库

在宝塔面板中：
1. 点击 **"数据库"** → **"添加数据库"**
2. 数据库名：`de_Q`
3. 用户名和密码：设置并记录
4. 点击 **"phpMyAdmin"** 打开数据库管理
5. 选择 `de_Q` 数据库
6. 导入 `database/schema.sql` 和 `database/demo_data.sql`

或者使用命令行：

```bash
mysql -u root -p de_Q < /www/wwwroot/api.yourdomain.com/database/schema.sql
mysql -u root -p de_Q < /www/wwwroot/api.yourdomain.com/database/demo_data.sql
```

## 四、使用 PM2 启动服务

### 4.1 安装 PM2（如果未安装）

```bash
npm install -g pm2
```

### 4.2 启动服务

```bash
cd /www/wwwroot/api.yourdomain.com/backend
pm2 start app.js --name de-questionnaire
```

### 4.3 设置开机自启

```bash
pm2 save
pm2 startup
```

### 4.4 常用 PM2 命令

```bash
# 查看服务状态
pm2 list

# 查看日志
pm2 logs de-questionnaire

# 重启服务
pm2 restart de-questionnaire

# 停止服务
pm2 stop de-questionnaire

# 删除服务
pm2 delete de-questionnaire
```

## 五、配置 Nginx 反向代理

### 5.1 在宝塔面板中配置

1. 点击 **"网站"** → 找到你的域名 → **"设置"**
2. 点击 **"反向代理"** → **"添加反向代理"**
3. 配置如下：
   - **代理名称**：`api`
   - **目标URL**：`http://127.0.0.1:3000`
   - **发送域名**：`$host`
   - **缓存**：关闭
4. 点击 **"保存"**

### 5.2 配置 SSL 证书（必须，小程序要求HTTPS）

1. 在网站设置中，点击 **"SSL"**
2. 选择 **"Let's Encrypt"** 免费证书
3. 填写域名（例如：`api.yourdomain.com`）
4. 点击 **"申请"**
5. 申请成功后，开启 **"强制HTTPS"**

### 5.3 配置 Nginx 规则（可选，用于API路径）

如果需要将 `/api` 路径代理到后端，在 **"配置修改"** 中添加：

```nginx
location /api {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 六、配置小程序

### 6.1 更新 config.js

在 `miniprogram/config.js` 中配置生产环境地址：

```javascript
prodApiBaseUrl: 'https://api.yourdomain.com/api', // 替换为你的实际域名
```

### 6.2 配置小程序合法域名

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入 **"开发"** → **"开发管理"** → **"开发设置"**
3. 在 **"服务器域名"** 中，添加：
   - **request合法域名**：`https://api.yourdomain.com`
   - **uploadFile合法域名**：`https://api.yourdomain.com`
   - **downloadFile合法域名**：`https://api.yourdomain.com`

## 七、测试部署

### 7.1 测试后端服务

```bash
# 在服务器上测试
curl http://localhost:3000/health

# 应该返回：{"status":"ok","message":"服务运行正常"}
```

### 7.2 测试 HTTPS 访问

在浏览器中访问：
```
https://api.yourdomain.com/health
```

应该返回 JSON 数据。

### 7.3 测试 API 接口

```bash
curl https://api.yourdomain.com/api/config/check
```

## 八、常见问题

### 8.1 服务无法启动

- 检查 `.env` 文件配置是否正确
- 检查数据库连接是否正常
- 查看 PM2 日志：`pm2 logs de-questionnaire`

### 8.2 无法访问 HTTPS

- 确认 SSL 证书已正确配置
- 检查防火墙是否开放 443 端口
- 确认域名 DNS 解析正确

### 8.3 数据库连接失败

- 检查 MySQL 服务是否运行
- 检查 `.env` 中的数据库配置
- 确认数据库用户有权限访问 `de_Q` 数据库

### 8.4 小程序无法访问 API

- 确认已在小程序管理后台配置合法域名
- 确认 API 地址使用 HTTPS
- 检查 Nginx 反向代理配置是否正确

## 九、更新代码

### 9.1 使用 Git 更新

```bash
cd /www/wwwroot/api.yourdomain.com
git pull
cd backend
npm install --production
pm2 restart de-questionnaire
```

### 9.2 手动更新

1. 上传新代码到服务器
2. 进入 `backend` 目录
3. 运行 `npm install --production`
4. 重启服务：`pm2 restart de-questionnaire`

## 十、监控和维护

### 10.1 查看服务状态

```bash
pm2 status
pm2 logs de-questionnaire --lines 100
```

### 10.2 查看服务器资源

在宝塔面板中查看：
- CPU 使用率
- 内存使用率
- 磁盘使用率

### 10.3 备份数据库

在宝塔面板中：
1. 点击 **"数据库"**
2. 找到 `de_Q` 数据库
3. 点击 **"备份"**
4. 定期备份，建议每天自动备份

---

## 快速部署检查清单

- [ ] 服务器已安装 Node.js 和 MySQL
- [ ] 已创建网站并配置域名
- [ ] 已上传代码到服务器
- [ ] 已安装依赖：`npm install --production`
- [ ] 已配置 `.env` 文件
- [ ] 已导入数据库（schema.sql 和 demo_data.sql）
- [ ] 已使用 PM2 启动服务
- [ ] 已配置 Nginx 反向代理
- [ ] 已配置 SSL 证书（HTTPS）
- [ ] 已在小程序管理后台配置合法域名
- [ ] 已更新 `miniprogram/config.js` 中的 `prodApiBaseUrl`
- [ ] 已测试 API 接口可正常访问

完成以上步骤后，你的后端服务就可以在公网访问了！

