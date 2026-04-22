function pad(number) {
  return String(number).padStart(2, '0')
}

function formatDate(dateText) {
  if (!dateText) return ''
  const date = new Date(dateText)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function calculateAgeMonths(birthDate) {
  const birth = new Date(birthDate)
  const now = new Date()
  let months = (now.getFullYear() - birth.getFullYear()) * 12
  months += now.getMonth() - birth.getMonth()
  if (now.getDate() < birth.getDate()) {
    months -= 1
  }
  return Math.max(months, 0)
}

function formatAgeText(birthDate) {
  const months = calculateAgeMonths(birthDate)
  const years = Math.floor(months / 12)
  const leftMonths = months % 12
  if (years <= 0) {
    return `${months}个月`
  }
  if (leftMonths === 0) {
    return `${years}岁`
  }
  return `${years}岁${leftMonths}个月`
}

function getWeekLabel(offset) {
  const labels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  return labels[offset] || `第${offset + 1}天`
}

function getShortDate(dateText) {
  const date = new Date(dateText)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

module.exports = {
  formatDate,
  calculateAgeMonths,
  formatAgeText,
  getWeekLabel,
  getShortDate
}
