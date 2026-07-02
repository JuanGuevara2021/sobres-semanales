#!/bin/bash
# Build release AAB para Google Play
# Uso: ./build-release.sh

set -e

echo "=== Sobres Semanales — Build Release ==="
echo ""

# 1. Build web con modo publico
echo "[1/3] Building web app (VITE_APP_MODE=public)..."
VITE_APP_MODE=public npx vite build
echo "       OK"

# 2. Sync con Capacitor
echo "[2/3] Syncing with Capacitor..."
npx cap sync android
echo "       OK"

# 3. Build AAB firmado
echo "[3/3] Building signed AAB..."
cd android
./gradlew bundleRelease
cd ..

# 4. Copiar AAB
# sed en vez de grep -P: el -P falla en Git Bash de Windows segun el locale
VERSION=$(sed -n 's/.*versionName "\([^"]*\)".*/\1/p' android/app/build.gradle)
mkdir -p android/app/release
cp android/app/build/outputs/bundle/release/app-release.aab "android/app/release/sobres-semanales-v${VERSION}.aab"

echo ""
echo "=== BUILD EXITOSO ==="
echo "AAB: android/app/release/sobres-semanales-v${VERSION}.aab"
echo "Tamano: $(du -h "android/app/release/sobres-semanales-v${VERSION}.aab" | cut -f1)"
echo ""
echo "Siguiente paso: sube este archivo a Google Play Console"
