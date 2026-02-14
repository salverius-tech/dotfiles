#!/usr/bin/env python3
"""
PreToolUse hook for Bash tool damage control.
Validates potentially dangerous commands before execution.
"""

import json
import re
import sys

def check_dangerous_patterns(command):
    """Check for potentially dangerous command patterns."""
    warnings = []
    
    # Pattern definitions with severity and description
    dangerous_patterns = [
        # Destructive operations
        {
            'pattern': r'\brm\s+-rf\s+/(?!\s)',
            'severity': 'CRITICAL',
            'message': 'Detected: rm -rf / - This will delete the entire filesystem!'
        },
        {
            'pattern': r'\brm\s+.*\*\s*$',
            'severity': 'HIGH',
            'message': 'Detected: rm with wildcard - May delete more files than intended'
        },
        {
            'pattern': r'\bmkfs\.',
            'severity': 'CRITICAL',
            'message': 'Detected: mkfs command - This will format a filesystem!'
        },
        {
            'pattern': r'\bdd\s+if=',
            'severity': 'HIGH',
            'message': 'Detected: dd command - Can overwrite data irreversibly'
        },
        
        # Security risks
        {
            'pattern': r'\bwget\s+.*\|\s*bash',
            'severity': 'HIGH',
            'message': 'Detected: Piping wget output directly to bash - Security risk'
        },
        {
            'pattern': r'\bcurl\s+.*\|\s*bash',
            'severity': 'MEDIUM',
            'message': 'Detected: Piping curl output to bash - Review the source carefully'
        },
        {
            'pattern': r'\beval\s*\$',
            'severity': 'MEDIUM',
            'message': 'Detected: eval with variable - May execute arbitrary code'
        },
        
        # System modifications
        {
            'pattern': r'\bsudo\s+.*\b(chmod|chown)\s+.*(/|\.\.)',
            'severity': 'HIGH',
            'message': 'Detected: Modifying system/root permissions'
        },
        {
            'pattern': r'\bchmod\s+777\s+',
            'severity': 'MEDIUM',
            'message': 'Detected: chmod 777 - Grants full permissions to all users'
        },
        
        # Network risks
        {
            'pattern': r'\b(nc|netcat)\s+-l',
            'severity': 'MEDIUM',
            'message': 'Detected: Opening network listener with netcat'
        },
        
        # Git risks
        {
            'pattern': r'\bgit\s+push\s+.*--force',
            'severity': 'MEDIUM',
            'message': 'Detected: git push --force - May overwrite remote history'
        },
        {
            'pattern': r'\bgit\s+reset\s+.*--hard',
            'severity': 'MEDIUM',
            'message': 'Detected: git reset --hard - Destroys uncommitted changes'
        },
        {
            'pattern': r'\bgit\s+clean\s+-f',
            'severity': 'MEDIUM',
            'message': 'Detected: git clean -f - Permanently deletes untracked files'
        },
    ]
    
    for rule in dangerous_patterns:
        if re.search(rule['pattern'], command, re.IGNORECASE):
            warnings.append({
                'severity': rule['severity'],
                'message': rule['message']
            })
    
    return warnings

def validate_command(args):
    """Validate bash command arguments."""
    command = ' '.join(args) if isinstance(args, list) else str(args)
    
    warnings = check_dangerous_patterns(command)
    
    if not warnings:
        return {'allowed': True}
    
    # Check for critical warnings that should block execution
    critical = [w for w in warnings if w['severity'] == 'CRITICAL']
    high = [w for w in warnings if w['severity'] == 'HIGH']
    
    result = {
        'allowed': len(critical) == 0,  # Block only CRITICAL
        'warnings': warnings,
        'message': 'DANGEROUS COMMAND DETECTED:\n' + '\n'.join(
            f"[{w['severity']}] {w['message']}" for w in warnings
        )
    }
    
    if critical:
        result['message'] += '\n\nThis command has been BLOCKED due to CRITICAL severity.'
    elif high:
        result['message'] += '\n\nPlease confirm you understand the risks before proceeding.'
    
    return result

def main():
    """Main entry point for the damage control hook."""
    try:
        # Read tool use data from stdin (passed by Claude Code)
        tool_data = json.loads(sys.stdin.read())
        
        # Extract command from tool invocation
        if tool_data.get('tool') == 'bash':
            args = tool_data.get('args', {})
            command = args.get('command', '')
            
            result = validate_command(command)
            
            # Output result as JSON
            print(json.dumps(result))
            
            # Exit with non-zero if blocked
            if not result['allowed']:
                sys.exit(1)
        else:
            # Not a bash tool, allow
            print(json.dumps({'allowed': True}))
            
    except json.JSONDecodeError:
        print(json.dumps({
            'allowed': False,
            'error': 'Invalid JSON input'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'allowed': True,  # Fail open on error
            'warning': f'Damage control error: {str(e)}'
        }))

if __name__ == '__main__':
    main()
