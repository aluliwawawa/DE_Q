const db = require('../config/database');

// 计算总分：权重 × 选项值
function calculateScore(answers, questions) {
  let totalScore = 0;
  for (const answer of answers) {
    const question = questions.find(q => q.id === answer.question_id);
    if (question) {
      totalScore += parseFloat(question.weight) * answer.answer;
    }
  }
  return Math.round(totalScore * 100) / 100; // 保留两位小数
}

// 获取建议文案（根据总分区间）
async function getRecommendation(totalScore) {
  let rules;
  try {
    [rules] = await db.query(
      `SELECT * FROM score_rules 
       WHERE rule_type = 'score_interval' AND status = 1
       ORDER BY priority DESC`
    );
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
      // 重试最多3次
      let retries = 3;
      while (retries > 0) {
        try {
          // 重试中...
          await new Promise(resolve => setTimeout(resolve, 1000));
          [rules] = await db.query(
            `SELECT * FROM score_rules 
             WHERE rule_type = 'score_interval' AND status = 1
             ORDER BY priority DESC`
          );
          break; // 成功则跳出循环
        } catch (retryErr) {
          retries--;
          if (retries === 0) {
            console.error('获取建议规则失败，使用默认建议');
            throw retryErr;
          }
        }
      }
    } else {
      throw err;
    }
  }

  for (const rule of rules) {
    // MySQL JSON字段可能已经解析为对象，也可能还是字符串
    let condition;
    try {
      if (typeof rule.condition_json === 'string') {
        condition = JSON.parse(rule.condition_json);
      } else if (rule.condition_json && typeof rule.condition_json === 'object') {
        condition = rule.condition_json;
      } else {
        // 规则格式异常，跳过
        continue;
      }
    } catch (parseErr) {
      console.error('解析condition_json失败:', parseErr.message);
      continue;
    }
    
    if (condition && typeof condition.min === 'number' && typeof condition.max === 'number') {
      if (totalScore >= condition.min && totalScore <= condition.max) {
        // 生成code：如果result_text包含"|"则取第一部分，否则使用简短标识
        let code = 'unknown';
        if (rule.result_text.includes('|')) {
          code = rule.result_text.split('|')[0].trim();
        } else {
          // 使用规则ID和分数区间作为code
          code = `rule_${rule.id}_${condition.min}_${condition.max}`;
        }
        // 确保code不超过100字符
        code = code.substring(0, 100);
        
        return {
          code: code,
          text: rule.result_text
        };
      }
    }
  }

  // 默认返回
  return {
    code: 'default',
    text: '基于您的回答，我们建议您进一步了解德国移居相关信息。'
  };
}

// 识别极端选择（1或5）
function findExtremeChoices(answers, questions) {
  const extremes = [];
  for (const answer of answers) {
    if (answer.answer === 1 || answer.answer === 5) {
      const question = questions.find(q => q.id === answer.question_id);
      if (question) {
        extremes.push({
          question_id: answer.question_id,
          answer: answer.answer,
          category: question.category
        });
      }
    }
  }
  return extremes;
}

