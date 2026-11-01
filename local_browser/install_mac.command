#!/bin/bash
# Double-click this file in Finder. It installs a daily job (10:00, catches up after sleep)
# that opens the GLaDOS check-in page in Google Chrome in the background and closes the tab after 30 s.
set -euo pipefail
LABEL=com.yerfor.glados-checkin
SCPT="$HOME/Library/Scripts/glados_checkin.applescript"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$HOME/Library/Scripts" "$HOME/Library/LaunchAgents"
cat > "$SCPT" <<'APPLESCRIPT'
tell application "Google Chrome"
	if (count of windows) = 0 then make new window
	set t to make new tab at end of tabs of window 1 with properties {URL:"https://glados.cloud/console/checkin"}
	delay 30
	try
		close t
	end try
end tell
APPLESCRIPT
cat > "$PLIST" <<PLISTEOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/usr/bin/osascript</string><string>$SCPT</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>10</integer><key>Minute</key><integer>0</integer></dict>
</dict></plist>
PLISTEOF
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "Installed. Running once now to test (Chrome will open the check-in page)..."
/usr/bin/osascript "$SCPT"
echo "Done. You can close this window."
