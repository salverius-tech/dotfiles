#!/bin/bash
# Install gitleaks locally

VERSION="8.18.2"
OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

case $ARCH in
    x86_64) ARCH="x64" ;;
    aarch64) ARCH="arm64" ;;
esac

URL="https://github.com/gitleaks/gitleaks/releases/download/v${VERSION}/gitleaks_${VERSION}_${OS}_${ARCH}.tar.gz"

curl -sL "$URL" | tar -xz -C /tmp
sudo mv /tmp/gitleaks /usr/local/bin/
echo "✅ Gitleaks v${VERSION} installed"
