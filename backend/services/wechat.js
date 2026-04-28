/**
 * 微信 API 服务
 * 负责与微信服务器交互获取 openid 和用户信息
 */

import axios from 'axios'
import crypto from 'node:crypto'

const WECHAT_API_BASE = 'https://api.weixin.qq.com'

export class WeChatApiError extends Error {
  constructor(message, status = 502, details = {}) {
    super(message)
    this.name = 'WeChatApiError'
    this.status = status
    this.details = details
  }
}

function isPlaceholder(value) {
  return !value || value.includes('your_') || value.endsWith('_here')
}

/**
 * 用微信 code 换取 session key 和 openid
 * 文档: https://developers.weixin.qq.com/miniprogram/dev/api-backend/open-api/login/code2Session.html
 */
export async function code2Session(code) {
  try {
    if (isPlaceholder(process.env.WECHAT_APP_ID) || isPlaceholder(process.env.WECHAT_APP_SECRET)) {
      throw new WeChatApiError(
        'WeChat login is not configured. Please set WECHAT_APP_ID and WECHAT_APP_SECRET in backend/.env.',
        503
      )
    }

    const response = await axios.get(`${WECHAT_API_BASE}/sns/jscode2session`, {
      params: {
        appid: process.env.WECHAT_APP_ID,
        secret: process.env.WECHAT_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    })

    // 微信返回错误
    if (response.data.errcode) {
      const message = response.data.errmsg || 'Unknown WeChat API error'
      const status = ['invalid appid', 'invalid appsecret'].some(item => message.includes(item)) ? 503 : 400

      throw new WeChatApiError(`WeChat code2Session failed: ${message}`, status, {
        errcode: response.data.errcode,
        errmsg: response.data.errmsg
      })
    }

    return {
      sessionKey: response.data.session_key,
      openid: response.data.openid,
      unionid: response.data.unionid // 如果用户绑定了 unionid
    }
  } catch (error) {
    console.error('WeChat code2Session error:', error.message)
    if (error instanceof WeChatApiError) {
      throw error
    }

    throw new WeChatApiError('Failed to exchange code for session', 502)
  }
}

/**
 * 获取微信用户信息（需要用户授权）
 * 这个方法用于解密小程序返回的加密用户数据
 */
export async function decryptUserInfo(encryptedData, iv, sessionKey) {
  try {
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64')
    const encryptedBuffer = Buffer.from(encryptedData, 'base64')
    const ivBuffer = Buffer.from(iv, 'base64')

    // AES-128-CBC 解密
    const decipher = crypto.createDecipheriv(
      'aes-128-cbc',
      sessionKeyBuffer,
      ivBuffer
    )

    let decoded = decipher.update(encryptedBuffer, 'binary', 'utf8')
    decoded += decipher.final('utf8')

    return JSON.parse(decoded)
  } catch (error) {
    console.error('Decrypt user info error:', error.message)
    throw new Error('Failed to decrypt user information')
  }
}
