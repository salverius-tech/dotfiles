# dotfiles

Cross-platform dotfiles managed with [chezmoi](https://chezmoi.io).

## Supported Platforms

| OS | Package Managers |
|----|------------------|
| Linux | apt, apk, dnf, pacman, zypper, nix |
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

```powershell
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

### OpenCode Setup

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
- **OpenCode** - AI coding assistant for terminal-based development

### Packages Installed

| Package | Purpose |
|---------|---------|
| Starship | Cross-shell prompt |
| JetBrains Mono Nerd Font | Terminal font with icons |
| fontconfig | Font management (Linux) |
| OpenCode | AI coding assistant |
| Bun | JavaScript runtime (Windows, required for OpenCode) |

## Windows Setup

### Windows Terminal
Custom configuration with:
- PowerShell as default profile with Starship prompt
- WSL profile (Ubuntu/Debian) for Linux workflows
- Orange/Blue color scheme matching Starship theme
- Acrylic background with 80% opacity
- Custom key bindings (Ctrl+Shift+T for new tab, etc.)

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

## NixOS

The `nix/` directory contains standalone NixOS configurations. These are not managed by chezmoi and should be applied separately using NixOS tools.

## License

See [LICENSE](LICENSE) for details.