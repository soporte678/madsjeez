#!/usr/bin/env bash
# Copia iconos del PWA a las carpetas de recursos Android
set -e

ICONS_DIR="../../public/icons"
BRAND_DIR="../../public/brand"
RES_DIR="app/src/main/res"

mkdir -p "$RES_DIR/mipmap-mdpi"
mkdir -p "$RES_DIR/mipmap-hdpi"
mkdir -p "$RES_DIR/mipmap-xhdpi"
mkdir -p "$RES_DIR/mipmap-xxhdpi"
mkdir -p "$RES_DIR/mipmap-xxxhdpi"

copy_icon() {
  local src="$ICONS_DIR/icon-${1}x${1}.png"
  local dest="$RES_DIR/${2}/ic_launcher.png"
  if [ -f "$src" ]; then
    cp "$src" "$dest"
    echo "  OK $src -> $dest"
  else
    echo "  MISS $src no encontrado, usando fallback"
    cp "$BRAND_DIR/madsjeez-icon-512.png" "$dest" 2>/dev/null || echo "    Sin fallback disponible"
  fi
}

echo "Copiando iconos..."
copy_icon 48  "mipmap-mdpi"
copy_icon 72  "mipmap-hdpi"
copy_icon 96  "mipmap-xhdpi"
copy_icon 144 "mipmap-xxhdpi"
copy_icon 192 "mipmap-xxxhdpi"

echo "Iconos copiados."
