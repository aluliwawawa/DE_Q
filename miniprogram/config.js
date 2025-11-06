// 小程序配置文件
const config = {
  // 后端API地址（开发环境）
  // 部署到服务器后，需要修改为实际的HTTPS地址
  apiBaseUrl: 'http://localhost:3000/api',
  
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
