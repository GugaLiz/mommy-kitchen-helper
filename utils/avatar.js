function getMimeType(filePath = '') {
  const lowerPath = String(filePath).toLowerCase()
  if (lowerPath.endsWith('.png')) return 'image/png'
  if (lowerPath.endsWith('.webp')) return 'image/webp'
  if (lowerPath.endsWith('.gif')) return 'image/gif'
  return 'image/jpeg'
}

function isPersistableAvatar(source = '') {
  if (!source) return false
  return (
    source.indexOf('data:image/') === 0 ||
    source.indexOf('https://') === 0 ||
    source.indexOf('/assets/') === 0
  )
}

function readFileAsBase64(filePath) {
  return new Promise((resolve, reject) => {
    const fs = wx.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (res) => {
        resolve(`data:${getMimeType(filePath)};base64,${res.data}`)
      },
      fail: reject
    })
  })
}

function downloadToTempFile(url) {
  return new Promise((resolve, reject) => {
    wx.downloadFile({
      url,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300 && res.tempFilePath) {
          resolve(res.tempFilePath)
          return
        }
        reject(new Error('Download avatar failed'))
      },
      fail: reject
    })
  })
}

async function toDataUrl(filePath) {
  if (String(filePath).indexOf('http://') === 0) {
    const tempFilePath = await downloadToTempFile(filePath)
    return readFileAsBase64(tempFilePath)
  }

  return readFileAsBase64(filePath)
}

async function ensurePersistableAvatar(source = '') {
  if (!source) return ''
  if (isPersistableAvatar(source)) return source
  return toDataUrl(source)
}

module.exports = {
  ensurePersistableAvatar,
  isPersistableAvatar
}
