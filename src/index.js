// Είσοδος του widget: <div id="poulia4-world-aviary"></div> + <script src=".../poulia4-world-aviary-v1.js"></script>
import { mount } from './ui.js'

;(function () {
  const user = window.P4_WORLD_AVIARY || {}
  const script = document.currentScript
  const cfg = {
    blogUrl: (user.blogUrl || 'https://poulia4.blogspot.com').replace(/\/+$/, ''),
    apiBase: (user.apiBase || 'https://poulia4-bird-identifier-wizard.eliasziak.workers.dev').replace(/\/+$/, ''),
    extraGenera: user.extraGenera || [], autoRotate: !!user.autoRotate
  }
  const make = () => {
    let host = user.mount ? (typeof user.mount === 'string' ? document.querySelector(user.mount) : user.mount) : null
    host = host || document.getElementById('poulia4-world-aviary')
    if (!host) { host = document.createElement('div'); if (script && script.parentNode) script.parentNode.insertBefore(host, script); else document.body.append(host) }
    if (host.hasAttribute('data-p4wa-root')) return
    window.Poulia4WorldAviary = mount(host, cfg)
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', make); else make()
})()
