const { devLogin, wechatLogin, checkAnswerPermission } = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    isLoggedIn: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  onShow() {
    const app = getApp();
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
  },

  startQuestionnaire() {
    const app = getApp();
    
    if (!app.globalData.isLoggedIn) {
      this.login();
      return;
    }

    // 检查配额（但不阻止进入，由后端控制）
    checkAnswerPermission()
      .then(data => {
        if (!data.canAnswer) {
          wx.showModal({
            title: '提示',
            content: data.message || '答题次数已用完，可以通过分享获得额外次数',
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }
        wx.navigateTo({
          url: '/pages/questionnaire/questionnaire'
        });
      })
      .catch(err => {
        // 如果检查失败，仍然允许进入，由后端控制
        wx.navigateTo({
          url: '/pages/questionnaire/questionnaire'
        });
      });
  },

  login() {
    wx.showLoading({
      title: '登录中...'
    });

    if (config.devMode) {
      devLogin('测试用户')
        .then(() => {
          wx.hideLoading();
          this.setData({ isLoggedIn: true });
          this.checkPermissionAndNavigate();
        })
        .catch(err => {
          wx.hideLoading();
          console.error('登录失败:', err);
          let errorMsg = err.message || '登录失败';
          // 如果是网络错误，提供更友好的提示
          if (errorMsg.includes('无法连接') || errorMsg.includes('网络') || errorMsg.includes('fail')) {
            // 检测运行环境
            try {
              const accountInfo = wx.getAccountInfoSync();
              const envVersion = accountInfo.miniProgram.envVersion;
              
              if (envVersion === 'trial' || envVersion === 'release') {
                // 体验版/正式版：提示配置生产环境地址
                errorMsg = '无法连接到服务器\n\n这是体验版/正式版，需要配置生产环境API地址。\n\n请在 config.js 中设置 prodApiBaseUrl 为公网可访问的HTTPS地址。';
              } else {
                // 开发环境：提示检查本地服务
                errorMsg = '无法连接到服务器\n\n请检查：\n1. 后端服务是否启动（http://localhost:3000）\n2. 真机调试时，请使用"自动真机调试"或勾选"局域网模式"\n3. 或使用"预览"功能进行测试';
              }
            } catch (e) {
              // 如果无法检测环境，使用通用提示
              errorMsg = '无法连接到服务器\n\n请检查：\n1. 后端服务是否启动\n2. 网络连接是否正常\n3. 如果是体验版，请配置生产环境API地址';
            }
          }
          wx.showModal({
            title: '登录失败',
            content: errorMsg,
            showCancel: false,
            confirmText: '知道了'
          });
          // 登录失败时，不继续执行后续操作
          return;
        });
    } else {
      wechatLogin()
        .then(() => {
          wx.hideLoading();
          this.setData({ isLoggedIn: true });
          this.checkPermissionAndNavigate();
        })
        .catch(err => {
          wx.hideLoading();
          console.error('登录失败:', err);
          let errorMsg = err.message || '登录失败';
          // 如果是网络错误，提供更友好的提示
          if (errorMsg.includes('无法连接') || errorMsg.includes('网络') || errorMsg.includes('fail')) {
            // 检测运行环境
            try {
              const accountInfo = wx.getAccountInfoSync();
              const envVersion = accountInfo.miniProgram.envVersion;
              
              if (envVersion === 'trial' || envVersion === 'release') {
                // 体验版/正式版：提示配置生产环境地址
                errorMsg = '无法连接到服务器\n\n这是体验版/正式版，需要配置生产环境API地址。\n\n请在 config.js 中设置 prodApiBaseUrl 为公网可访问的HTTPS地址。';
              } else {
                // 开发环境：提示检查本地服务
                errorMsg = '无法连接到服务器\n\n请检查：\n1. 后端服务是否启动（http://localhost:3000）\n2. 真机调试时，请使用"自动真机调试"或勾选"局域网模式"\n3. 或使用"预览"功能进行测试';
              }
            } catch (e) {
              // 如果无法检测环境，使用通用提示
              errorMsg = '无法连接到服务器\n\n请检查：\n1. 后端服务是否启动\n2. 网络连接是否正常\n3. 如果是体验版，请配置生产环境API地址';
            }
          }
          wx.showModal({
            title: '登录失败',
            content: errorMsg,
            showCancel: false,
            confirmText: '知道了'
          });
          // 登录失败时，不继续执行后续操作
          return;
        });
    }
  },

  checkPermissionAndNavigate() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return;
    }

    // 检查配额（但不阻止进入，由后端控制）
    checkAnswerPermission()
      .then(data => {
        if (!data.canAnswer) {
          wx.showModal({
            title: '提示',
            content: data.message || '答题次数已用完，可以通过分享获得额外次数',
            showCancel: false,
            confirmText: '知道了'
          });
          return;
        }
        wx.navigateTo({
          url: '/pages/questionnaire/questionnaire'
        });
      })
      .catch(err => {
        // 如果检查失败，记录错误但不阻止进入（由后端控制）
        console.warn('检查权限失败，但仍允许进入:', err);
        wx.navigateTo({
          url: '/pages/questionnaire/questionnaire'
        });
      });
  }
});
