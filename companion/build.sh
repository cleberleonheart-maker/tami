#!/bin/sh
# Empacota o TAMI Companion como binário standalone (sem precisar de Node instalado).
# Requer: npm (usa npx @yao-pkg/pkg). Gera tami-companion-linux e tami-companion-win.exe
set -e
cd "$(dirname "$0")"

echo "==> Instalando @yao-pkg/pkg (se necessário)..."
npx --yes @yao-pkg/pkg@latest --version >/dev/null 2>&1 || { echo "Falha ao obter pkg"; exit 1; }

echo "==> Compilando binários..."
npx --yes @yao-pkg/pkg@latest server.js --config ./package.json --output ./dist/tami-companion

echo "==> Pronto."
ls -lh ./dist/ 2>/dev/null || true