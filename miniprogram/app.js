// app.js
App({
  onLaunch() {
    // 检查登录状态
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
    apiBaseUrl: require('./config').apiBaseUrl
  }
});
