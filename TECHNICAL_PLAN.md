# 德国移居问卷小程序 - 技术方案文档

## 一、项目概述

### 1.1 功能目标
- 用户通过1-5分符合度选择题判断是否推荐德国移居
- 计算总分（推荐度）并给出建议文案
- 根据极端选择（1或5）生成定制反馈
- 记录用户答题数据到MySQL

### 1.2 用户限制
- 每个openid每天只能回答一次
- 需要微信授权获取昵称

## 二、技术架构

### 2.1 前端：微信小程序
- **技术栈**：原生微信小程序（WXML + WXSS + JavaScript）
- **组件库**：TDesign Miniprogram（可选，简化UI开发）
- **核心功能**：
  - 微信登录授权（获取openid和昵称）
  - 问卷展示（单选1-5分）
  - 进度条显示
  - 答题逻辑（点击跳转、返回上一题）
  - 结果页展示（总分、建议、极端反馈）
  - 固定引流内容展示

### 2.2 后端：Node.js + Express
- **技术栈**：Node.js + Express + MySQL
- **原因**：轻量、快速开发、易于在宝塔部署
- **核心功能**：
  - 微信登录验证（code2session）
  - 问卷数据API
  - 答题提交与验证
  - 评分计算（权重×选项值）
  - 区间判断（总分→建议文案）
  - 极端属性识别与反馈生成
  - 每日答题次数限制

### 2.3 数据库：MySQL
- **表结构**：
  1. `users` - 用户表（openid、昵称）
  2. `questionnaire` - 问卷表（题目、选项、权重）
  3. `responses` - 答题记录表（用户、答案、总分、结果）
  4. `rules` - 规则表（区间规则、极端反馈规则）

## 三、数据结构设计

### 3.1 数据库表设计

