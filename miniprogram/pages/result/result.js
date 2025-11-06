// pages/result/result.js
const { request } = require('../../utils/api');
const config = require('../../config');

Page({
  data: {
    responseId: null,
    totalScore: 0,
    recommendation: {
      code: '',
      text: ''
    },
    extremeFeedback: '',
    wechatId: config.publicAccount.wechatId,
    qrCodeImage: config.publicAccount.qrCodeImage,
    loading: true
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ responseId: options.id });
      this.loadResult();
    }
  },

  // 加载结果
  loadResult() {
    wx.showLoading({ title: '加载中...' });

    request(`/responses/${this.data.responseId}`, 'GET')
      .then(data => {
        wx.hideLoading();
        this.setData({
          totalScore: data.total_score,
          recommendation: data.recommendation,
          extremeFeedback: data.extreme_feedback,
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

  // 复制微信号
  copyWechatId() {
    wx.setClipboardData({
      data: this.data.wechatId,
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        });
      }
    });
  },

  // 重新答题
  restart() {
    wx.navigateTo({
      url: '/pages/questionnaire/questionnaire'
    });
  }
});
