const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'de_Q',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 连接池配置
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  // 超时设置
  connectTimeout: 60000, // 60秒连接超时
  // 远程数据库连接稳定性配置
  ssl: false,
  // 处理连接错误
  handleDisconnects: true,
  // 增加连接稳定性
  acquireTimeout: 60000,
  timeout: 60000,
  // 自动重连配置
  reconnect: true,
  // 闲置连接超时（5分钟）
  idleTimeout: 300000
});

// 测试数据库连接（不阻塞启动）
pool.getConnection()
  .then(connection => {
    console.log('数据库连接成功');
    connection.release();
  })
  .catch(err => {
    console.warn('数据库连接失败:', err.message);
    console.warn('服务将继续启动，但数据库功能将无法使用');
  });

// 处理连接错误和自动重连
pool.on('connection', (connection) => {
  connection.on('error', (err) => {
    console.error('数据库连接错误:', err.message);
  });
});

pool.on('error', (err) => {
  console.error('数据库连接池错误:', err.message);
});

module.exports = pool;
