/**
 * 在这里定义和用户相关的路由处理函数，供 /router/user.js 模块进行调用
 */
// 导入数据库模块
const db = require('../db/index')
// 导入bcryptjs加密
const bcrypt = require('bcryptjs')
// 用这个包来生成 Token 字符串
const jwt = require('jsonwebtoken')
// 导入全局的配置文件
const config = require('../config')
// 导入moment时间
const moment = require('moment')

// 注册用户的处理函数
exports.register = (req, res) => {
  const userinfo = req.body
  // 检测用户名是否被占用
  const sql = `select * from sf_users where username= ? `
  db.query(sql, [userinfo.username], (err,results) => {
    // 执行sql语句失败
    if (err) {
      return res.cc(err)
    }
    // 用户名被占用
    if (results.length > 0) {
      return res.cc('用户已存在，请更换其他用户名！')
    }
    // 对用户的密码,进行 bcrype 加密，返回值是加密之后的密码字符串
    userinfo.password = bcrypt.hashSync(userinfo.password, 10)
    const sqlStr = `insert into sf_users set ? `
    db.query(sqlStr,
    {
      username: userinfo.username,
      password: userinfo.password,
      mobile: userinfo.mobile.toString(),
      email: userinfo.email,
      time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      state:1,
      describle: userinfo.describle ? userinfo.describle : null
    },
    (err, results) =>
    {  
      // 执行 SQL 语句失败
      if (err) return res.cc(err)
      // SQL 语句执行成功，但影响行数不为 1
      if (results.affectedRows !== 1) {
        return res.cc('注册用户失败，请稍后再试！')
      }
      // 注册成功
      res.cc('注册成功！', 0)
    })


  })

}

// 登录的处理函数
let loginAttempts = {}
exports.login = (req, res) => {

  // 获取客户端提交表单的数据
  const userinfo = req.body
  const username = userinfo.username
  const now = Date.now()
    
    // 检查登录失败次数是否已经超过了限制
  if (loginAttempts[username] && loginAttempts[username].failedAttempts >= 15) {
    const lastAttemptTime = loginAttempts[username].time
    const timeSinceLastAttempt = now - lastAttemptTime
    const waitTime = 60 * 1000 * 15 // 15 minute
    const timeLeft = waitTime - timeSinceLastAttempt

    if (timeLeft > 0) {
        const message = `登录失败次数过多，请在 ${Math.ceil(timeLeft / 1000)} 秒后再试！`
        return res.cc(message)
    }
  }

  // 定义 SQL 语句
  const sql = `select * from sf_users where username=?`
  // 执行 SQL 语句，根据用户名查询用户的信息
  db.query(sql, [username], (err, results) => {
    // 执行 SQL 语句失败
    if (err) return res.cc(err)
    // 执行 SQL 语句成功，但是获取到的数据条数不等于 1
    if (results.length !== 1) {
        // 登录失败，增加登录失败次数并记录当前时间
        loginAttempts[username] = {
            time: now,
            failedAttempts: (loginAttempts[username]?.failedAttempts || 0) + 1
        }
        return res.cc('用户名或密码错误！')
    }

    // 判断密码是否正确
    const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
    if (!compareResult) {
        // 登录失败，增加登录失败次数并记录当前时间
        loginAttempts[username] = {
            time: now,
            failedAttempts: (loginAttempts[username]?.failedAttempts || 0) + 1
        }
        return res.cc('用户名或密码错误！')
    }

    // 登录成功，清除登录失败次数
    delete loginAttempts[username]

    // 在服务器端生成 Token 的字符串
    const user = { ...results[0], password: '', user_pic: '' }
    // 对用户的信息进行加密，生成 Token 字符串
    const tokenStr = jwt.sign(user, config.jwtSecretKey, { expiresIn: config.expiresIn })
    // 调用 res.send() 将 Token 响应给客户端
    res.send({
        status: 0,
        message: '登录成功！',
        token: 'Bearer ' + tokenStr,
        username: username,
        //  new Date().getTime(),
        time:moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),  // '2022-08-15 10:13:27',
    })

  })
}

