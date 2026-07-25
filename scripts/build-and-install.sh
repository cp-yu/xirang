#!/usr/bin/env bash
set -euo pipefail

PACKAGE_NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
TARBALL="${PACKAGE_NAME}-${VERSION}.tgz"

cleanup() {
  rm -f "${TARBALL}"
}
trap cleanup EXIT

echo "🔨 Building Xirang v${VERSION}..."
echo

pnpm run likec4:install
pnpm run likec4:build
pnpm run build

echo
echo "📦 Creating package tarball..."
pnpm pack --out "${TARBALL}"

echo
echo "🌍 Installing globally..."
npm install -g "./${TARBALL}"

INSTALL_DIR="$(npm root -g)/${PACKAGE_NAME}"
LIKEC4_RUNTIME="${INSTALL_DIR}/likec4/packages/likec4"
rm -rf "${INSTALL_DIR}/likec4"
# Skip husky prepare during deploy: the deploy target has no .git, and
# likec4's prepare script would otherwise print ".git can't be found".
CI=true pnpm --dir likec4 --filter xirang-likec4 deploy --legacy --prod "${LIKEC4_RUNTIME}"

echo
echo "🔍 Verifying installation..."
node "${LIKEC4_RUNTIME}/bin/likec4.mjs" --help >/dev/null
xirang --version

echo
echo "✅ Build and install completed!"
echo "   Version: ${VERSION}"
echo "   Package: ${PACKAGE_NAME}"
