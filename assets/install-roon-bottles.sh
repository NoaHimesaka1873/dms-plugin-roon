#!/bin/sh
# Set up Roon in Bottles using the official Bottles installer manifest for Roon
# (bottlesdevs/programs → Software/roon.yml: installs .NET Desktop 10, downloads
# RoonInstaller64.exe and registers the "Roon" program). Bottles only applies
# installers from its GUI, so this prepares the bottle and opens Bottles there.
# Usage: install-roon-bottles.sh [flatpak|native]
set -eu
KIND="${1:-}"
if [ -z "$KIND" ]; then
    if flatpak info com.usebottles.bottles >/dev/null 2>&1; then KIND=flatpak
    elif command -v bottles-cli >/dev/null 2>&1; then KIND=native
    else echo "Bottles is not installed" >&2; exit 1; fi
fi
if [ "$KIND" = flatpak ]; then
    cli() { flatpak run --command=bottles-cli com.usebottles.bottles "$@"; }
    gui() { flatpak run com.usebottles.bottles "$@"; }
    BOTTLES_DIR="$HOME/.var/app/com.usebottles.bottles/data/bottles/bottles"
else
    cli() { bottles-cli "$@"; }
    gui() { bottles "$@"; }
    BOTTLES_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/bottles/bottles"
fi
notify() { command -v notify-send >/dev/null 2>&1 && notify-send -a "Roon" -t 15000 "$1" "${2:-}" || true; }

if [ ! -f "$BOTTLES_DIR/Roon/bottle.yml" ]; then
    notify "Roon in Bottles" "Creating the Roon bottle…"
    cli new --bottle-name Roon --environment application
fi
notify "Roon in Bottles" "Opening Bottles. Open the Roon bottle, choose Install Programs, and pick Roon. The installer adds .NET Desktop 10 and Roon; when it finishes, press Re-detect in the DMS Roon settings."
exec gui
