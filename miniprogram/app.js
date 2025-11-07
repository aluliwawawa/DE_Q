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
    apiBaseUrl: require('./config').apiBaseUrl
  }
});