// 获取所有用户的处理函数 1、分页查询  2、按用户名查询
exports.alluser = (req, res) => {
  // 参数验证
  if(!req.body.pagenum || req.body.pagenum <= 0) return res.cc("pagenum 参数错误",1);
  if(!req.body.pagesize || req.body.pagesize <= 0) return res.cc("pagesize 参数错误",1); 
  const page = parseInt(req.body.pagenum) || 1; // 从查询参数中获取页码，默认为第一页
  const limit = parseInt(req.body.pagesize) || 5; // 从查询参数中获取每页的用户数量，默认为10
  const offset = (page - 1) * limit;
  // 如果有用户名称
  if (req.body.username) {
    const query = `SELECT id,username,time,mobile,email,state,describle FROM sf_users Where username= ? `; // 查询数据库中的用户数据 
    db.query(query, [req.body.username], (error, results) => {
      if (error) {
        return res.cc(error,1); 
      } else {
        const userList = [...results] 
        res.send({
          status: 0,
          message: '查询用户成功！',
          userList,
          total:userList.length,
        })

      }
    });
    
  } else {
    const query = `SELECT id,username,time,mobile,email,state,describle FROM sf_users LIMIT ?, ?`; // 查询数据库中的用户数据 
    db.query(query, [offset, limit], (error, results) => {
      if (error) {
        return res.cc(error,1); 
      } else {
        const userList = [...results] 
        const sql = ` SELECT count(*) as count FROM sf_users`;
        db.query(sql, (error, results) => {
          if (error) {
            res.cc('内部服务器错误！',0)
          } else {
            const total = { ...results[0] }
            res.send({
              status: 0,
              message: '查询用户成功！',
              userList,
              total:total.count,
            })
          }
        });
      }
    });
    
  }



}

// 更新用户
exports.changeuser = (req, res) => {
  const updateInfo = req.body
  const sql = `UPDATE sf_users  SET ? WHERE username= ?`
  db.query(sql, [
  {
    username: updateInfo.username,
    mobile: updateInfo.mobile.toString(),
    email: updateInfo.email,
    time: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
    describle: updateInfo.describle
  },
  updateInfo.username], (err, results) => {
    // 执行sql语句失败
    if (err) {
      return res.cc('更新失败',1)
    }
    res.send({
      status: 0,
      message: '更新成功',
    })
 
  })
 
}

// 删除用户
exports.userdel = (req, res) => {
  const delinfo = req.body
  const sql = `DELETE FROM sf_users WHERE username= ?`
  db.query(sql, [delinfo.username], (err,results) => {
    // 执行sql语句失败
    if (err) {
      return res.cc('删除失败',1)
    }
    res.send({
      status: 0,
      message: '删除成功',
    })
 
  })

}

// 修改用户密码
exports.changepsw = (req, res) => {
  // 获取客户端提交到服务器的用户信息    req.params,req.query是用在get请求当中，而req.body是用在post请求中的
  const userinfo = req.body
  // 更改的密码和初始密码一致  直接返回
  if (userinfo.password == userinfo.newpassword) {
      // return res.send({ status: 1, message: '用户名或密码不合法！' })
      return res.cc('更改密码和初始密码相同！')
  }   //通过joi来验证表单

  // 判断用户输入的密码是否正确
  // 定义 SQL 语句
  const sql = `select * from sf_users where username=?`
  // 执行 SQL 语句，根据用户名查询用户的信息
  db.query(sql, [userinfo.username], (err, results) => {
      // 执行 SQL 语句失败
      if (err) return res.cc(err)
      // 执行 SQL 语句成功，但是获取到的数据条数不等于 1
      if (results.length !== 1) return res.cc('修改失败，请检查密码是否正确！')

      // TODO：判断密码是否正确
      const compareResult = bcrypt.compareSync(userinfo.password, results[0].password)
      if (!compareResult) return res.cc('修改失败，请检查密码是否正确！')

      // 对用户的密码,进行 bcrype 加密，返回值是加密之后的密码字符串
      userinfo.password = bcrypt.hashSync(userinfo.newpassword, 10)
      // 修改密码
      const sql = `UPDATE sf_users SET password =?,time=? WHERE username=?`
      db.query(sql, [userinfo.password, moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),userinfo.username], (err, results) => {
          // 执行 SQL 语句失败
          // if (err) return res.send({ status: 1, message: err.message })
          if (err) return res.cc(err)
          // SQL 语句执行成功，但影响行数不为 1
          if (results.affectedRows !== 1) {
              // return res.send({ status: 1, message: '注册用户失败，请稍后再试！' })
              return res.cc('注册用户失败，请稍后再试！')

          }
          // 修改密码成功
          res.send({
              status: 0,
              message: '修改成功',
              time:  moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
          })
      })

  })

}
