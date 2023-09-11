// 导入 express 模块
const express = require('express')
// 创建 express 的服务器实例
const app = express()
const joi = require('joi')
const bodyParser = require('body-parser')

// 导入 cors 中间件
const cors = require('cors')
// 导入 https 和 证书
const https = require('https')
const fs = require('fs')
const options = {
    cert: fs.readFileSync('./cert/https/cert.pem'),
    key: fs.readFileSync('./cert/https/cert.key'),
    ca: fs.readFileSync('./cert/https/server-chain.crt')
}

// 配置解析表单数据的中间件，注意：这个中间件，只能解析 application/x-www-form-urlencoded 格式的表单数据
// app.use(express.urlencoded({ extended: false }))
// 解析json对象
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 一定要在路由之前，封装 res.cc 函数   响应数据的中间件
app.use((req, res, next) => {
    // status 默认值为 1，表示失败的情况
    // err 的值，可能是一个错误对象，也可能是一个错误的描述字符串
    res.cc = function (err, status = 1) {
        res.send({
            status,
            message: err instanceof Error ? err.message : err,
        })
    }
    next()
})

// 将 cors 注册为全局中间件
app.use(cors())

// 导入配置文件
const config = require('./config')
// 解析 token 的中间件
// const expressJWT = require('express-jwt')
var { expressjwt: jwt } = require("express-jwt");
// // 使用 .unless({ path: [/^\/api\//] }) 指定哪些接口不需要进行 Token 的身份认证
// app.use(expressJWT({ secret: config.jwtSecretKey }).unless({ path: [/^\/user/] }))
app.use(
  jwt({
    secret: config.jwtSecretKey,
    algorithms: ["HS256"],
  }).unless({ path: [/^\/user/] })
);


// 导入并注册用户路由模块
const userRouter = require('./router/user')
app.use('/user', userRouter)

// 用户修改密码模块
const changeUserRouter = require('./router/user')
app.use('/api/user', changeUserRouter)

// 定义错误级别的中间件
app.use((err, req, res, next) => {
    // 数据验证失败
    if (err instanceof joi.ValidationError) return res.cc(err)
    // 捕获身份认证失败的错误
    if (err.name === 'UnauthorizedError') return res.cc('身份认证失败！')
    // 未知错误
    res.cc(err)
})

// 调用 app.listen 方法，指定端口号并启动web服务器
app.listen(3007, function () {
  console.log('api server running at http://127.0.0.1:3007')
})

// https.createServer(options, app).listen(3308);