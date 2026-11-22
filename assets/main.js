// 落地页的全部脚本：把「从哪里来/什么设备/什么系统/页面语言」拼成一个标记，预填进 Google 表单的链接。
// 没有依赖，不用 Cookie，不加载任何第三方脚本，本页也不提交任何东西。

const source = sessionSource()
const link = document.querySelector('#join-link')
if (link) {
  const tag = [source, deviceType(), operatingSystem(), link.dataset.lang].join('/')
  link.href = link.dataset.url.replace('SOURCETAG', encodeURIComponent(tag))
}

/** 只留小写字母、数字和 . _ -，最长 40 个字符：来源标记会进名单，不能带进任何别的东西。 */
function clean(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
    .slice(0, 40)
}

/** 链接上带的标记（?utm_source=xhs）。 */
function taggedSource() {
  const query = new URLSearchParams(location.search)
  return clean(query.get('utm_source') || query.get('src') || query.get('ref'))
}

/** 来路网站；自己站内的跳转不算。 */
function referrerSource() {
  try {
    const host = new URL(document.referrer).hostname.replace(/^www\./, '')
    if (host && host !== location.hostname) return clean(host)
  } catch {
    // 没有来路
  }
  return ''
}

/** 同一个标签页里换语言、看完隐私说明再回来，来源不变；关掉标签页就忘掉。 */
function sessionSource() {
  const key = 'landing.source'
  const tagged = taggedSource()
  try {
    if (tagged) {
      sessionStorage.setItem(key, tagged)
      return tagged
    }
    const saved = sessionStorage.getItem(key)
    if (saved) return saved
    const fresh = referrerSource() || 'direct'
    sessionStorage.setItem(key, fresh)
    return fresh
  } catch {
    // 隐私模式下可能不让用会话存储
    return tagged || referrerSource() || 'direct'
  }
}

function deviceType() {
  if (!matchMedia('(pointer: coarse)').matches) return 'desktop'
  return Math.min(screen.width, screen.height) < 600 ? 'phone' : 'tablet'
}

function operatingSystem() {
  const platform = (navigator.userAgentData?.platform || navigator.platform || '').toLowerCase()
  const agent = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(agent) || (platform === 'macintel' && navigator.maxTouchPoints > 1)) return 'ios'
  if (agent.includes('android')) return 'android'
  if (platform.includes('mac')) return 'mac'
  if (platform.includes('win')) return 'windows'
  if (platform.includes('linux')) return 'linux'
  return 'other'
}
