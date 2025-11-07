// 小程序配置文件
const config = {
  // ========== 后端API地址配置 ==========
  // 开发环境（模拟器/真机调试）：使用本地地址
  // 生产环境（开发版/体验版/正式版）：必须使用公网可访问的HTTPS地址
  
  // 开发环境API地址（本地调试使用）
  devApiBaseUrl: 'http://localhost:3000/api',
  
  // 生产环境API地址（开发版/体验版/正式版使用）
  // ⚠️ 重要：上传开发版/体验版前，必须配置为公网可访问的HTTPS地址
  // 例如：'https://your-domain.com/api' 或 'https://your-server.com/api'
  prodApiBaseUrl: '', // 请填入你的后端服务器地址（HTTPS）
  
  // 真机调试时的IP地址（可选，仅用于本地真机调试）
  // 获取方法：在PowerShell中执行 ipconfig，找到"IPv4 地址"
  // 例如：'192.168.1.49'
  realDeviceIp: '192.168.1.49', // 真机调试时使用此IP替换localhost
  
  // 开发模式开关（上线前设为false，使用真实微信登录）
  devMode: true,  // 开发时设为true，跳过微信登录；上线前改为false
  
  // 引流内容配置
  publicAccount: {
    // 公众号二维码图片路径（需要在微信小程序中上传图片）
    qrCodeImage: '/images/qrcode.jpg',
    // 微信号
    wechatId: 'your_wechat_id'
  }
};

module.exports = config;
