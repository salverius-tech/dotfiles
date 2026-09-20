SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c
export PATH := $(HOME)/.local/bin:$(PATH)

.PHONY: all test test-regressions test-deployment lint validate check-secrets check-history check-links setup-hooks help clean install-deps doctor

# Default target - run all checks
all: test validate test-deployment check-links

# Quick test for pre-commit
test: lint check-secrets test-regressions

test-regressions:
	@node --test .github/tests/*.test.mjs

test-deployment:
	@bash .github/scripts/validate-templates.sh --deploy

# Install dependencies
install-deps:
	@echo "🔧 Installing dependencies..."
	@case "$$(uname -s 2>/dev/null || echo Windows)" in \
		Linux*) \
			if command -v apt-get >/dev/null; then sudo apt-get update && sudo apt-get install -y shellcheck curl git; \
			elif command -v apk >/dev/null; then sudo apk add shellcheck curl git; \
			elif command -v dnf >/dev/null; then sudo dnf install -y ShellCheck curl git; \
			elif command -v pacman >/dev/null; then sudo pacman -Syu --noconfirm shellcheck curl git; \
			fi ;; \
		Darwin*) brew install shellcheck ;; \
		MINGW*|MSYS*|CYGWIN*|Windows*) \
			command -v shellcheck >/dev/null || winget install --id koalaman.shellcheck -e --accept-source-agreements --accept-package-agreements ;;  \
	esac
	@command -v chezmoi >/dev/null || bash .github/scripts/install-ci-tool.sh chezmoi
	@bash .github/scripts/install-gitleaks.sh
	@node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<22 || (a===22 && b<19)) process.exit(1)' || \
		{ echo 'Install Node.js >=22.19 for regression and documentation checks'; exit 1; }
	@for tool in shellcheck git curl chezmoi gitleaks; do command -v "$$tool" >/dev/null; done
	@echo "✅ Dependencies installed"

# Environment diagnostics
doctor:
	@echo "🔎 Checking local toolchain..."
	@for tool in git chezmoi shellcheck gitleaks bash; do \
		if command -v $$tool >/dev/null 2>&1; then echo "✅ $$tool: $$(command -v $$tool)"; else echo "❌ $$tool: missing"; fi; \
	done
	@echo "Node/npm/Pi:"
	@for tool in node npm pi opencode; do \
		if command -v $$tool >/dev/null 2>&1; then echo "✅ $$tool: $$(command -v $$tool)"; else echo "⚠️  $$tool: missing"; fi; \
	done

# Shell script linting
lint:
	@echo "🔍 Linting shell scripts..."
	@bash .github/scripts/lint.sh
	@echo "✅ Shell scripts passed linting"

# Validate chezmoi templates
validate:
	@echo "🔍 Validating chezmoi templates..."
	@bash .github/scripts/validate-templates.sh
	@echo "✅ Templates validated"

# Check for secrets using gitleaks
check-secrets:
	@echo "🔍 Scanning for secrets..."
	@gitleaks dir --redact --config .gitleaks.toml .
	@echo "✅ No secrets detected"

check-history:
	@gitleaks git --redact --config .gitleaks.toml

# Check documentation links
check-links:
	@echo "🔍 Checking documentation links..."
	@bash .github/scripts/check-links.sh
	@echo "✅ Documentation links valid"

# Install pre-commit hooks
setup-hooks:
	@echo "🔧 Installing pre-commit hooks..."
	@hook="$$(git rev-parse --git-path hooks/pre-commit)"; \
		mkdir -p "$$(dirname "$$hook")"; \
		cp .github/scripts/pre-commit "$$hook"; chmod +x "$$hook"
	@echo "✅ Pre-commit hooks installed"

# Clean up test artifacts
clean:
	@rm -rf .tmp/ test-results/

help:
	@echo "Available targets:"
	@echo "  make install-deps  - Install required dependencies"
	@echo "  make doctor        - Check local toolchain"
	@echo "  make test          - Lint, working-tree secrets, and regression tests"
	@echo "  make test-deployment - Isolated config deployment and idempotency check"
	@echo "  make check-history - Scan full Git history for secrets"
	@echo "  make all           - Run all checks"
	@echo "  make lint          - Shellcheck bash scripts"
	@echo "  make validate      - Validate chezmoi templates"
	@echo "  make check-secrets - Scan for secrets (gitleaks)"
	@echo "  make check-links   - Verify documentation links"
	@echo "  make setup-hooks   - Install git pre-commit hooks"
	@echo "  make clean         - Clean test artifacts"
