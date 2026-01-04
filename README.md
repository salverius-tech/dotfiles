# dotfiles

Cross-platform dotfiles managed with [chezmoi](https://chezmoi.io).

## Supported Platforms

| OS | Package Managers |
|----|------------------|
| Linux | apt, apk, dnf, pacman, zypper, nix |
| macOS | Homebrew |
| Windows | winget |

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

## What's Included

- **Bash configuration** - Custom prompt, aliases, completion
- **Starship prompt** - Cross-platform prompt with git integration
- **Git configuration** - Aliases, auto-rebase, credential helpers
- **PowerShell profile** - Windows-equivalent aliases and Starship

## Updating

```bash
chezmoi update
```

## Manual Changes

Edit files in `~/.local/share/chezmoi/` then apply:

```bash
chezmoi apply
```

Or edit and apply in one step:

```bash
chezmoi edit ~/.bashrc --apply
```