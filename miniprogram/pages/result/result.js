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
    extremeFeedbackList: [], // 极端反馈列表，用于分段显示
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
        // 处理极端反馈：将分隔符分隔的反馈拆分成数组，用于显示
        let extremeFeedbackList = [];
        if (data.extreme_feedback) {
          // 将反馈按特殊分隔符 ' ||| ' 分割，过滤空字符串
          extremeFeedbackList = data.extreme_feedback.split(' ||| ').filter(f => f.trim().length > 0);
        }
        
        this.setData({
          totalScore: data.total_score,
          recommendation: data.recommendation,
          extremeFeedback: data.extreme_feedback,
          extremeFeedbackList: extremeFeedbackList, // 用于列表显示
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
