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
          wx.showToast({
            title: err.message || '登录失败',
            icon: 'none'
          });
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
          wx.showToast({
            title: err.message || '登录失败',
            icon: 'none'
          });
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
        // 如果检查失败，仍然允许进入，由后端控制
        wx.navigateTo({
          url: '/pages/questionnaire/questionnaire'
        });
      });
  }
});
