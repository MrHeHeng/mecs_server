// 验证规则
const joi = require('joi')

/**
 * string() 值必须是字符串
 * alphanum() 值只能是包含 a-zA-Z0-9 的字符串
 * min(length) 最小长度
 * max(length) 最大长度
 * required() 值是必填项，不能为 undefined
 * pattern(正则表达式) 值必须符合正则表达式的规则
 */

// 用户名的验证规则
const username = joi.string().alphanum().min(3).max(15).required()
// 密码的验证规则
const password = joi
  .string()
  .pattern(/^[\S]{6,20}$/) //非空6-20位 正则表达式
  .required()
// 邮箱的验证规则
const email = joi
  .string()
  .pattern(/^[A-Za-z0-9\u4e00-\u9fa5]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/)
  .required()
// // 手机号码的验证规则
const mobile = joi
  .string()
  .pattern(/^[1][3,4,5,6,7,8,9][0-9]{9}$/)
  .required()
// 备注
const describle = joi
  .string()
// 新密码
const newpassword = joi
  .string()
  .pattern(/^[\S]{6,20}$/)  //非空6-20位 正则表达式
  .required()
    
// 登录表单的验证规则对象
exports.reg_login_schema = {
  // 表示需要对 req.body 中的数据进行验证
  body: {
    username,
    password,
  },
}
// 注册表单的验证规则对象
exports.reg_reg_schema = {
  // 表示需要对 req.body 中的数据进行验证
  body: {
    username,
    password,
    email,
    mobile,  
    describle,
  },
}
// 删除表单的验证规则对象
exports.reg_del_schema = {
  // 表示需要对 req.body 中的数据进行验证
  body: {
    username,
  },
}

// 更新用户表单的验证规则对象
exports.reg_update_schema = {
  // 表示需要对 req.body 中的数据进行验证
  body: {
    username,
    email,
    mobile,  
    describle,  
  },
}

// 修改用户密码的表单验证规则
exports.reg_psw_schema = {
  body: {
    username,
    password,
    newpassword ,
  }
}

