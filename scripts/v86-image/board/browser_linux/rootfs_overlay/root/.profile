#!/bin/ash
# Login profile for the v86 in-browser Linux (root).

clear
cat /etc/motd

# The site content is shared over 9p and mounted at /mnt by /etc/fstab. Copy it
# into the home directory so files are right here on login (no `cd /mnt` needed).
if [ -d /mnt ]; then
	cp -a /mnt/. "$HOME"/ 2>/dev/null
fi
cd "$HOME" || true

# Prompt + modern CLI aliases.
export PS1='dj:\w\$ '
export BAT_PAGING=never
export BAT_STYLE=plain
alias cat='bat'
alias vi='vim'
