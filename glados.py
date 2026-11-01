import requests, json, os, sys

# Cookies come from the repository secret GLADOS_COOKIE; multiple accounts are joined with '&'.
# Optional: PUSHPLUS_TOKEN (http://www.pushplus.plus) for push notifications.
if __name__ == '__main__':
    sckey = os.environ.get("PUSHPLUS_TOKEN", "")
    cookies = [c.strip() for c in os.environ.get("GLADOS_COOKIE", "").split("&") if c.strip()]
    if not cookies:
        print("GLADOS_COOKIE is empty: set the repository secret GLADOS_COOKIE (Settings -> Secrets and variables -> Actions).")
        sys.exit(1)

    url = "https://glados.cloud/api/user/checkin"
    url2 = "https://glados.cloud/api/user/status"
    referer = 'https://glados.cloud/console/checkin'
    origin = "https://glados.cloud"
    useragent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
    payload = {'token': 'glados.cloud'}

    send_content = ''
    failed = False
    for i, cookie in enumerate(cookies):
        headers = {'cookie': cookie, 'referer': referer, 'origin': origin, 'user-agent': useragent}
        state = requests.get(url2, headers=headers, timeout=30).json()
        if 'data' not in state:
            msg = f"account #{i}: cookie rejected (code={state.get('code')}, message={state.get('message')}); log in again and update GLADOS_COOKIE"
            print(msg)
            send_content += msg + '\n'
            failed = True
            continue
        email = state['data']['email']
        checkin = requests.post(url, headers={**headers, 'content-type': 'application/json;charset=UTF-8'},
                                data=json.dumps(payload), timeout=30).json()
        state = requests.get(url2, headers=headers, timeout=30).json()
        left = str(state['data']['leftDays']).split('.')[0]
        mess = checkin.get('message', json.dumps(checkin, ensure_ascii=False))
        line = f"{email}----结果--{mess}----剩余({left})天"
        print(line)
        # Only "Checkin! Got N Points" / "Checkin Repeats! ..." mean the check-in went through.
        if not str(mess).startswith('Checkin'):
            print(f"account #{i}: check-in NOT accepted by GLaDOS: {mess}")
            failed = True
        send_content += line + '\n'

    if sckey:
        requests.get('http://www.pushplus.plus/send', params={'token': sckey, 'title': 'GLaDOS 签到', 'content': send_content}, timeout=30)
    if failed:
        sys.exit(1)
