import axios from 'axios'

class SimpleHeaders {
  constructor(init = {}) {
    this.map = {}

    if (init instanceof SimpleHeaders) {
      init.forEach((value, key) => {
        this.set(key, value)
      })
      return
    }

    if (Array.isArray(init)) {
      init.forEach(([key, value]) => this.set(key, value))
      return
    }

    Object.keys(init || {}).forEach((key) => {
      this.set(key, init[key])
    })
  }

  set(key, value) {
    this.map[String(key).toLowerCase()] = String(value)
  }

  get(key) {
    return this.map[String(key).toLowerCase()] ?? null
  }

  append(key, value) {
    const normalized = String(key).toLowerCase()
    if (this.map[normalized]) {
      this.map[normalized] = `${this.map[normalized]}, ${value}`
      return
    }
    this.set(key, value)
  }

  has(key) {
    return this.get(key) !== null
  }

  delete(key) {
    delete this.map[String(key).toLowerCase()]
  }

  forEach(callback) {
    Object.keys(this.map).forEach((key) => callback(this.map[key], key))
  }

  entries() {
    return Object.entries(this.map)
  }
}

function toPlainHeaders(headers) {
  if (!headers) return {}
  if (headers instanceof SimpleHeaders) {
    return Object.fromEntries(headers.entries())
  }
  return headers
}

function buildResponse(response) {
  const headers = new SimpleHeaders(response.headers || {})
  const payload = response.data
  const textPayload = typeof payload === 'string' ? payload : JSON.stringify(payload ?? '')

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    statusText: response.statusText,
    headers,
    async text() {
      return textPayload
    },
    async json() {
      if (typeof payload === 'string') {
        return JSON.parse(payload || '{}')
      }
      return payload
    }
  }
}

if (typeof globalThis.Headers === 'undefined') {
  globalThis.Headers = SimpleHeaders
}

if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = async (url, options = {}) => {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: toPlainHeaders(options.headers),
      data: options.body,
      responseType: 'text',
      validateStatus: () => true
    })

    return buildResponse(response)
  }
}
