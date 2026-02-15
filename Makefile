.PHONY: all test lint validate check-secrets check-links setup-hooks help clean install-deps

# Default target - run all checks
all: lint validate check-secrets check-links

# Quick test for pre-commit
test: lint check-secrets

# Install dependencies
install-deps:
	@echo "🔧 Installing dependencies..."
	@which shellcheck >/dev/null || (echo "Installing shellcheck..." && sudo apt-get install -y shellcheck)
	@which chezmoi >/dev/null || (echo "Installing chezmoi..." && sh -c "$$(curl -fsLS get.chezmoi.io)")
	@which gitleaks >/dev/null || (echo "Installing gitleaks..." && ./.github/scripts/install-gitleaks.sh)
	@echo "✅ Dependencies installed"

# Shell script linting
lint:
	@echo "🔍 Linting shell scripts..."
	@find home -name "*.sh.tmpl" -o -name "*.sh" | \
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
	@echo "  make test          - Quick tests (lint + secrets)"
	@echo "  make all           - Run all checks"
	@echo "  make lint          - Shellcheck bash scripts"
	@echo "  make validate      - Validate chezmoi templates"
	@echo "  make check-secrets - Scan for secrets (gitleaks)"
	@echo "  make check-links   - Verify documentation links"
	@echo "  make setup-hooks   - Install git pre-commit hooks"
	@echo "  make clean         - Clean test artifacts"
