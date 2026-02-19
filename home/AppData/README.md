# Windows Terminal Configuration

This directory contains Windows Terminal settings managed by chezmoi.

## Structure

- `Local/Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json.tmpl` - Main Windows Terminal settings
- `Local/Microsoft/Windows Terminal/Fragments/dotfiles/settings.json` - Fragment-based settings overlay

## Configuration Approach

### Main Settings (`settings.json.tmpl`)

The main settings file defines:
- **Profile defaults**: Applied to all profiles automatically
- **Color schemes**: Custom StarshipTheme color scheme
- **Keybindings**: Consistent keyboard shortcuts
- **Global settings**: Window behavior, copy/paste options

**Important**: This file does NOT include a hardcoded profile list. Windows Terminal will automatically discover and generate profiles for:
- Installed PowerShell versions (PowerShell Core, Windows PowerShell)
- WSL distributions (Ubuntu, Kali, etc.)
- Command Prompt
- Azure Cloud Shell
- Other installed shells

### Fragment Settings

The fragment file in `Local/Microsoft/Windows Terminal/Fragments/dotfiles/` uses the same profile defaults to ensure consistency. Fragments are merged with the main settings by Windows Terminal.

## Why This Approach?

Previous versions hardcoded specific profile GUIDs and WSL distribution names (Ubuntu 22.04, Kali Linux, etc.). This caused errors when:
- The user didn't have those specific WSL distributions installed
- Profile GUIDs differed between systems
- PowerShell Core wasn't installed

**Solution**: Let Windows Terminal auto-discover profiles, then apply our styling via defaults. This ensures:
1. ✅ No errors about missing profiles
2. ✅ All profiles get the same styling automatically
3. ✅ New profiles (like new WSL distros) automatically inherit the theme
4. ✅ Works on any Windows system regardless of installed software

## Customization

To customize specific profiles after applying these dotfiles:
1. Open Windows Terminal settings UI (`Ctrl+,`)
2. Select the profile you want to customize
3. Make changes (they'll be saved to your personal settings, separate from these dotfiles)

Or manually edit the fragment file to add profile-specific overrides using the "updates" field with the profile's GUID.
