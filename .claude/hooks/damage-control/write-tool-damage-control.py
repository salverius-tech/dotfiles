#!/usr/bin/env python3
"""
PreToolUse hook for Write tool damage control.
Validates file write operations for safety.
"""

import json
import os
import re
import sys

def check_write_safety(file_path, content):
    """Check if a file write operation is safe to perform."""
    warnings = []
    blocked = False
    
    # Check 1: Path safety - prevent writing to system directories
    abs_path = os.path.abspath(file_path)
    
    system_paths = ['/etc/', '/usr/', '/bin/', '/sbin/', '/lib/', '/sys/', '/proc/', '/dev/']
    for sys_path in system_paths:
        if abs_path.startswith(sys_path):
            warnings.append({
                'severity': 'CRITICAL',
                'message': f'Attempting to write to system directory: {file_path}'
            })
            blocked = True
    
    # Check 2: Directory exists and is writable
    dir_path = os.path.dirname(abs_path)
    if dir_path and not os.path.exists(dir_path):
        warnings.append({
            'severity': 'MEDIUM',
            'message': f'Directory does not exist: {dir_path}'
        })
    elif dir_path and not os.access(dir_path, os.W_OK):
        warnings.append({
            'severity': 'HIGH',
            'message': f'Directory is not writable: {dir_path}'
        })
        blocked = True
    
    # Check 3: File already exists (overwriting)
    if os.path.exists(file_path):
        warnings.append({
            'severity': 'LOW',
            'message': f'File already exists and will be overwritten: {file_path}'
        })
        
        # Check if it's a hidden/system file
        filename = os.path.basename(file_path)
        if filename.startswith('.') and filename not in ['.gitignore', '.env.example', '.dockerignore']:
            warnings.append({
                'severity': 'MEDIUM',
                'message': f'Overwriting hidden file: {file_path}'
            })
    
    # Check 4: Large file creation (> 1MB)
    if content and len(content) > 1_000_000:
        warnings.append({
            'severity': 'MEDIUM',
            'message': f'Large file write detected ({len(content)} bytes) - Verify this is intentional'
        })
    
    # Check 5: Empty or minimal content
    if content and len(content.strip()) < 10:
        warnings.append({
            'severity': 'LOW',
            'message': 'Writing file with minimal content - Verify this is not accidental'
        })
    
    # Check 6: Suspicious file extensions
    suspicious_extensions = ['.exe', '.dll', '.so', '.dylib', '.bin']
    file_ext = os.path.splitext(file_path)[1].lower()
    if file_ext in suspicious_extensions:
        warnings.append({
            'severity': 'HIGH',
            'message': f'Attempting to write binary file type: {file_ext}'
        })
        blocked = True
    
    # Check 7: Secrets/credentials in content
    secret_patterns = [
        (r'(?i)api[_-]?key\s*[:=]\s*["\']?[\w\-]{20,}', 'API key detected in content'),
        (r'(?i)password\s*[:=]\s*["\'][^"\']{8,}', 'Password detected in content'),
        (r'(?i)secret\s*[:=]\s*["\'][^"\']{8,}', 'Secret detected in content'),
        (r'(?i)private[_-]?key', 'Private key reference detected'),
        (r'(?i)aws_access_key_id', 'AWS credentials detected'),
        (r'sk-[a-zA-Z0-9]{20,}', 'OpenAI API key detected'),
        (r'gh[pousr]_[A-Za-z0-9_]{36,}', 'GitHub token detected'),
    ]
    
    for pattern, message in secret_patterns:
        if re.search(pattern, content):
            warnings.append({
                'severity': 'CRITICAL',
                'message': f'{message} - NEVER commit credentials!'
            })
            blocked = True
    
    # Check 8: Suspicious file paths (common sensitive locations)
    sensitive_paths = [
        (r'\.ssh/', 'SSH directory'),
        (r'\.aws/', 'AWS credentials directory'),
        (r'\.gnupg/', 'GPG directory'),
        (r'password', 'Password file'),
        (r'credential', 'Credentials file'),
        (r'id_rsa', 'SSH private key'),
        (r'id_ed25519', 'SSH private key'),
    ]
    
    for pattern, desc in sensitive_paths:
        if re.search(pattern, file_path, re.IGNORECASE):
            warnings.append({
                'severity': 'HIGH',
                'message': f'Writing to {desc}: {file_path}'
            })
    
    # Check 9: Content validation for specific file types
    if file_path.endswith('.json'):
        try:
            json.loads(content)
        except json.JSONDecodeError as e:
            warnings.append({
                'severity': 'MEDIUM',
                'message': f'Invalid JSON content: {str(e)}'
            })
    
    return {
        'blocked': blocked,
        'warnings': warnings
    }

def main():
    """Main entry point for the write damage control hook."""
    try:
        # Read tool use data from stdin
        tool_data = json.loads(sys.stdin.read())
        
        if tool_data.get('tool') == 'write':
            args = tool_data.get('args', {})
            file_path = args.get('filePath', '')
            content = args.get('content', '')
            
            result = check_write_safety(file_path, content)
            
            # Build response
            response = {
                'allowed': not result['blocked'],
                'warnings': result['warnings']
            }
            
            if result['warnings']:
                response['message'] = 'WRITE SAFETY WARNINGS:\n' + '\n'.join(
                    f"[{w['severity']}] {w['message']}" 
                    for w in result['warnings']
                )
                
                if result['blocked']:
                    response['message'] += '\n\nThis write has been BLOCKED due to safety concerns.'
            
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
            'warning': f'Write damage control error: {str(e)}'
        }))

if __name__ == '__main__':
    main()
