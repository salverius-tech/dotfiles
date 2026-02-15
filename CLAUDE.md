# Dotfiles Repository

Cross-platform dotfiles managed with [chezmoi](https://chezmoi.io).

## Repository Overview

This repository manages shell configurations, development tools, and Claude Code customizations across Linux, macOS, and Windows environments.

### Key Structure

```
.
├── home/                          # Source directory (chezmoi root)
│   ├── .chezmoi.toml.tmpl         # Template configuration with OS detection
│   ├── .chezmoiignore             # Platform-specific ignore rules
│   ├── run_once_*.sh.tmpl         # One-time setup scripts
│   ├── .chezmoiscripts/           # Platform-specific scripts
│   │   └── windows/
│   ├── dot_*                      # Dotfiles (renamed from .prefix)
│   ├── private_dot_*              # Private dotfiles (permissions 600)
│   └── dot_claude/                # Claude Code configuration
│       ├── CLAUDE.md              # Personal Claude ruleset
│       ├── commands/              # Custom slash commands
│       ├── skills/                # Auto-activating skills
│       └── agents/                # Specialized agent definitions
└── README.md                      # User-facing documentation
```

### Architecture Patterns

**Template System:**
- All chezmoi-managed files use `.tmpl` extension
- Left/right delimiters: `# {{` and `}}` (for shell script compatibility)
- Data variables defined in `.chezmoi.toml.tmpl`:
  - `osid`: OS identifier (e.g., `linux-ubuntu`, `darwin`, `windows`)
  - `package_manager`: Detected package manager
  - `is_wsl`: Boolean for WSL detection
  - `git_name`, `git_email`: Git configuration

**Platform-Specific Logic:**
```bash
# {{ if eq .chezmoi.os "windows" }}
# Windows-specific configuration
# {{ else if eq .chezmoi.os "darwin" }}
# macOS-specific configuration
# {{ else }}
# Linux configuration
# {{ end }}
```

**Installation Scripts:**
- `run_once_before_*`: Run before file deployment (package installation)
- `run_once_after_*`: Run after file deployment (configuration)
- Scripts are idempotent - check for existing installations before proceeding

## Working with This Repository

### Adding New Dotfiles

1. Create file in `home/` with appropriate prefix:
   - `dot_filename` → `~/.filename`
   - `private_dot_filename` → `~/.filename` (mode 0600)
   - `dot_config/app/` → `~/.config/app/`

2. If platform-specific, wrap in template conditionals

3. Test with `chezmoi apply` before committing

### Adding Package Installations

Edit the appropriate script based on OS:
- Linux/macOS: `home/run_once_before_install-packages.sh.tmpl`
- Windows: `home/.chezmoiscripts/windows/run_once_before_install-packages.ps1.tmpl`

**Pattern:** Check if installed, then install:
```bash
if ! command -v package &> /dev/null; then
    echo "Installing package..."
    # Installation command
else
    echo "Package already installed, skipping..."
fi
```

### Testing Changes

**Local Testing:**
```bash
# Apply changes without committing
chezmoi apply

# Apply specific file
chezmoi apply ~/.bashrc

# See what would change (dry run)
chezmoi diff
```

**Validation:**
- Ensure scripts are executable: `chmod +x run_once_*.sh.tmpl`
- Verify template syntax: `chezmoi execute-template < file.tmpl`
- Test on all target platforms (CI recommended)

## Security Guidelines

- Never commit secrets, API keys, or credentials
- Use `private_dot_*` prefix for sensitive files (SSH configs, tokens)
- Git credential helper is platform-specific (manager/windows, osxkeychain/mac, cache/linux)
- SSH keys should be generated locally, not managed by chezmoi

## Architecture Overview

```
Dotfiles Repository
├── home/                          # chezmoi source directory
│   ├── .chezmoi.toml.tmpl         # OS detection & data variables
│   ├── .chezmoiignore             # Platform-specific exclusions
│   ├── run_once_*.sh.tmpl         # One-time setup scripts
│   ├── .chezmoiscripts/windows/   # Windows-specific scripts
│   ├── dot_*                      # Regular dotfiles
│   ├── private_dot_*              # Sensitive files (mode 600)
│   └── dot_claude/                # Claude Code configuration
│       ├── CLAUDE.md              # Personal ruleset
│       ├── commands/*.md          # Slash commands (14 total)
│       ├── skills/*/SKILL.md      # Auto-activating skills
│       └── agents/*.md            # Specialized personas
└── README.md                      # User documentation
```

**Commands** (14 total): Located in `dot_claude/commands/`. Self-documenting via frontmatter.

**Skills** (auto-activate): Located in `dot_claude/skills/`. Activate based on project file patterns:
- `python-workflow` → *.py, pyproject.toml
- `web-projects` → package.json, *.jsx, *.tsx
- `container-workflow` → Dockerfile, docker-compose.yml
- `git-workflow` → .git/, *.md with git references
- etc.

**Agents**: Located in `dot_claude/agents/`. Load on demand via `/load-agent <name>`.

## Claude Code Integration

This repository includes extensive Claude Code customizations in `home/dot_claude/`:

**Commands:** Custom slash commands available in all projects
- `/commit` - Smart git commits with conventional format
- `/optimize-ruleset` - Analyze and optimize CLAUDE.md files
- `/analyze-permissions` - Review permission patterns from logs
- See `home/dot_claude/commands/README.md` for full list

**Skills:** Auto-activating context that loads based on project signals
- Located in `home/dot_claude/skills/`
- Activate automatically when relevant files detected
- Follow skill-specific patterns when modifying related code

**Agents:** Specialized personas for specific tasks
- Located in `home/dot_claude/agents/`
- Use with `/load-agent <name>` command

## Common Tasks

### Update chezmoi data configuration
Edit `home/.chezmoi.toml.tmpl` to add new data variables or modify OS detection logic.

### Add new platform support
1. Update package manager detection in `.chezmoi.toml.tmpl`
2. Add package installation logic in `run_once_before_install-packages.sh.tmpl`
3. Update `.chezmoiignore` for platform-specific exclusions

### Modify Claude Code behavior
- Personal rules: Edit `home/dot_claude/CLAUDE.md`
- New command: Create `home/dot_claude/commands/command-name.md`
- New skill: Create `home/dot_claude/skills/skill-name/SKILL.md`

## Testing

### Prerequisites
Install required tools:
```bash
make install-deps
```

### Local Testing
Run all tests locally before committing:
```bash
make test          # Quick tests (lint + secrets)
make all           # Full test suite
```

### Pre-commit Hooks
Install git hooks to run tests automatically before each commit:
```bash
make setup-hooks
```

### CI/CD
- **Validate workflow**: Runs on every PR (linting, template validation, secret scanning)
- **Integration workflow**: Runs on main branch (full installation tests on Linux and Windows)
- **Discord notifications**: Both workflows send rich embed notifications to Discord

## References

- [chezmoi Documentation](https://www.chezmoi.io/)
- [chezmoi Templating Guide](https://www.chezmoi.io/docs/templating/)
- [CLAUDE.md in dot_claude/](home/dot_claude/CLAUDE.md) - Personal Claude ruleset
