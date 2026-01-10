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

## What's Included

- **Bash configuration** - Custom prompt, aliases, completion
- **Zsh configuration** - Same features as bash, with kubectl/helm completions
- **Starship prompt** - Cross-platform prompt with git integration
- **Git configuration** - Aliases, auto-rebase, OS-specific credential helpers
- **Global gitignore** - Common patterns (.DS_Store, node_modules/, etc.)
- **PowerShell profile** - Windows-equivalent aliases and Starship

### Packages Installed

| Package | Purpose |
|---------|---------|
| Starship | Cross-shell prompt |
| JetBrains Mono Nerd Font | Terminal font with icons |
| fontconfig | Font management (Linux) |

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