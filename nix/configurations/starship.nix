{ config, lib, pkgs, ... }:
{
  programs.starship.enable = true;
  programs.starship.settings = {
    add_newline = false;
    format = "$shlvl$shell$username$hostname$nix_shell$git_branch$git_commit$git_state$git_status$directory$jobs$cmd_duration$character";
    
    aws = {
      style = "bg:#f9a600 fg:black";
      symbol = "☁ ";
      format = "[](fg:black bg:#f9a600)[$symbol$profile]($style)[](fg:#f9a600 bg:black)";
    };

    character = {
      success_symbol = "[❯](#ff9400)";
      error_symbol = "[✗](#ff4b00)";
    };
    
    cmd_duration = {
      disabled=true;
      style = "#f9a600";
      format = "[](fg:black bg:#f9a600)[祥$duration](bg:$style fg:black)[](fg:$style)";
    };
    
    directory = {
      truncation_length = 0;
      style = "#2B3856";
      truncate_to_repo = false;
      fish_style_pwd_dir_length = 1;
      format = "[](fg:black bg:$style)[$path[$read_only](bg:$style fg:black)](bg:$style fg:black)[](fg:$style)";
      read_only = " ";
    };

    docker_context = {
      style = "fg:black bg:#eb9606";
      symbol = "🐳  ";
      format = "[](fg:black bg:#eb9606)[$symbol$context]($style)[](fg:#eb9606)";
    };
    
    git_branch = {
      only_attached = true;
      # symbol = "שׂ";
      style = "#d8712c";
      format = "[](fg:black bg:$style)[ $symbol$branch](fg:black bg:$style)[](fg:$style)";
    };
    
    git_commit = {
      only_detached = true;
      style = "#d8712c";
      format = "\b[ ](bg:$style)[\\($hash$tag\\)](fg:black bg:$style)[](fg:$style)";
    };
    
    git_state = {
      style = "#d8712c";
      format = "\b[ ](bg:$style)[ \\($state( $progress_current/$progress_total)\\)](fg:black bg:$style)[](fg:$style)";
    };
    
    git_status = {
        style = "#d8712c";
        conflicted = "🏳(fg:black bg:#d8712c)";
        ahead = "🏎💨 \($ahead_count\)(fg:black bg:#d8712c)";
        behind = "😰🚌 \($behind_count\)(fg:black bg:#d8712c)";
        diverged = "😵 \($ahead_count\) \($behind_count\)(fg:black bg:#d8712c)";
        up_to_date = "✓(fg:black bg:#d8712c)";
        untracked = "🤷‍ \($untracked\)(fg:black bg:#d8712c)";
        stashed = "📦 \($stashed\)(fg:black bg:#d8712c)";
        modified = "📝 \($staged\) \($unstaged\)(fg:black bg:#d8712c)";
        deleted = "🗑 \($deleted\)(fg:black bg:#d8712c)";
        renamed = "📤 \($renamed\)(fg:black bg:#d8712c)";
        copied = "📋 \($copied\)(fg:black bg:#d8712c)";      
    };    

    hostname = {
      style = "bright-green bold";
      ssh_only = true;
    };
       
    jobs = {
      style = "bright-green bold";
    };

    nix_shell = {
      symbol = "";
      format = "[$symbol$name]($style) ";
      style = "bright-purple bold";
    };
    
    shlvl = {
      symbol = " ";
      style = "fg:black bg:#ad4007";
      format = "[](fg:black bg:#ad4007)[$symbol$shlvl]($style)[](fg:#ad4007)";
      disabled = false;
    };
    
    shell = {
      fish_indicator = "";
      bash_indicator = "bash ";
      zsh_indicator = "zsh ";
      powershell_indicator = "";
      format = "[$indicator](fg:#ad4007)";
      disabled = false;
    };
    
    time = {
      disabled = true;
      style = "#939594";
      format = "[$time]($style)";
    };

    username = {
      style_user = "#0370C0";
      style_root = "#C00311";
      format = "[](fg:black bg:$style)[$user](fg:black bg:$style)[](fg:$style)";
    };
  };
  
}