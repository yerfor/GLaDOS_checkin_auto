// ==UserScript==
// @name         GLaDOS auto check-in
// @namespace    https://github.com/yerfor/GLaDOS_checkin_auto
// @version      1.2
// @description  Once a day, on the first page you open in Chrome, check in to GLaDOS in the background using this browser's own login.
// @match        *://*/*
// @noframes
// @connect      glados.cloud
// @grant        GM_xmlhttpRequest
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, local time
  const notify = (title, text) => GM_notification({ title, text, timeout: 15000 });

  // Manual test from the Tampermonkey menu: always sends one request and shows the raw reply.
  GM_registerMenuCommand('立即测试签到', () => checkin(true));

  if (GM_getValue('lastDone', '') === today) return;
  // Avoid several tabs firing at the same moment.
  const lock = GM_getValue('lockUntil', 0);
  if (Date.now() < lock) return;
  GM_setValue('lockUntil', Date.now() + 60 * 1000);
  checkin(false);

  function checkin(isTest) {
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
      if (isTest) alert('GLaDOS 测试结果（原始回复）：\n\n' + JSON.stringify(data, null, 2).slice(0, 800));
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
  }
})();
