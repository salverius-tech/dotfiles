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
      style = "#4863A0";
      format = "[](fg:black bg:$style)[ $symbol$branch](fg:black bg:$style)[](fg:$style)";
    };
    
    git_commit = {
      only_detached = true;
      style = "#4863A0";
      format = "\b[ ](bg:$style)[\\($hash$tag\\)](fg:black bg:$style)[](fg:$style)";
    };
    
    git_state = {
      style = "#4863A0";
      format = "\b[ ](bg:$style)[ \\($state( $progress_current/$progress_total)\\)](fg:black bg:$style)[](fg:$style)";
    };
    
    git_status = {
        style = "#4863A0";
        format = "(\b[ ](bg:$style fg:black)$conflicted$staged$modified$renamed$deleted$untracked$stashed$ahead_behind$up_to_date[](fg:$style))";
        conflicted = "[ $count ](fg:#FF79C6 bg:#4863A0)";
        staged = "[● $count ](fg:#50FA7B bg:#4863A0)";
        modified = "[✚ $count ](fg:#FFB86C bg:#4863A0)";
        renamed = "[➜ $count ](fg:#8BE9FD bg:#4863A0)";
        deleted = "[✖ $count ](fg:#FF5555 bg:#4863A0)";
        untracked = "[… $count ](fg:#6272A4 bg:#4863A0)";
        stashed = "[ $count ](fg:#F1FA8C bg:#4863A0)";
        ahead = "[⇡ $count ](fg:cyan bg:#4863A0)";
        behind = "[⇣ $count ](fg:#FF6E6E bg:#4863A0)";
        diverged = "[⇕ ](fg:magenta bg:#4863A0)[⇡ $ahead_count ](fg:cyan bg:#4863A0)[⇣ $behind_count ](fg:#FF6E6E bg:#4863A0)";
        up_to_date = "[✔ ](fg:#98C379 bg:#4863A0)";
    };    

    hostname = {
      style = "#0370C0";
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