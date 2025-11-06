const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { checkDailyLimit } = require('../services/scoring');
const { selectQuestions } = require('../services/questionSelector');

const router = express.Router();

// 检查答题权限（需要登录）
router.get('/check-permission', authMiddleware, async (req, res, next) => {
  try {
    const { openid } = req.user;
    const canAnswer = await checkDailyLimit(openid);
    
    res.json({
      code: 0,
      message: canAnswer ? '可以答题' : '您今天已经答过题了，请明天再来',
      data: {
        canAnswer,
        message: canAnswer ? '可以开始答题' : '您今天已经答过题了，请明天再来'
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取当前问卷（需要登录）
router.get('/current', authMiddleware, async (req, res, next) => {
  try {
    const { openid } = req.user;
    
    // 检查每日答题限制
    const canAnswer = await checkDailyLimit(openid);
    if (!canAnswer) {
      return res.status(403).json({
        code: 403,
        message: '您今天已经答过题了，请明天再来',
        data: null
      });
    }

    // 智能选题：选择30道题
    const questions = await selectQuestions();

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        questions: questions.map(q => {
          // 处理德国格式的逗号小数点
          const weightStr = String(q.weight).replace(',', '.');
          return {
            id: q.id,
            text: q.q_text,
            weight: parseFloat(weightStr),
            category: q.cat
          };
        })
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
