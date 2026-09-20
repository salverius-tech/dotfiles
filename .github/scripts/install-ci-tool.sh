#!/usr/bin/env bash
# Install a pinned release into an explicit, user-writable directory.
set -euo pipefail

tool=${1:?Usage: install-ci-tool.sh TOOL [DIRECTORY]}
destination=${2:-"$HOME/.local/bin"}
case "$tool" in
    chezmoi) repo=twpayne/chezmoi; version=2.69.1 ;;
    gitleaks) repo=gitleaks/gitleaks; version=8.30.1 ;;
    actionlint) repo=rhysd/actionlint; version=1.7.12 ;;
    *) echo "Unsupported tool: $tool" >&2; exit 2 ;;
esac
case "$(uname -s)" in
    Linux*) os=linux ;;
    Darwin*) os=darwin ;;
    MINGW*|MSYS*|CYGWIN*) os=windows ;;
    *) echo 'Unsupported operating system' >&2; exit 2 ;;
esac
case "$(uname -m)" in
    x86_64|amd64) arch=amd64 ;;
    arm64|aarch64) arch=arm64 ;;
    *) echo 'Unsupported architecture' >&2; exit 2 ;;
esac
if [[ "$tool" == gitleaks && "$arch" == amd64 ]]; then arch=x64; fi
extension=tar.gz
binary=$tool
if [[ "$os" == windows ]]; then extension=zip; binary="$tool.exe"; fi
archive="${tool}_${version}_${os}_${arch}.${extension}"
base="https://github.com/$repo/releases/download/v$version"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl --fail --silent --show-error --location --retry 3 "$base/$archive" -o "$tmp/$archive"
curl --fail --silent --show-error --location --retry 3 \
    "$base/${tool}_${version}_checksums.txt" -o "$tmp/checksums.txt"
(
    cd "$tmp"
    awk -v file="$archive" '$2 == file { print; found=1 } END { if (!found) exit 1 }' \
        checksums.txt > selected-checksum.txt
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum --check selected-checksum.txt
    else
        shasum -a 256 --check selected-checksum.txt
    fi
    if [[ "$extension" == zip ]]; then
        unzip -q "$archive" "$binary"
    else
        tar -xzf "$archive" "$binary"
    fi
)
mkdir -p "$destination"
cp "$tmp/$binary" "$destination/$binary"
chmod +x "$destination/$binary"
echo "Installed $tool $version in $destination"
