// pages/questionnaire/questionnaire.js
const { request } = require('../../utils/api');

Page({
  data: {
    questions: [],
    currentIndex: 0,
    answers: [],
    loading: true
  },

  onLoad() {
    this.loadQuestions();
  },

  // 加载题目
  loadQuestions() {
    wx.showLoading({ title: '加载中...' });

    request('/questionnaire/current', 'GET')
      .then(data => {
        wx.hideLoading();
        const questions = data.questions;
        const answers = new Array(questions.length).fill(null);
        
        this.setData({
          questions,
          answers,
          loading: false
        });
      })
      .catch(err => {
        wx.hideLoading();
        // 检查是否是题库异常错误
        if (err.message && err.message.includes('题库异常')) {
          wx.showToast({
            title: '题库异常，请联系作者检查',
            icon: 'none',
            duration: 3000
          });
          setTimeout(() => {
            // 跳转到主页
            wx.reLaunch({
              url: '/pages/index/index'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: err.message || '加载失败',
            icon: 'none'
          });
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
  },

  // 选择答案
  selectAnswer(e) {
    const { index } = e.currentTarget.dataset;
    const { currentIndex, answers, questions } = this.data;
    
    answers[currentIndex] = index + 1; // 1-5

    // 保存答案
    this.setData({
      answers,
      [`answers[${currentIndex}]`]: index + 1
    });

    // 如果是最后一题，提交答案
    if (currentIndex === questions.length - 1) {
      this.submitAnswers();
    } else {
      // 自动跳转下一题
      this.nextQuestion();
    }
  },

  // 下一题
  nextQuestion() {
    const { currentIndex, questions } = this.data;
    if (currentIndex < questions.length - 1) {
      this.setData({
        currentIndex: currentIndex + 1
      });
    }
  },

  // 上一题
  prevQuestion() {
    const { currentIndex } = this.data;
    if (currentIndex > 0) {
      this.setData({
        currentIndex: currentIndex - 1
      });
    }
  },

  // 提交答案
  submitAnswers() {
    const { questions, answers } = this.data;

    // 检查是否所有题目都已回答
    if (answers.some(a => a === null)) {
      wx.showToast({
        title: '请回答所有题目',
        icon: 'none'
      });
      return;
    }

    // 构造提交数据
    const submitData = {
      answers: questions.map((q, index) => ({
        question_id: q.id,
        answer: answers[index]
      }))
    };

    wx.showLoading({ title: '提交中...' });

    request('/responses/submit', 'POST', submitData)
      .then(data => {
        wx.hideLoading();
        // 跳转到结果页
        wx.redirectTo({
          url: `/pages/result/result?id=${data.response_id}`
        });
      })
      .catch(err => {
        wx.hideLoading();
        // 检查是否是题库异常错误
        if (err.message && err.message.includes('题库异常')) {
          wx.showToast({
            title: '题库异常，请联系作者检查',
            icon: 'none',
            duration: 3000
          });
          setTimeout(() => {
            // 跳转到主页
            wx.reLaunch({
              url: '/pages/index/index'
            });
          }, 1500);
        } else {
          wx.showToast({
            title: err.message || '提交失败',
            icon: 'none'
          });
        }
      });
  },

  // 计算进度
  getProgress() {
    const { currentIndex, questions } = this.data;
    return Math.round(((currentIndex + 1) / questions.length) * 100);
  }
});
