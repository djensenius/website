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
export PS1='dfj:\w\$ '
export BAT_STYLE=plain
# Page long output through less so `cat`/`bat` open a file at the top and let you
# scroll up/down (arrows, PageUp/PageDown) to read the beginning of long files.
#   -R  keep bat's colour/ANSI output
#   -F  quit immediately if the content fits on one screen (short files just print)
#   -X  don't clear the console on exit, so the file's tail stays on screen
export BAT_PAGER='less -RFX'
export PAGER='less -RFX'
alias cat='bat'
alias vi='vim'

# Put the console into UTF-8 mode and use a UTF-8 locale so multibyte characters
# in the Markdown content (em dashes, accented names, …) collapse to a single
# glyph instead of splattering as raw bytes. The VGA text console can only draw
# CP437, so exotic glyphs fall back to a best-effort character — but this stops
# the mojibake.
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
# ESC % G switches the terminal to UTF-8. Only emit it on the visible VGA console
# (/dev/console = tty0); the headless serial line (ttyS0) has no vt layer and
# would just echo the bytes as a literal "%G".
case "$(tty 2>/dev/null)" in
	/dev/tty[0-9]* | /dev/console)
		printf '\033%%G'
		command -v unicode_start >/dev/null 2>&1 && unicode_start 2>/dev/null
		;;
esac
