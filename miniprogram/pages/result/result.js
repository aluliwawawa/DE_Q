const { request, shareReward } = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    responseId: null,
    totalScore: 0,
    recommendation: 0,
    recommendationText: '',
    extremeFeedback: '',
    extremeFeedbackList: [],
    qrCodeImage: config.publicAccount.qrCodeImage,
    loading: true,
    userNickname: ''
  },

  onLoad(options) {
    const app = getApp();
    const userNickname = app.globalData.userInfo?.nickname || '你';
    this.setData({ userNickname });
    
    // 启用分享功能
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
    
    if (options.id) {
      this.setData({ responseId: options.id });
      this.loadResult();
    }
  },

  loadResult() {
    wx.showLoading({ title: '加载中...' });

    request(`/responses/${this.data.responseId}`, 'GET')
      .then(data => {
        wx.hideLoading();
        
        let extremeFeedbackList = [];
        if (data.extreme_feedback) {
          extremeFeedbackList = data.extreme_feedback.split(' ||| ').filter(f => f.trim().length > 0);
        }
        
        // 总分向上取整（0.5进1）
        const roundedScore = Math.ceil(data.total_score);
        
        this.setData({
          totalScore: roundedScore,
          recommendation: data.recommendation,
          recommendationText: data.recommendation_text || '',
          extremeFeedback: data.extreme_feedback || '',
          extremeFeedbackList: extremeFeedbackList,
          loading: false
        });
      })
      .catch(err => {
        wx.hideLoading();
        wx.showToast({
          title: err.message || '加载失败',
          icon: 'none'
        });
      });
  },

  onShareAppMessage() {
    // 分享成功后调用奖励接口
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      shareReward()
        .then(data => {
          if (data.rewarded) {
            wx.showToast({
              title: data.message || '获得1次额外答题机会',
              icon: 'success',
              duration: 2000
            });
          }
        })
        .catch(err => {
          console.error('分享奖励失败:', err);
        });
    }

    return {
      title: `我的德国生存指数是${this.data.totalScore}分！`,
      path: `/pages/index/index`,
      imageUrl: '' // 可选：分享图片
    };
  },

  onShareTimeline() {
    // 分享到朋友圈
    const app = getApp();
    if (app.globalData.isLoggedIn) {
      shareReward()
        .then(data => {
          if (data.rewarded) {
            wx.showToast({
              title: data.message || '获得1次额外答题机会',
              icon: 'success',
              duration: 2000
            });
          }
        })
        .catch(err => {
          console.error('分享奖励失败:', err);
        });
    }

    return {
      title: `我的德国生存指数是${this.data.totalScore}分！`,
      query: '',
      imageUrl: ''
    };
  },

  goHome() {
    wx.reLaunch({
      url: '/pages/index/index'
    });
  }
});
