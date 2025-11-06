// pages/index/index.js
const { devLogin, wechatLogin, checkAnswerPermission } = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    isLoggedIn: false,
    canAnswer: true,
    checkingPermission: false
  },

  onLoad() {
    const app = getApp();
    this.setData({
      isLoggedIn: app.globalData.isLoggedIn
    });
    
    // 如果已登录，检查答题权限
    if (app.globalData.isLoggedIn) {
      this.checkPermission();
    }
  },

  onShow() {
    // 每次显示页面时，如果已登录，重新检查权限
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      this.checkPermission();
    }
  },

  // 检查答题权限
  checkPermission() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return;
    }

    this.setData({ checkingPermission: true });
    
    checkAnswerPermission()
      .then(data => {
        this.setData({
          canAnswer: data.canAnswer,
          checkingPermission: false
        });
        
        if (!data.canAnswer) {
          wx.showToast({
            title: data.message || '您今天已经答过题了',
            icon: 'none',
            duration: 3000
          });
        }
      })
      .catch(err => {
        this.setData({
          checkingPermission: false,
          canAnswer: true // 失败时默认允许，避免阻塞
        });
      });
  },

  // 开始答题
  startQuestionnaire() {
    const app = getApp();
    
    if (!app.globalData.isLoggedIn) {
      // 需要先登录
      this.login();
      return;
    }

    // 检查权限
    if (!this.data.canAnswer) {
      wx.showToast({
        title: '您今天已经答过题了，请明天再来',
        icon: 'none',
        duration: 3000
      });
      return;
    }

    // 跳转到问卷页面
    wx.navigateTo({
      url: '/pages/questionnaire/questionnaire'
    });
  },

  // 登录（开发模式或微信登录）
  login() {
    wx.showLoading({
      title: '登录中...'
    });

    // 开发模式：使用测试登录
    if (config.devMode) {
      devLogin('测试用户')
        .then(() => {
          wx.hideLoading();
          this.setData({ isLoggedIn: true });
          // 登录成功后检查权限并跳转
          this.checkPermissionAndNavigate();
        })
        .catch(err => {
          wx.hideLoading();
          wx.showToast({
            title: err.message || '登录失败',
            icon: 'none'
          });
        });
    } else {
      // 生产模式：使用微信登录
      wechatLogin()
        .then(() => {
          wx.hideLoading();
          this.setData({ isLoggedIn: true });
          // 登录成功后检查权限并跳转
          this.checkPermissionAndNavigate();
        })
        .catch(err => {
          wx.hideLoading();
          wx.showToast({
            title: err.message || '登录失败',
            icon: 'none'
          });
        });
    }
  },

  // 检查权限并跳转（登录成功后调用）
  checkPermissionAndNavigate() {
    const app = getApp();
    if (!app.globalData.isLoggedIn) {
      return;
    }

    this.setData({ checkingPermission: true });
    
    checkAnswerPermission()
      .then(data => {
        this.setData({
          canAnswer: data.canAnswer,
          checkingPermission: false
        });
        
        if (data.canAnswer) {
          // 允许答题，跳转到问卷页面
          wx.navigateTo({
            url: '/pages/questionnaire/questionnaire'
          });
        } else {
          // 不允许答题，显示提示
          wx.showToast({
            title: data.message || '您今天已经答过题了',
            icon: 'none',
            duration: 3000
          });
        }
      })
      .catch(err => {
        this.setData({
          checkingPermission: false,
          canAnswer: true // 失败时默认允许，避免阻塞
        });
        // 失败时默认允许答题并跳转
        wx.navigateTo({
          url: '/pages/questionnaire/questionnaire'
        });
      });
  }
});
