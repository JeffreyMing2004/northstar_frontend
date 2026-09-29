/**
 * 密码强度策略 —— 与后端 PasswordPolicy 一一对应。
 *
 * 规则：长度 8-72 位、必须同时包含字母和数字、不允许空白字符。
 * 上限 72 是因为 BCrypt 只取前 72 字节；前端一并校验可以避免
 * 「本地看着没问题、提交后被后端 400 打回」的割裂感。
 *
 * 改动这里时必须同步改后端 com.ming.northstar_backend.support.PasswordPolicy，
 * 否则会出现前端放行、后端拒绝（或反之）的口径不一致。
 */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

/** 直接展示给用户的规则说明。 */
export const PASSWORD_HINT = `${PASSWORD_MIN_LENGTH}-${PASSWORD_MAX_LENGTH} 位，需同时包含字母和数字`

/**
 * 校验密码，通过返回 null，不通过返回一句人话。
 *
 * @param {string} value 原始密码
 * @param {string} [label='密码'] 用于拼提示的字段名（如「新密码」）
 * @returns {string|null}
 */
export function passwordIssue(value, label = '密码') {
  const pwd = value == null ? '' : String(value)
  if (!pwd) return `请输入${label}`
  if (pwd.length < PASSWORD_MIN_LENGTH) return `${label}长度不能少于 ${PASSWORD_MIN_LENGTH} 位`
  if (pwd.length > PASSWORD_MAX_LENGTH) return `${label}长度不能超过 ${PASSWORD_MAX_LENGTH} 位`
  if (/\s/.test(pwd)) return `${label}不能包含空格`
  // 后端的 Character.isLetter 对中日韩等文字同样算字母，这里用 \p{L} 保持一致，
  // 否则「中文+数字」这种后端认可的密码会被前端误拦。
  if (!/\p{L}/u.test(pwd) || !/\d/.test(pwd)) return `${label}需同时包含字母和数字`
  return null
}
