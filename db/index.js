// 导入mysql模块
const mysql = require('mysql')

// 创建数据库连接对象
const db = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'heheng77',
    database: 'mecs',
    port:3306
})

// 向外共享db数据库连接对象
module.exports = db