// 生成极端反馈
async function generateExtremeFeedback(extremeChoices) {
  if (extremeChoices.length === 0) {
    return '';
  }

  // 按category分组统计
  const categoryGroups = {};
  for (const choice of extremeChoices) {
    const key = `${choice.category}_${choice.answer}`;
    if (!categoryGroups[key]) {
      categoryGroups[key] = [];
    }
    categoryGroups[key].push(choice);
  }

  // 查询极端反馈规则（带重试机制）
  let rules;
  try {
    [rules] = await db.query(
      `SELECT * FROM score_rules 
       WHERE rule_type = 'extreme_feedback' AND status = 1
       ORDER BY priority DESC`
    );
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
      // 重试最多3次
      let retries = 3;
      while (retries > 0) {
        try {
          // 重试中...
          await new Promise(resolve => setTimeout(resolve, 1000));
          [rules] = await db.query(
            `SELECT * FROM score_rules 
             WHERE rule_type = 'extreme_feedback' AND status = 1
             ORDER BY priority DESC`
          );
          break; // 成功则跳出循环
        } catch (retryErr) {
          retries--;
          if (retries === 0) {
            console.error('获取极端反馈规则失败，返回空反馈');
            return ''; // 返回空字符串而不是抛出错误
          }
        }
      }
    } else {
      throw err;
    }
  }

  const feedbacks = [];
  
  // 匹配规则生成反馈
  for (const [key, choices] of Object.entries(categoryGroups)) {
    const [category, answerValue] = key.split('_');
    const answerType = answerValue === '1' ? 'low' : 'high';
    
    // 查找匹配的规则
    for (const rule of rules) {
      // MySQL JSON字段可能已经解析为对象，也可能还是字符串
      let condition;
      try {
        if (typeof rule.condition_json === 'string') {
          condition = JSON.parse(rule.condition_json);
        } else if (rule.condition_json && typeof rule.condition_json === 'object') {
          condition = rule.condition_json;
        } else {
          continue;
        }
      } catch (parseErr) {
        console.error('解析极端反馈规则失败:', parseErr.message);
        continue;
      }
      
      if (condition && condition.category === parseInt(category) && condition.extreme_type === answerType) {
        feedbacks.push(rule.result_text);
        break; // 每个category只匹配第一个规则
      }
    }
  }

  // 如果没有匹配的规则，使用默认反馈
  if (feedbacks.length === 0) {
    const lowCount = extremeChoices.filter(c => c.answer === 1).length;
    const highCount = extremeChoices.filter(c => c.answer === 5).length;
    
    if (lowCount > 0 && highCount > 0) {
      return '您在部分方面得分较低，但在其他方面得分较高，建议您综合考虑各方面因素。';
    } else if (lowCount > 0) {
      return '您在多个方面得分较低，建议您深入了解德国移居的相关要求和挑战。';
    } else {
      return '您在多个方面得分较高，这是很好的信号，但建议您继续深入了解德国的实际情况。';
    }
  }

  return feedbacks.join(' ');
}

// 检查每日答题限制（带重试机制）
// 开关：在 .env 文件中设置 ENABLE_DAILY_LIMIT=true 来启用每日限制
// 开发环境建议设置为 false 以方便测试
async function checkDailyLimit(openid) {
  // 检查是否启用每日限制（默认为false，即不限制）
  const enableDailyLimit = process.env.ENABLE_DAILY_LIMIT === 'true';
  
  if (!enableDailyLimit) {
    return true; // 不限制，允许答题
  }

  const today = new Date().toISOString().split('T')[0];
  let results;
  try {
    [results] = await db.query(
      `SELECT COUNT(*) as count FROM responses 
       WHERE openid = ? AND DATE(created_at) = ?`,
      [openid, today]
    );
  } catch (err) {
    if (err.code === 'ECONNRESET' || err.code === 'PROTOCOL_CONNECTION_LOST' || err.code === 'ETIMEDOUT') {
      // 重试最多3次
      let retries = 3;
      while (retries > 0) {
        try {
          // 重试中...
          await new Promise(resolve => setTimeout(resolve, 1000));
          [results] = await db.query(
            `SELECT COUNT(*) as count FROM responses 
             WHERE openid = ? AND DATE(created_at) = ?`,
            [openid, today]
          );
          break; // 成功则跳出循环
        } catch (retryErr) {
          retries--;
          if (retries === 0) {
            console.error('检查每日限制失败，默认允许答题');
            return true; // 失败时默认允许答题，避免阻塞用户
          }
        }
      }
    } else {
      throw err;
    }
  }
  return results[0].count === 0;
}

module.exports = {
  calculateScore,
  getRecommendation,
  findExtremeChoices,
  generateExtremeFeedback,
  checkDailyLimit
};
