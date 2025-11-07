const config = require('./config');

// 检测运行环境并返回对应的 API 地址
function getApiBaseUrl() {
  try {
    // 获取小程序账号信息
    const accountInfo = wx.getAccountInfoSync();
    const envVersion = accountInfo.miniProgram.envVersion;
    
    // envVersion 可能的值：
    // 'develop' - 开发版（开发者工具）
    // 'trial' - 体验版
    // 'release' - 正式版
    // undefined - 开发工具调试模式
    
    // 如果是体验版或正式版，使用生产环境地址
    if (envVersion === 'trial' || envVersion === 'release') {
      if (!config.prodApiBaseUrl) {
        console.error('⚠️ 生产环境API地址未配置！请在 config.js 中设置 prodApiBaseUrl');
        // 如果未配置，返回空字符串，让错误更明显
        return '';
      }
      console.log('使用生产环境API:', config.prodApiBaseUrl);
      return config.prodApiBaseUrl;
    }
    
    // 开发环境：使用本地地址
    let apiBaseUrl = config.devApiBaseUrl;
    
    // 真机调试时，如果配置了 realDeviceIp，替换 localhost
    if (config.realDeviceIp && apiBaseUrl.includes('localhost')) {
      apiBaseUrl = apiBaseUrl.replace('localhost', config.realDeviceIp);
      console.log('真机调试模式：使用IP地址', config.realDeviceIp);
    } else {
      console.log('开发环境：使用本地地址', apiBaseUrl);
    }
    
    return apiBaseUrl;
  } catch (err) {
    // 如果获取账号信息失败（某些旧版本可能不支持），默认使用开发环境
    console.warn('无法检测运行环境，使用开发环境配置', err);
    let apiBaseUrl = config.devApiBaseUrl;
    if (config.realDeviceIp && apiBaseUrl.includes('localhost')) {
      apiBaseUrl = apiBaseUrl.replace('localhost', config.realDeviceIp);
    }
    return apiBaseUrl;
  }
}

App({
  onLaunch() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      this.globalData.isLoggedIn = true;
    }
  },

  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    apiBaseUrl: getApiBaseUrl()
  }
});
