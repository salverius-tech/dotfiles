.PHONY: all test lint validate check-secrets check-links setup-hooks help clean install-deps doctor

# Default target - run all checks
all: lint validate check-secrets check-links

# Quick test for pre-commit
test: lint check-secrets

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
		Darwin*) \
			command -v brew >/dev/null && brew install shellcheck gitleaks chezmoi || true ;; \
		MINGW*|MSYS*|CYGWIN*|Windows*) \
			command -v winget >/dev/null && winget install --id koalaman.shellcheck -e --accept-source-agreements --accept-package-agreements || true; \
			command -v winget >/dev/null && winget install --id twpayne.chezmoi -e --accept-source-agreements --accept-package-agreements || true ;; \
	esac
	@which chezmoi >/dev/null || (echo "Installing chezmoi..." && sh -c "$$(curl -fsLS get.chezmoi.io)")
	@which gitleaks >/dev/null || (echo "Installing gitleaks..." && ./.github/scripts/install-gitleaks.sh)
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
	@find home \( -name "*.sh.tmpl" -o -name "*.sh" \) | \
		grep -v "home/dot_claude/tools" | \
		xargs -I {} shellcheck -x {}
	@echo "✅ Shell scripts passed linting"

# Validate chezmoi templates
validate:
	@echo "🔍 Validating chezmoi templates..."
	@.github/scripts/validate-templates.sh
	@echo "✅ Templates validated"

# Check for secrets using gitleaks
check-secrets:
	@echo "🔍 Scanning for secrets..."
	@gitleaks detect --source . --verbose --redact
	@echo "✅ No secrets detected"

# Check documentation links
check-links:
	@echo "🔍 Checking documentation links..."
	@.github/scripts/check-links.sh
	@echo "✅ Documentation links valid"

# Install pre-commit hooks
setup-hooks:
	@echo "🔧 Installing pre-commit hooks..."
	@cp .github/scripts/pre-commit .git/hooks/pre-commit
	@chmod +x .git/hooks/pre-commit
	@echo "✅ Pre-commit hooks installed"

# Clean up test artifacts
clean:
	@rm -rf .tmp/ test-results/

help:
	@echo "Available targets:"
	@echo "  make install-deps  - Install required dependencies"
	@echo "  make doctor        - Check local toolchain"
	@echo "  make test          - Quick tests (lint + secrets)"
	@echo "  make all           - Run all checks"
	@echo "  make lint          - Shellcheck bash scripts"
	@echo "  make validate      - Validate chezmoi templates"
	@echo "  make check-secrets - Scan for secrets (gitleaks)"
	@echo "  make check-links   - Verify documentation links"
	@echo "  make setup-hooks   - Install git pre-commit hooks"
	@echo "  make clean         - Clean test artifacts"
