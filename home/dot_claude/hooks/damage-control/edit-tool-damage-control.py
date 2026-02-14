#!/usr/bin/env python3
"""
PreToolUse hook for Edit tool damage control.
Validates file edit operations for safety.
"""

import json
import os
import sys

def check_edit_safety(file_path, old_string, new_string):
    """Check if an edit operation is safe to perform."""
    warnings = []
    blocked = False
    
    # Check 1: File exists and is readable
    if not os.path.exists(file_path):
        warnings.append({
            'severity': 'HIGH',
            'message': f'File does not exist: {file_path}'
        })
        blocked = True
    elif not os.access(file_path, os.R_OK):
        warnings.append({
            'severity': 'HIGH',
            'message': f'File is not readable: {file_path}'
        })
        blocked = True
    
    # Check 2: File is not a binary file
    if os.path.exists(file_path):
        try:
            with open(file_path, 'rb') as f:
                chunk = f.read(8192)
                if b'\x00' in chunk:
                    warnings.append({
                        'severity': 'HIGH',
                        'message': f'File appears to be binary: {file_path}'
                    })
                    blocked = True
        except Exception:
            pass
    
    # Check 3: old_string exists in file (prevents accidental double-edits)
    if os.path.exists(file_path) and old_string:
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if old_string not in content:
                    warnings.append({
                        'severity': 'MEDIUM',
                        'message': f'old_string not found in file - may have already been edited or context mismatch'
                    })
        except Exception:
            pass
    
    # Check 4: Large deletions (more than 100 lines)
    if old_string:
        old_lines = old_string.count('\n')
        if old_lines > 100:
            warnings.append({
                'severity': 'MEDIUM',
                'message': f'Large deletion detected: {old_lines} lines - Verify this is intentional'
            })
    
    # Check 5: Whitespace-only changes (often accidental)
    if old_string and new_string:
        old_stripped = old_string.strip()
        new_stripped = new_string.strip()
        if old_stripped == new_stripped and old_string != new_string:
            warnings.append({
                'severity': 'LOW',
                'message': 'Edit only changes whitespace - Verify this is necessary'
            })
    
    # Check 6: Empty replacement (deleting content)
    if old_string and not new_string.strip():
        warnings.append({
            'severity': 'MEDIUM',
            'message': 'Edit removes content without replacement - Verify this is intentional'
        })
    
    # Check 7: Path safety - prevent editing outside project
    abs_path = os.path.abspath(file_path)
    home = os.path.expanduser('~')
    
    # Check for system paths
    system_paths = ['/etc/', '/usr/', '/bin/', '/sbin/', '/lib/', '/opt/', '/var/']
    for sys_path in system_paths:
        if abs_path.startswith(sys_path):
            warnings.append({
                'severity': 'CRITICAL',
                'message': f'Attempting to edit system file: {file_path}'
            })
            blocked = True
    
    # Check 8: Git repository safety
    if '.git/' in file_path or file_path.endswith('.gitignore'):
        # These are generally safe, but warn for .git/config
        if '.git/config' in file_path:
            warnings.append({
                'severity': 'MEDIUM',
                'message': 'Editing git configuration - May affect repository behavior'
            })
    
    # Check 9: Secret/credential file patterns
    secret_patterns = [
        r'\.env$',
        r'\.env\.local$',
        r'\.env\.production$',
        r'credentials',
        r'secrets',
        r'private.*key',
        r'\.ssh/',
        r'\.aws/',
    ]
    
    import re
    for pattern in secret_patterns:
        if re.search(pattern, file_path, re.IGNORECASE):
            warnings.append({
                'severity': 'HIGH',
                'message': f'Editing potential secrets/credentials file: {file_path}'
            })
            break
    
    return {
        'blocked': blocked,
        'warnings': warnings
    }

def main():
    """Main entry point for the edit damage control hook."""
    try:
        # Read tool use data from stdin
        tool_data = json.loads(sys.stdin.read())
        
        if tool_data.get('tool') == 'edit':
            args = tool_data.get('args', {})
            file_path = args.get('filePath', '')
            old_string = args.get('oldString', '')
            new_string = args.get('newString', '')
            
            result = check_edit_safety(file_path, old_string, new_string)
            
            # Build response
            response = {
                'allowed': not result['blocked'],
                'warnings': result['warnings']
            }
            
            if result['warnings']:
                response['message'] = 'EDIT SAFETY WARNINGS:\n' + '\n'.join(
                    f"[{w['severity']}] {w['message']}" 
                    for w in result['warnings']
                )
                
                if result['blocked']:
                    response['message'] += '\n\nThis edit has been BLOCKED due to safety concerns.'
            
            print(json.dumps(response))
            
            if result['blocked']:
                sys.exit(1)
        else:
            print(json.dumps({'allowed': True}))
            
    except json.JSONDecodeError:
        print(json.dumps({
            'allowed': False,
            'error': 'Invalid JSON input'
        }))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({
            'allowed': True,
            'warning': f'Edit damage control error: {str(e)}'
        }))

if __name__ == '__main__':
    main()
