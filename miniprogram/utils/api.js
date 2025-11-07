function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    const app = getApp();
    const token = app.globalData.token;
    // 使用 app.globalData 中的 apiBaseUrl（已根据环境自动处理）
    const apiBaseUrl = app.globalData.apiBaseUrl || 'http://localhost:3000/api';

    wx.request({
      url: apiBaseUrl + url,
      method: method,
      data: data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success(res) {
        if (res.statusCode === 200) {
          if (res.data.code === 0) {
            resolve(res.data.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        } else {
          const errorMsg = res.data?.message || `HTTP ${res.statusCode}`;
          reject(new Error(errorMsg));
        }
      },
      fail(err) {
        // 网络错误时提供更详细的错误信息
        let errorMessage = '网络请求失败';
        if (err.errMsg) {
          if (err.errMsg.includes('fail')) {
            errorMessage = '无法连接到服务器，请检查网络或服务器地址配置';
          } else {
            errorMessage = err.errMsg;
          }
        }
        reject(new Error(errorMessage));
      }
    });
  });
}

function devLogin(nickname = '测试用户') {
  return new Promise((resolve, reject) => {
    request('/auth/dev/login', 'POST', {
      nickname: nickname
    }).then(data => {
      const app = getApp();
      app.globalData.token = data.token;
      app.globalData.userInfo = data.user;
      app.globalData.isLoggedIn = true;
      wx.setStorageSync('token', data.token);
      resolve(data);
    }).catch(reject);
  });
}

function wechatLogin() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (res.code) {
          wx.getUserProfile({
            desc: '用于完善用户资料',
            success(userRes) {
              request('/auth/wechat/login', 'POST', {
                code: res.code,
                nickname: userRes.userInfo.nickName
              }).then(data => {
                const app = getApp();
                app.globalData.token = data.token;
                app.globalData.userInfo = data.user;
                app.globalData.isLoggedIn = true;
                wx.setStorageSync('token', data.token);
                resolve(data);
              }).catch(reject);
            },
            fail: reject
          });
        } else {
          reject(new Error('获取code失败'));
        }
      },
      fail: reject
    });
  });
}

function checkAnswerPermission() {
  return request('/questionnaire/check-permission', 'GET');
}

function shareReward() {
  return request('/share/reward', 'POST');
}

module.exports = {
  request,
  devLogin,
  wechatLogin,
  checkAnswerPermission,
  shareReward
};
