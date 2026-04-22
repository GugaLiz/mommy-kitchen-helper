const whoData = require('./who-lhfa-data')

const DAY_MS = 24 * 60 * 60 * 1000
const AVG_MONTH_DAYS = 30.4375
const CURVE_SAMPLE_DAYS = 7

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value))
}

function normalizeGender(gender) {
  return gender === '女' ? 'girls' : 'boys'
}

function getAgeDays(birthDate, measuredDate) {
  const birth = new Date(birthDate)
  const measured = new Date(measuredDate)
  return Math.max(0, Math.round((measured - birth) / DAY_MS))
}

function getCompletedMonths(birthDate, measuredDate) {
  const birth = new Date(birthDate)
  const measured = new Date(measuredDate)
  let months = (measured.getFullYear() - birth.getFullYear()) * 12
  months += measured.getMonth() - birth.getMonth()
  if (measured.getDate() < birth.getDate()) {
    months -= 1
  }
  return Math.max(months, 0)
}

function getMeasureLabel(ageDays) {
  return ageDays < 731 ? '身长' : '身高'
}

function formatAgeTick(months) {
  if (months === 12) return '1岁'
  if (months === 24) return '2岁'
  if (months === 36) return '3岁'
  if (months === 48) return '4岁'
  if (months === 60) return '5岁'
  return `${months}个月`
}

function interpolateEntry(entries, day) {
  const safeDay = clamp(day, entries[0].day, entries[entries.length - 1].day)
  const lowerIndex = Math.floor(safeDay)
  const upperIndex = Math.ceil(safeDay)
  const lower = entries[lowerIndex]
  const upper = entries[upperIndex]

  if (!upper || lowerIndex === upperIndex) {
    return lower
  }

  const ratio = safeDay - lowerIndex
  return {
    day: safeDay,
    L: lower.L + (upper.L - lower.L) * ratio,
    M: lower.M + (upper.M - lower.M) * ratio,
    S: lower.S + (upper.S - lower.S) * ratio,
    P3: lower.P3 + (upper.P3 - lower.P3) * ratio,
    P50: lower.P50 + (upper.P50 - lower.P50) * ratio,
    P97: lower.P97 + (upper.P97 - lower.P97) * ratio
  }
}

function getReferenceByDay(gender, day) {
  return interpolateEntry(whoData[normalizeGender(gender)], day)
}

function erf(x) {
  const sign = x < 0 ? -1 : 1
  const absX = Math.abs(x)
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  const t = 1 / (1 + p * absX)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX)
  return sign * y
}

function normalCdf(z) {
  return 0.5 * (1 + erf(z / Math.sqrt(2)))
}

function getZScore(value, reference) {
  if (!reference) return 0
  if (reference.L === 0) {
    return Math.log(value / reference.M) / reference.S
  }
  return (Math.pow(value / reference.M, reference.L) - 1) / (reference.L * reference.S)
}

function buildSegments(points) {
  return points.slice(0, -1).map((point, index) => {
    const nextPoint = points[index + 1]
    const x1 = point.x
    const x2 = nextPoint.x
    const y1 = point.y
    const y2 = nextPoint.y
    const width = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
    const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI

    return {
      left: `${x1}%`,
      bottom: `${y1}%`,
      width: `${width}%`,
      angle: `rotate(${angle}deg)`
    }
  })
}

function buildBandColumns(upperPoints, lowerPoints, slices = 72) {
  if (!upperPoints.length || !lowerPoints.length) {
    return []
  }

  const columns = []
  const minX = upperPoints[0].x
  const maxX = upperPoints[upperPoints.length - 1].x
  const span = Math.max(maxX - minX, 1)
  const width = span / slices

  for (let index = 0; index < slices; index += 1) {
    const x = minX + width * index
    const nextX = x + width
    const upper = interpolatePosition(upperPoints, x)
    const lower = interpolatePosition(lowerPoints, x)
    const upperNext = interpolatePosition(upperPoints, nextX)
    const lowerNext = interpolatePosition(lowerPoints, nextX)
    const top = Math.max(upper.y, upperNext.y)
    const bottom = Math.min(lower.y, lowerNext.y)

    columns.push({
      left: `${x}%`,
      width: `${Math.max(width + 0.35, 1.2)}%`,
      bottom: `${bottom}%`,
      height: `${Math.max(top - bottom, 0.8)}%`
    })
  }

  return columns
}

function interpolatePosition(points, x) {
  if (x <= points[0].x) return points[0]
  if (x >= points[points.length - 1].x) return points[points.length - 1]

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    if (x >= current.x && x <= next.x) {
      const ratio = (x - current.x) / Math.max(next.x - current.x, 1e-6)
      return {
        x,
        y: current.y + (next.y - current.y) * ratio
      }
    }
  }

  return points[points.length - 1]
}

function buildPositionedPoints(rawPoints, domain) {
  const { minDay, maxDay, minValue, maxValue } = domain
  const daySpan = Math.max(maxDay - minDay, 1)
  const valueSpan = Math.max(maxValue - minValue, 1)

  return rawPoints.map(point => {
    const x = ((point.day - minDay) / daySpan) * 100
    const y = 8 + ((point.value - minValue) / valueSpan) * 82
    return {
      ...point,
      x,
      y,
      left: `${x}%`,
      bottom: `${y}%`
    }
  })
}

