const { request } = require('../../utils/api');

Page({
  data: {
    questions: [],
    currentIndex: 0,
    answers: [],
    loading: true,
    progressPercent: 0,
    currentQuestion: null,
    currentAnswer: null
  },

  onLoad() {
    this.loadQuestions();
  },

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
          currentQuestion: questions[0],
          currentAnswer: null,
          progressPercent: Math.round((1 / questions.length) * 100),
          loading: false
        });
      })
      .catch(err => {
        wx.hideLoading();
        if (err.message && err.message.includes('题库异常')) {
          wx.showToast({
            title: '题库异常，请联系作者检查',
            icon: 'none',
            duration: 3000
          });
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/index/index'
            });
          });
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

  selectAnswer(e) {
    const { index } = e.currentTarget.dataset;
    const { currentIndex, answers, questions } = this.data;
    
    const answerValue = index + 1;
    const isLastQuestion = currentIndex === questions.length - 1;
    const nextIndex = currentIndex + 1;
    
    // 合并所有更新，避免多次渲染
    const updates = {
      [`answers[${currentIndex}]`]: answerValue,
      currentAnswer: answerValue
    };
    
    if (!isLastQuestion) {
      updates.currentIndex = nextIndex;
      updates.currentQuestion = questions[nextIndex];
      updates.currentAnswer = answers[nextIndex] || null;
      updates.progressPercent = Math.round((nextIndex + 1) / questions.length * 100);
    }
    
    this.setData(updates);

    if (isLastQuestion) {
      this.submitAnswers();
    } else {
      setTimeout(() => {
        wx.pageScrollTo({
          scrollTop: 0,
          duration: 200
        });
      }, 50);
    }
  },

  nextQuestion() {
    const { currentIndex, questions, answers } = this.data;
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      this.setData({
        currentIndex: nextIndex,
        currentQuestion: questions[nextIndex],
        currentAnswer: answers[nextIndex] || null,
        progressPercent: Math.round((nextIndex + 1) / questions.length * 100)
      });
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 200
      });
    }
  },

  prevQuestion() {
    const { currentIndex, questions, answers } = this.data;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      this.setData({
        currentIndex: prevIndex,
        currentQuestion: questions[prevIndex],
        currentAnswer: answers[prevIndex] || null,
        progressPercent: Math.round((prevIndex + 1) / questions.length * 100)
      });
      wx.pageScrollTo({
        scrollTop: 0,
        duration: 200
      });
    }
  },

  submitAnswers() {
    const { questions, answers } = this.data;

    if (answers.some(a => a === null)) {
      wx.showToast({
        title: '请回答所有题目',
        icon: 'none'
      });
      return;
    }

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
        wx.redirectTo({
          url: `/pages/result/result?id=${data.response_id}`
        });
      })
      .catch(err => {
        wx.hideLoading();
        if (err.message && err.message.includes('题库异常')) {
          wx.showToast({
            title: '题库异常，请联系作者检查',
            icon: 'none',
            duration: 3000
          });
          setTimeout(() => {
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
  }
});
