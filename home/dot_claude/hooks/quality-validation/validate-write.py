#!/usr/bin/env python3
"""
PostToolUse hook for quality validation.
Runs basic quality checks after file writes/edits.
"""

import json
import os
import re
import subprocess
import sys

def check_file_quality(file_path):
    """Run quality checks on a file after it's written/edited."""
    issues = []
    warnings = []
    
    if not os.path.exists(file_path):
        return {'issues': ['File does not exist'], 'warnings': []}
    
    # Check based on file type
    ext = os.path.splitext(file_path)[1].lower()
    
    # Python files
    if ext == '.py':
        # Check for syntax errors
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                compile(content, file_path, 'exec')
        except SyntaxError as e:
            issues.append(f"Syntax error: {e}")
        except Exception:
            pass
        
        # Check for common Python issues
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for TODO/FIXME markers
                if re.search(r'#\s*(TODO|FIXME|XXX|HACK)', content, re.IGNORECASE):
                    warnings.append("File contains TODO/FIXME markers")
                
                # Check for debug print statements
                if re.search(r'\bprint\s*\([^)]*\)', content):
                    warnings.append("File contains print statements (consider using logging)")
                
                # Check for trailing whitespace
                if re.search(r'[ \t]+$', content, re.MULTILINE):
                    warnings.append("File contains trailing whitespace")
                
                # Check for line endings (should be LF, not CRLF)
                if '\r\n' in content:
                    warnings.append("File uses CRLF line endings (should use LF)")
        except:
            pass
        
        # Try to run ruff if available
        try:
            result = subprocess.run(
                ['ruff', 'check', file_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0 and result.stdout:
                # Only report errors, not warnings
                for line in result.stdout.split('\n'):
                    if 'error' in line.lower():
                        issues.append(f"Ruff: {line}")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
        
        # Try to run mypy if available
        try:
            result = subprocess.run(
                ['mypy', file_path],
                capture_output=True,
                text=True,
                timeout=15
            )
            if result.returncode != 0 and 'error' in result.stdout.lower():
                warnings.append("Type checking issues detected (run 'mypy' for details)")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
    
    # JavaScript/TypeScript files
    elif ext in ['.js', '.jsx', '.ts', '.tsx']:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for console.log
                if re.search(r'\bconsole\.log\s*\(', content):
                    warnings.append("File contains console.log statements")
                
                # Check for trailing whitespace
                if re.search(r'[ \t]+$', content, re.MULTILINE):
                    warnings.append("File contains trailing whitespace")
                
                # Check for CRLF
                if '\r\n' in content:
                    warnings.append("File uses CRLF line endings (should use LF)")
        except:
            pass
        
        # Try to run eslint if available
        try:
            result = subprocess.run(
                ['eslint', file_path],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode != 0 and result.stdout:
                warnings.append("ESLint issues detected (run 'eslint' for details)")
        except (subprocess.TimeoutExpired, FileNotFoundError):
            pass
    
    # JSON files
    elif ext == '.json':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                json.load(f)
        except json.JSONDecodeError as e:
            issues.append(f"Invalid JSON: {e}")
    
    # Shell scripts
    elif ext in ['.sh', '.bash']:
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for shellcheck if available
                try:
                    result = subprocess.run(
                        ['shellcheck', '-S', 'error', file_path],
                        capture_output=True,
                        text=True,
                        timeout=10
                    )
                    if result.returncode != 0 and result.stdout:
                        warnings.append("ShellCheck issues detected (run 'shellcheck' for details)")
                except (subprocess.TimeoutExpired, FileNotFoundError):
                    pass
        except:
            pass
    
    # Markdown files
    elif ext == '.md':
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for broken links (basic check)
                if re.search(r'\[([^\]]+)\]\(\s*\)', content):
                    warnings.append("File contains empty link targets")
                
                # Check for trailing whitespace
                if re.search(r'[ \t]+$', content, re.MULTILINE):
                    warnings.append("File contains trailing whitespace")
        except:
            pass
    
    # General checks for all files
    try:
        with open(file_path, 'rb') as f:
            content = f.read()
            
            # Check file size
            size_kb = len(content) / 1024
            if size_kb > 1000:
                warnings.append(f"Large file ({size_kb:.1f} KB) - Consider breaking into smaller files")
            
            # Check for mixed line endings
            lf_count = content.count(b'\n')
            crlf_count = content.count(b'\r\n')
            if crlf_count > 0 and crlf_count < lf_count:
                warnings.append("Mixed line endings detected (LF and CRLF)")
    except:
        pass
    
    return {
        'issues': issues,
        'warnings': warnings
    }

def main():
    """Main entry point for quality validation hook."""
    try:
        # Read tool use data from stdin
        tool_data = json.loads(sys.stdin.read())
        
        if tool_data.get('tool') in ['write', 'edit']:
            args = tool_data.get('args', {})
            file_path = args.get('filePath', '')
            
            if file_path:
                result = check_file_quality(file_path)
                
                # Output results
                if result['issues']:
                    print(f"\n⚠️  QUALITY ISSUES in {file_path}:")
                    for issue in result['issues']:
                        print(f"  ❌ {issue}")
                
                if result['warnings']:
                    print(f"\n⚡ QUALITY WARNINGS in {file_path}:")
                    for warning in result['warnings']:
                        print(f"  ⚠️  {warning}")
                
                # Exit with warning status if issues found
                if result['issues']:
                    sys.exit(1)
        
    except json.JSONDecodeError:
        print("Error: Invalid JSON input", file=sys.stderr)
        sys.exit(0)  # Don't fail on parse error
    except Exception as e:
        print(f"Quality validation error: {e}", file=sys.stderr)
        sys.exit(0)  # Don't fail on validation errors

if __name__ == '__main__':
    main()
