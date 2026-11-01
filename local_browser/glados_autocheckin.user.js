// ==UserScript==
// @name         GLaDOS auto check-in
// @namespace    https://github.com/yerfor/GLaDOS_checkin_auto
// @version      1.0
// @description  Check in once a day from your own signed-in browser (same request as clicking the button).
// @match        https://glados.cloud/*
// @grant        GM_notification
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// ==/UserScript==

(async function () {
  'use strict';
  const today = new Date().toLocaleDateString('sv-SE'); // YYYY-MM-DD, local time
  if (GM_getValue('lastDone', '') === today) return;

  const notify = (title, text) => GM_notification({ title, text, timeout: 15000 });
  try {
    const resp = await fetch('/api/user/checkin', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json;charset=UTF-8' },
      body: JSON.stringify({ token: location.hostname }),
    });
    const data = await resp.json();
    const msg = String(data.message || JSON.stringify(data));
    if (data.code === 4 && data.reason === 'device-mismatch') {
      notify('GLaDOS 签到失败', '登录设备不匹配，请在这个浏览器里重新登录 GLaDOS');
      return;
    }
    if (msg.startsWith('Checkin')) {          // "Checkin! Got N Points" or "Checkin Repeats! ..."
      GM_setValue('lastDone', today);
      notify('GLaDOS 签到成功', msg);
    } else {
      notify('GLaDOS 签到失败', msg);
    }
  } catch (e) {
    notify('GLaDOS 签到出错', String(e));
  }
})();