#### users 用户表
```sql
CREATE TABLE `users` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `openid` VARCHAR(64) UNIQUE NOT NULL COMMENT '微信openid',
  `nickname` VARCHAR(100) COMMENT '微信昵称',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_openid` (`openid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### questionnaire 问卷表
```sql
CREATE TABLE `questionnaire` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `question_text` TEXT NOT NULL COMMENT '题目描述',
  `weight` DECIMAL(5,2) NOT NULL DEFAULT 1.00 COMMENT '权重',
  `category` INT COMMENT '类别数字（用于极端属性分类）',
  `order_num` INT NOT NULL COMMENT '排序号',
  `status` TINYINT DEFAULT 1 COMMENT '1启用 0禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### responses 答题记录表
```sql
CREATE TABLE `responses` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL COMMENT '用户ID',
  `openid` VARCHAR(64) NOT NULL COMMENT 'openid冗余',
  `answers_json` JSON NOT NULL COMMENT '答题JSON: [{question_id: 1, answer: 3}, ...]',
  `total_score` DECIMAL(10,2) NOT NULL COMMENT '总分',
  `recommendation` VARCHAR(50) COMMENT '建议文案代码',
  `recommendation_text` TEXT COMMENT '建议文案内容',
  `extreme_choices` JSON COMMENT '极端选择: [{question_id: 1, answer: 1, category: 2}, ...]',
  `extreme_feedback` TEXT COMMENT '极端属性定制反馈',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_openid_date` (`openid`, `created_at`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

#### score_rules 评分规则表
```sql
CREATE TABLE `score_rules` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `rule_type` VARCHAR(20) NOT NULL COMMENT '规则类型: score_interval(区间) / extreme_feedback(极端反馈)',
  `condition_json` JSON NOT NULL COMMENT '条件JSON',
  `result_text` TEXT NOT NULL COMMENT '结果文案',
  `priority` INT DEFAULT 0 COMMENT '优先级（数字越大越优先）',
  `status` TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**score_rules 示例数据**：
- 区间规则：`{"min": 0, "max": 20}` → "不推荐"
- 区间规则：`{"min": 21, "max": 40}` → "谨慎考虑"
- 区间规则：`{"min": 41, "max": 100}` → "推荐移居"
- 极端反馈规则：`{"extreme_type": 1, "categories": [1,2]}` → "您在XX方面得分较低..."

### 3.2 前端数据结构

#### 问卷数据结构（后端返回）
```json
{
  "questions": [
    {
      "id": 1,
      "text": "您对德国的生活成本了解程度如何？",
      "weight": 2.5,
      "category": 1,
      "order": 1
    }
  ]
}
```

#### 提交答案结构
```json
{
  "answers": [
    {"question_id": 1, "answer": 3},
    {"question_id": 2, "answer": 5}
  ]
}
```

#### 结果数据结构（后端返回）
```json
{
  "total_score": 65.5,
  "recommendation": {
    "code": "recommended",
    "text": "基于您的回答，我们推荐您考虑移居德国..."
  },
  "extreme_feedback": "您在生活成本和文化适应方面得分较高，这是很好的信号..."
}
```

## 四、API设计

### 4.1 认证相关
```
POST /api/auth/wechat/login
Request: { code: "微信登录code" }
Response: { 
  token: "JWT令牌",
  user: { id, openid, nickname }
}
```

### 4.2 问卷相关
```
GET /api/questionnaire/current
Response: {
  questions: [
    { id, text, weight, category, order }
  ]
}
```

### 4.3 答题相关
```
POST /api/responses/submit
Request: {
  answers: [{ question_id, answer }]
}
Response: {
  response_id: 123,
  total_score: 65.5,
  recommendation: { code, text },
  extreme_feedback: "..."
}
```

### 4.4 结果查询
```
GET /api/responses/:id
Response: {
  total_score, recommendation, extreme_feedback,
  answers, created_at
}
```

## 五、核心逻辑设计

### 5.1 评分计算（后端）
```javascript
// 伪代码
function calculateScore(answers, questions) {
  let totalScore = 0;
  for (let answer of answers) {
    const question = questions.find(q => q.id === answer.question_id);
    totalScore += question.weight * answer.answer; // 权重 × 选项值(1-5)
  }
  return totalScore;
}
```

### 5.2 区间判断（后端）
```javascript
// 从score_rules表查询区间规则，匹配总分所在区间
function getRecommendation(totalScore) {
  const rule = score_rules.find(r => 
    totalScore >= r.condition_json.min && 
    totalScore <= r.condition_json.max
  );
  return rule.result_text;
}
```

### 5.3 极端属性识别（后端）
```javascript
function findExtremeChoices(answers, questions) {
  const extremes = [];
  for (let answer of answers) {
    if (answer.answer === 1 || answer.answer === 5) {
      const question = questions.find(q => q.id === answer.question_id);
      extremes.push({
        question_id: answer.question_id,
        answer: answer.answer,
        category: question.category
      });
    }
  }
  return extremes;
}

// 根据极端选择生成定制反馈
function generateExtremeFeedback(extremes, rules) {
  // 匹配extreme_feedback规则，生成文案
}
```

### 5.4 每日答题限制（后端）
```javascript
// 检查用户今天是否已答题
async function checkDailyLimit(openid) {
  const today = new Date().toISOString().split('T')[0];
  const count = await db.query(
    'SELECT COUNT(*) FROM responses WHERE openid = ? AND DATE(created_at) = ?',
    [openid, today]
  );
  return count === 0; // 返回true表示可以答题
}
```

## 六、前端UI流程

### 6.1 页面结构
1. **首页/欢迎页**：引导用户开始答题
2. **问卷页**：
   - 顶部：进度条（当前题号/总题数）
   - 中间：题目描述
   - 下方：1-5分选项按钮（点击自动跳转下一题）
   - 底部：返回上一题按钮
3. **结果页**：
   - 总分显示
   - 建议文案
   - 极端属性定制反馈
   - 固定引流内容
4. **登录页**：微信授权获取昵称

### 6.2 交互逻辑
- 点击1-5选项 → 保存答案 → 自动跳转下一题
- 点击返回按钮 → 返回上一题（可修改答案）
- 完成最后一题 → 提交到后端 → 跳转结果页
- 结果页可查看详细反馈

## 七、部署方案

### 7.1 本地开发环境
- Node.js 16+
- MySQL 5.7+
- 微信开发者工具
- 本地配置小程序AppID和AppSecret

### 7.2 生产环境（腾讯云宝塔）
- 宝塔Linux面板
- Node.js环境安装
- MySQL数据库创建
- Nginx反向代理配置
- PM2进程管理
- SSL证书配置（小程序必须HTTPS）

## 八、开发步骤建议

### Phase 1: 后端基础搭建
1. 创建Express项目结构
2. 连接MySQL数据库
3. 创建数据库表结构
4. 实现微信登录接口
5. 实现问卷数据接口

### Phase 2: 核心功能开发
1. 实现卑微提交接口
2. 实现评分计算逻辑
3. 实现区间判断逻辑
4. 实现极端属性识别
5. 实现每日限制检查

### Phase 3: 前端开发
1. 创建小程序项目
2. 实现登录授权
3. 实现问卷页面UI
4. 实现答题交互逻辑
5. 实现结果页展示

### Phase 4: 测试与优化
1. 本地功能测试
2. 数据统计验证
3. 性能优化
4. 小程序提审准备

## 九、数据统计需求

### 9.1 统计指标
- 用户名/OPENID
- 答题次数（每日限制后，实际就是每天1次）
- 答题结果（每题分值、总分值）

### 9.2 统计SQL示例
```sql
-- 用户答题统计
SELECT 
  u.openid,
  u.nickname,
  COUNT(r.id) sin答题次数,
  r.total_score,
  r.recommendation,
  JSON_EXTRACT(r.answers_json, '$') as 每题分值,
  r.created_at
FROM users u
LEFT JOIN responses r ON u.id = r.user_id
GROUP BY u.id
ORDER BY r.created_at DESC;
```

## 十、最终确认事项

1. **极端反馈规则**：✅ 按category和用户选择(1或5)写死几条内容，具体调试时完善
2. **固定引流内容**：✅ 结果页包含：
   - 公众号二维码（微信内置长按关注功能）
   - 微信号（旁边有按钮可一键复制）
3. **题目数量**：✅ 20道题目，需要demo数据，后期可拓展
4. **权重配置**：✅ 题目权重和category在代码中配置（questionnaire表），可直接修改
5. **开发流程**：✅ 先在本地搭建完成，测试通过后再部署到服务器

## 十一、开发环境配置

### 11.1 需要配置的信息
- 小程序AppID和AppSecret（用于微信登录）
- MySQL数据库连接信息（本地开发）
- 后端服务端口（建议3000）
- 公众号二维码图片路径
- 微信号文本

