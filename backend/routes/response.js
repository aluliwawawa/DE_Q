const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');
const { calculateScore, getRecommendation, findExtremeChoices, generateExtremeFeedback, checkDailyLimit } = require('../services/scoring');
const { selectQuestions } = require('../services/questionSelector');

const router = express.Router();

// 安全解析JSON字段（MySQL的JSON字段可能已经被mysql2解析为对象）
function safeParseJSON(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (err) {
      console.error('JSON解析失败:', err, '原始值:', value);
      return null;
    }
  }
  // 如果已经是对象，直接返回
  if (typeof value === 'object') {
    return value;
  }
  return null;
}

// 提交答题
router.post('/submit', authMiddleware, async (req, res, next) => {
  try {
    const { answers } = req.body;
    const { id: userId, openid } = req.user;

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '答题数据不能为空',
        data: null
      });
    }

    // 检查每日答题限制
    const canAnswer = await checkDailyLimit(openid);
    if (!canAnswer) {
      return res.status(403).json({
        code: 403,
        message: '您今天已经答过题了，请明天再来',
        data: null
      });
    }

    // 获取题目（使用智能选题，固定30题）
    let questions;
    try {
      questions = await selectQuestions();
    } catch (err) {
      if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
        // 重试最多3次
        let retries = 3;
        while (retries > 0) {
          try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            questions = await selectQuestions();
            break; // 成功则跳出循环
          } catch (retryErr) {
            retries--;
            if (retries === 0) {
              throw retryErr;
            }
          }
        }
      } else {
        throw err;
      }
    }

    // 验证答题完整性（固定30题）
    if (answers.length !== 30) {
      return res.status(400).json({
        code: 400,
        message: '请回答所有30道题目',
        data: null
      });
    }

    // 验证答案格式和范围
    for (const answer of answers) {
      if (!answer.question_id || !answer.answer) {
        return res.status(400).json({
          code: 400,
          message: '答题格式错误',
          data: null
        });
      }
      if (answer.answer < 1 || answer.answer > 5) {
        return res.status(400).json({
          code: 400,
          message: '答案值必须在1-5之间',
          data: null
        });
      }
    }

    // 计算总分
    const totalScore = calculateScore(answers, questions);

    // 获取建议文案（带错误处理）
    let recommendation;
    try {
      recommendation = await getRecommendation(totalScore);
    } catch (err) {
      console.error('获取建议文案失败:', err);
      // 使用默认建议
      recommendation = {
        code: 'default',
        text: '基于您的回答，我们建议您进一步了解德国移居相关信息。'
      };
    }

    // 识别极端选择
    const extremeChoices = findExtremeChoices(answers, questions);

    // 生成极端反馈（带错误处理）
    let extremeFeedback = '';
    try {
      extremeFeedback = await generateExtremeFeedback(extremeChoices);
    } catch (err) {
      console.error('生成极端反馈失败:', err);
      extremeFeedback = '';
    }

    // 保存答题记录（带重试机制）
    let result;
    const recommendationCode = (recommendation.code || 'default').substring(0, 100); // 确保不超过100字符
    
    try {
      [result] = await db.query(
        `INSERT INTO responses 
         (user_id, openid, answers_json, total_score, recommendation, recommendation_text, extreme_choices, extreme_feedback) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          openid,
          JSON.stringify(answers),
          totalScore,
          recommendationCode,
          recommendation.text,
          JSON.stringify(extremeChoices),
          extremeFeedback
        ]
      );
      console.log('答题记录保存成功，ID:', result.insertId);
    } catch (err) {
      console.error('保存答题记录失败:', err.message);
      if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
        // 重试最多3次
        let retries = 3;
        while (retries > 0) {
          try {
            console.log(`重试保存记录，剩余${retries}次...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
            [result] = await db.query(
              `INSERT INTO responses 
               (user_id, openid, answers_json, total_score, recommendation, recommendation_text, extreme_choices, extreme_feedback) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                userId,
                openid,
                JSON.stringify(answers),
                totalScore,
                recommendationCode, // 使用相同的截断后的code
                recommendation.text,
                JSON.stringify(extremeChoices),
                extremeFeedback
              ]
            );
            console.log('重试后保存成功，ID:', result.insertId);
            break; // 成功则跳出循环
          } catch (retryErr) {
            console.error('重试保存失败:', retryErr.message);
            retries--;
            if (retries === 0) {
              throw retryErr;
            }
          }
        }
      } else {
        // 非连接错误，直接抛出
        console.error('数据库错误:', err.code, err.message);
        throw err;
      }
    }

    res.json({
      code: 0,
      message: '提交成功',
      data: {
        response_id: result.insertId,
        total_score: totalScore,
        recommendation: {
          code: recommendation.code,
          text: recommendation.text
        },
        extreme_feedback: extremeFeedback
      }
    });
  } catch (error) {
    next(error);
  }
});

// 获取答题结果
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const responseId = req.params.id;
    const { id: userId } = req.user;

    const [responses] = await db.query(
      `SELECT * FROM responses WHERE id = ? AND user_id = ?`,
      [responseId, userId]
    );

    if (responses.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '答题记录不存在',
        data: null
      });
    }

    const response = responses[0];

    res.json({
      code: 0,
      message: '获取成功',
      data: {
        response_id: response.id,
        total_score: response.total_score,
        recommendation: {
          code: response.recommendation,
          text: response.recommendation_text
        },
        extreme_feedback: response.extreme_feedback,
        answers: safeParseJSON(response.answers_json) || [],
        extreme_choices: safeParseJSON(response.extreme_choices) || [],
        created_at: response.created_at
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