function getPercentileInfo(baby, record) {
  if (!baby || !record) {
    return {
      percentile: 50,
      percentileText: 'P50 分位',
      zScore: 0,
      measureLabel: '身高'
    }
  }

  const ageDays = getAgeDays(baby.birthDate, record.measuredDate)
  const reference = getReferenceByDay(baby.gender, ageDays)
  const zScore = getZScore(Number(record.height), reference)
  const percentile = clamp(Math.round(normalCdf(zScore) * 100), 1, 99)

  return {
    percentile,
    percentileText: `P${percentile} 分位`,
    zScore,
    measureLabel: getMeasureLabel(ageDays),
    ageDays
  }
}

function buildHeightChartData(baby, records = []) {
  if (!baby || !records.length) {
    return null
  }

  const sorted = records.slice().sort((a, b) => new Date(a.measuredDate) - new Date(b.measuredDate))
  const measuredPoints = sorted.map(item => {
    const day = getAgeDays(baby.birthDate, item.measuredDate)
    return {
      day,
      value: Number(item.height),
      label: formatAgeTick(getCompletedMonths(baby.birthDate, item.measuredDate)),
      measuredDate: item.measuredDate,
      height: item.height
    }
  })

  const minDay = Math.max(0, Math.floor(measuredPoints[0].day / AVG_MONTH_DAYS) * AVG_MONTH_DAYS)
  const lastDay = measuredPoints[measuredPoints.length - 1].day
  const maxDay = clamp(
    Math.ceil((lastDay + AVG_MONTH_DAYS * 2) / AVG_MONTH_DAYS) * AVG_MONTH_DAYS,
    minDay + AVG_MONTH_DAYS * 4,
    1856
  )

  const sampleDays = []
  for (let day = minDay; day <= maxDay; day += CURVE_SAMPLE_DAYS) {
    sampleDays.push(Math.round(day))
  }
  if (sampleDays[sampleDays.length - 1] !== Math.round(maxDay)) {
    sampleDays.push(Math.round(maxDay))
  }

  const ref3 = sampleDays.map(day => ({ day, value: getReferenceByDay(baby.gender, day).P3 }))
  const ref50 = sampleDays.map(day => ({ day, value: getReferenceByDay(baby.gender, day).P50 }))
  const ref97 = sampleDays.map(day => ({ day, value: getReferenceByDay(baby.gender, day).P97 }))

  const allValues = measuredPoints.map(item => item.value)
    .concat(ref3.map(item => item.value))
    .concat(ref50.map(item => item.value))
    .concat(ref97.map(item => item.value))

  const rawMin = Math.min(...allValues)
  const rawMax = Math.max(...allValues)
  const yStep = rawMax - rawMin > 25 ? 10 : 5
  const minValue = Math.floor((rawMin - yStep) / yStep) * yStep
  const maxValue = Math.ceil((rawMax + yStep) / yStep) * yStep

  const domain = { minDay, maxDay, minValue, maxValue }

  const series3 = buildPositionedPoints(ref3, domain)
  const series50 = buildPositionedPoints(ref50, domain)
  const series97 = buildPositionedPoints(ref97, domain)
  const actualSeries = buildPositionedPoints(measuredPoints, domain)

  const xTicks = []
  const startMonth = Math.max(0, Math.floor(minDay / AVG_MONTH_DAYS / 2) * 2)
  const endMonth = Math.ceil(maxDay / AVG_MONTH_DAYS / 2) * 2
  for (let month = startMonth; month <= endMonth; month += 2) {
    const day = month * AVG_MONTH_DAYS
    if (day < minDay - 1 || day > maxDay + 1) continue
    const left = ((day - minDay) / Math.max(maxDay - minDay, 1)) * 100
    xTicks.push({
      left: `${left}%`,
      label: formatAgeTick(month)
    })
  }

  const yTicks = []
  for (let value = minValue; value <= maxValue; value += yStep) {
    const bottom = 8 + ((value - minValue) / Math.max(maxValue - minValue, 1)) * 82
    yTicks.push({
      label: String(value),
      bottom: `${bottom}%`
    })
  }

  const latestPoint = actualSeries[actualSeries.length - 1]
  const latestAgeDays = measuredPoints[measuredPoints.length - 1].day

  return {
    title: `${getMeasureLabel(latestAgeDays)}曲线`,
    unit: 'cm',
    measureLabel: getMeasureLabel(latestAgeDays),
    xTicks,
    yTicks,
    bandColumns: buildBandColumns(series97, series3),
    actual: {
      points: actualSeries,
      segments: buildSegments(actualSeries)
    },
    references: [
      {
        key: 'P97',
        label: '97%',
        className: 'ref-high',
        points: series97,
        segments: buildSegments(series97),
        tagPoint: series97[series97.length - 1]
      },
      {
        key: 'P50',
        label: '50%',
        className: 'ref-mid',
        points: series50,
        segments: buildSegments(series50),
        tagPoint: series50[series50.length - 1]
      },
      {
        key: 'P3',
        label: '3%',
        className: 'ref-low',
        points: series3,
        segments: buildSegments(series3),
        tagPoint: series3[series3.length - 1]
      }
    ],
    latestMarker: latestPoint ? {
      left: latestPoint.left,
      label: '最近'
    } : null
  }
}

module.exports = {
  getAgeDays,
  getCompletedMonths,
  getMeasureLabel,
  getReferenceByDay,
  getPercentileInfo,
  buildHeightChartData
}
