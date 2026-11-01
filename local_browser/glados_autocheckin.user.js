// ==UserScript==
// @name         GLaDOS auto check-in
// @namespace    https://github.com/yerfor/GLaDOS_checkin_auto
// @version      1.1
// @description  Once a day, on the first page you open in Chrome, check in to GLaDOS in the background using this browser's own login.
// @match        *://*/*
// @noframes
// @connect      glados.cloud
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, local time
  if (GM_getValue('lastDone', '') === today) return;
  // Avoid several tabs firing at the same moment.
  const lock = GM_getValue('lockUntil', 0);
  if (Date.now() < lock) return;
  GM_setValue('lockUntil', Date.now() + 60 * 1000);

  const notify = (title, text) => GM_notification({ title, text, timeout: 15000 });

  GM_xmlhttpRequest({
    method: 'POST',
    url: 'https://glados.cloud/api/user/checkin',
    headers: { 'Content-Type': 'application/json;charset=UTF-8' },
    data: JSON.stringify({ token: 'glados.cloud' }),
    anonymous: false, // send this browser's glados.cloud login cookies
    timeout: 30000,
    onload: (r) => {
      let data;
      try { data = JSON.parse(r.responseText); } catch (e) {
        notify('GLaDOS 签到出错', `HTTP ${r.status}: ${String(r.responseText).slice(0, 120)}`);
        return;
      }
      const msg = String(data.message || JSON.stringify(data));
      if (data.code === 4 && data.reason === 'device-mismatch') {
        notify('GLaDOS 签到失败', '登录设备不匹配，请在这个 Chrome 里重新登录 GLaDOS');
      } else if (msg.startsWith('Checkin')) { // "Checkin! Got N Points" or "Checkin Repeats! ..."
        GM_setValue('lastDone', today);
        notify('GLaDOS 签到成功', msg);
      } else {
        notify('GLaDOS 签到失败', msg);
      }
    },
    onerror: (e) => notify('GLaDOS 签到出错', '网络错误：' + (e && e.error || 'unknown')),
    ontimeout: () => notify('GLaDOS 签到出错', '请求超时'),
  });
})();
