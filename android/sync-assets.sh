#!/usr/bin/env sh
# Copia o PWA (arquivos da raiz do repo) para dentro dos assets do APK.
set -e
cd "$(dirname "$0")"
mkdir -p app/src/main/assets
cp ../index.html ../manifest.json ../sw.js ../icon.svg ../version app/src/main/assets/
echo "Assets sincronizados em app/src/main/assets/"
