#!/usr/bin/env python3
"""
Session history tracking for Claude Code.
Logs session data to JSONL for analytics and meta-learning.
Hook runs on SessionStop event.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

def get_history_dir():
    """Get the history directory, creating if needed."""
    home = Path.home()
    history_dir = home / '.claude' / 'history'
    history_dir.mkdir(parents=True, exist_ok=True)
    return history_dir

def detect_project(context):
    """Detect project name from context or current directory."""
    # Try to get from context
    if isinstance(context, dict):
        project = context.get('project') or context.get('projectName')
        if project:
            return project
    
    # Fallback: detect from git or directory
    cwd = os.getcwd()
    
    # Check for git repository
    try:
        import subprocess
        result = subprocess.run(
            ['git', 'rev-parse', '--show-toplevel'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            git_root = result.stdout.strip()
            return os.path.basename(git_root)
    except:
        pass
    
    # Fallback to directory name
    return os.path.basename(cwd)

def sanitize_path(path):
    """Sanitize path for logging (remove home directory for privacy)."""
    home = str(Path.home())
    if path.startswith(home):
        return path.replace(home, '~', 1)
    return path

def log_session(session_data):
    """Log session data to JSONL file."""
    history_dir = get_history_dir()
    
    # Create monthly log files
    now = datetime.now()
    log_file = history_dir / f"sessions_{now.strftime('%Y-%m')}.jsonl"
    
    # Prepare log entry
    entry = {
        'timestamp': now.isoformat(),
        'session_id': session_data.get('sessionId', 'unknown'),
        'project': detect_project(session_data.get('context', {})),
        'duration_seconds': session_data.get('duration', 0),
        'tool_usage': session_data.get('toolUsage', {}),
        'message_count': session_data.get('messageCount', 0),
        'working_directory': sanitize_path(os.getcwd()),
    }
    
    # Add optional fields if present
    if 'exitCode' in session_data:
        entry['exit_code'] = session_data['exitCode']
    
    if 'error' in session_data:
        entry['error'] = session_data['error']
    
    # Append to log file
    with open(log_file, 'a', encoding='utf-8') as f:
        f.write(json.dumps(entry) + '\n')
    
    return log_file

def generate_summary():
    """Generate session summary for display."""
    history_dir = get_history_dir()
    now = datetime.now()
    log_file = history_dir / f"sessions_{now.strftime('%Y-%m')}.jsonl"
    
    if not log_file.exists():
        return None
    
    # Count sessions this month
    session_count = 0
    total_duration = 0
    projects = set()
    
    with open(log_file, 'r', encoding='utf-8') as f:
        for line in f:
            try:
                entry = json.loads(line.strip())
                session_count += 1
                total_duration += entry.get('duration_seconds', 0)
                projects.add(entry.get('project', 'unknown'))
            except:
                continue
    
    return {
        'month': now.strftime('%Y-%m'),
        'session_count': session_count,
        'total_duration_hours': round(total_duration / 3600, 2),
        'unique_projects': len(projects),
        'projects': list(projects)[:5]  # Show first 5
    }

def main():
    """Main entry point for session history hook."""
    try:
        # Read session data from stdin
        input_data = sys.stdin.read()
        
        if not input_data.strip():
            # No data provided, just generate summary
            summary = generate_summary()
            if summary:
                print(f"Session History Summary ({summary['month']}):")
                print(f"  Sessions: {summary['session_count']}")
                print(f"  Total time: {summary['total_duration_hours']} hours")
                print(f"  Projects: {summary['unique_projects']}")
            else:
                print("No session history available yet.")
            return
        
        session_data = json.loads(input_data)
        
        # Log the session
        log_file = log_session(session_data)
        
        # Generate and display summary
        summary = generate_summary()
        
        print(f"Session logged to: {log_file}")
        if summary:
            print(f"\nMonthly Stats ({summary['month']}):")
            print(f"  Total sessions: {summary['session_count']}")
            print(f"  Time spent: {summary['total_duration_hours']} hours")
            print(f"  Active projects: {summary['unique_projects']}")
            if summary['projects']:
                print(f"  Recent: {', '.join(summary['projects'])}")
        
    except json.JSONDecodeError as e:
        print(f"Error parsing session data: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Session history error: {e}", file=sys.stderr)
        # Don't fail on logging errors
        sys.exit(0)

if __name__ == '__main__':
    main()
