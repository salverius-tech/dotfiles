# dotfiles

Cross-platform dotfiles managed with [chezmoi](https://chezmoi.io).

## Supported Platforms

| OS | Package Managers |
|----|------------------|
| Linux | apt, apk, dnf, pacman, zypper |
| macOS | Homebrew |
| Windows | winget |

## Prerequisites

- `curl` (Linux/macOS) or `winget` (Windows)
- `git`

## Installation

### Linux / macOS

```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply salverius-tech/dotfiles
```

### Windows (PowerShell)

**Note:** Installation requires Administrator privileges for package installation.

```powershell
# Run PowerShell as Administrator, then:
winget install twpayne.chezmoi
chezmoi init --apply salverius-tech/dotfiles
```

### CI/CD / Automated Setup

Set environment variable before running to customize git configuration:

```bash
export CHEZMOI_GIT_NAME="salverius"
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply salverius-tech/dotfiles
```

This sets git user to `salverius` with email `salverius@users.noreply.github.com`.

### AI Coding Tools Setup

Pi and OpenCode are automatically installed during setup when their prerequisites are available.

**Pi coding agent:**
- Installed via `npm install -g @earendil-works/pi-coding-agent`
- Global config managed at `~/.pi/agent/`
- Uses Git Bash on native Windows (`C:\\Program Files\\Git\\bin\\bash.exe`)
- Run `pi` to start, `pi -c` to continue, or `pi -r` to resume a prior session

OpenCode is automatically installed during setup:

- **Linux/macOS**: Installed via official install script (uses Homebrew on macOS if available)
- **Windows**: Bun is installed first, then opencode via `bun add -g opencode-ai`

**Requirements:**
- Windows: Requires Windows 10 version 1809 or newer for Bun installation
- All platforms: Run `opencode` to start the AI assistant, then use `/connect` to authenticate with your AI provider

## What's Included

- **Bash configuration** - Custom prompt, aliases, completion
- **Zsh configuration** - Same features as bash, with kubectl/helm completions
- **Starship prompt** - Cross-platform prompt with git integration
- **Git configuration** - Aliases, auto-rebase, OS-specific credential helpers
- **Global gitignore** - Common patterns (.DS_Store, node_modules/, etc.)
- **PowerShell profile** - Windows-equivalent aliases and Starship
- **Pi** - Extensible terminal coding agent with managed global settings, prompts, skills, and extensions
- **OpenCode** - AI coding assistant for terminal-based development

### Packages Installed

| Package | Purpose |
|---------|---------|
| Starship | Cross-shell prompt |
| JetBrains Mono Nerd Font | Terminal font with icons |
| fontconfig | Font management (Linux) |
| Pi | Extensible terminal coding agent |
| OpenCode | AI coding assistant |
| Node.js/npm | JavaScript runtime and package manager (required for Pi) |
| Git for Windows | Provides Git Bash for Pi on native Windows |
| Bun | JavaScript runtime (Windows, required for OpenCode) |

## Windows Setup

### Windows Terminal
Custom configuration with:
- PowerShell 7 as default profile with Starship prompt
- Windows PowerShell fallback profile
- Git Bash profile for Pi/native bash workflows
- WSL profile (Ubuntu/Debian) for Linux workflows
- Orange/Blue color scheme matching Starship theme
- Acrylic background with 80% opacity
- Custom key bindings (Ctrl+Shift+T for new tab, etc.)
- Alt+Enter unbound so Pi can use it for follow-up messages

### VS Code Integration
- Integrated terminal uses PowerShell with Starship
- JetBrains Mono Nerd Font for editor and terminal
- Auto-save after 1 second delay
- Format on save enabled (Prettier default formatter)
- Word wrap at 120 columns with rulers at 80/120
- GitLens current line blame enabled
- Docker explorer panel enabled
- Custom key bindings for terminal operations

### Docker Desktop (4GB RAM)
- Configured for 4GB memory limit
- 4 CPUs allocated
- BuildKit enabled for faster builds
- Auto garbage collection enabled (20GB limit)

### WSL2 Configuration
- 4GB RAM, 4 CPUs allocated
- Localhost forwarding enabled
- Separate environment from Windows dotfiles
- VM never times out

### PowerShell Profile Enhancements
- PSReadline with predictive IntelliSense (fish-style suggestions)
- Cross-platform commands: `which`, `pbcopy`, `pbpaste`, `touch`, `open`
- Smart `cd` command with history (`cd -` returns to previous)
- Docker status indicator in prompt when Starship unavailable
- SSH agent auto-start with Windows OpenSSH service

## Updating

```bash
chezmoi update
```

## Customization

Edit source files and re-apply:

```bash
chezmoi edit ~/.bashrc --apply
```

Or edit directly in the source directory:

```bash
cd ~/.local/share/chezmoi
# make changes
chezmoi apply
```

## Quick Start

After installation, use these common chezmoi commands:

```bash
# Edit a dotfile and apply changes immediately
chezmoi edit ~/.bashrc --apply

# See what changes would be applied (dry run)
chezmoi diff

# Apply all pending changes
chezmoi apply

# Update from remote repository
chezmoi update

# Check chezmoi configuration
chezmoi doctor
```

## Testing

To validate changes before submitting:
```bash
make test    # Run quick tests
make all     # Run full test suite
```

See [CLAUDE.md](CLAUDE.md) for detailed testing information.

## Pi Coding Agent Configuration

Managed Pi files are installed under `~/.pi/agent/`:

- `AGENTS.md` - Global Pi instructions that bridge into `~/.agents`
- `settings.json` - Model/thinking/skills/prompts/extensions settings
- `models.json` - Local/proxy provider definitions without embedded secrets
- `keybindings.json` - Cross-platform keybinding overrides
- `prompts/` - Prompt templates such as `/commit`, `/pickup`, and `/snapshot`
- `extensions/` - Safety and workflow extensions such as damage-control checks

The unified agent system under `~/.agents/` includes a Pi adapter at `~/.agents/adapters/pi/`.

### CI/CD
- **Validate**: Runs on every PR
- **Integration**: Full tests on Linux and Windows (main branch + weekly)
- **Discord notifications**: Rich embed notifications for all CI events

## Developer Documentation

For detailed architecture information, contributing guidelines, and development workflows, see [CLAUDE.md](CLAUDE.md).

## License

See [LICENSE](LICENSE) for details.