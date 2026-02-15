#!/usr/bin/env python3
"""
Comprehensive secret scanner for Claude Code damage control.
Detects credentials from multiple providers.
"""

import json
import re
import sys
from pathlib import Path

# Secret detection patterns
SECRET_PATTERNS = [
    # AWS
    {
        'name': 'AWS Access Key ID',
        'pattern': r'AKIA[0-9A-Z]{16}',
        'severity': 'CRITICAL'
    },
    {
        'name': 'AWS Secret Access Key',
        'pattern': r'[0-9a-zA-Z/+]{40}',
        'context': r'aws_secret|aws_secret_access_key',
        'severity': 'CRITICAL'
    },
    
    # GitHub
    {
        'name': 'GitHub Personal Access Token',
        'pattern': r'gh[pousr]_[A-Za-z0-9_]{36,}',
        'severity': 'CRITICAL'
    },
    {
        'name': 'GitHub OAuth Token',
        'pattern': r'[0-9a-f]{40}',
        'context': r'github.*token|gh_token',
        'severity': 'HIGH'
    },
    
    # OpenAI
    {
        'name': 'OpenAI API Key',
        'pattern': r'sk-[a-zA-Z0-9]{20,}',
        'severity': 'CRITICAL'
    },
    {
        'name': 'OpenAI Organization ID',
        'pattern': r'org-[a-zA-Z0-9]{24}',
        'severity': 'HIGH'
    },
    
    # Anthropic (Claude)
    {
        'name': 'Anthropic API Key',
        'pattern': r'sk-ant-[a-zA-Z0-9]{32,}',
        'severity': 'CRITICAL'
    },
    
    # Google / GCP
    {
        'name': 'Google API Key',
        'pattern': r'AIza[0-9A-Za-z_-]{35}',
        'severity': 'CRITICAL'
    },
    {
        'name': 'GCP Service Account Key',
        'pattern': r'"type":\s*"service_account"',
        'severity': 'CRITICAL'
    },
    
    # Azure
    {
        'name': 'Azure Storage Key',
        'pattern': r'[0-9a-zA-Z]{86}==',
        'context': r'azure.*key|storage.*key',
        'severity': 'CRITICAL'
    },
    {
        'name': 'Azure AD Client Secret',
        'pattern': r'[0-9a-zA-Z]{32,}-[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}',
        'context': r'client.*secret|aad.*secret',
        'severity': 'CRITICAL'
    },
    
    # Slack
    {
        'name': 'Slack Token',
        'pattern': r'xox[baprs]-[0-9a-zA-Z]{10,}',
        'severity': 'CRITICAL'
    },
    
    # Stripe
    {
        'name': 'Stripe API Key',
        'pattern': r'sk_live_[0-9a-zA-Z]{24}',
        'severity': 'CRITICAL'
    },
    {
        'name': 'Stripe Test Key',
        'pattern': r'sk_test_[0-9a-zA-Z]{24}',
        'severity': 'HIGH'
    },
    
    # Generic credentials
    {
        'name': 'Private Key',
        'pattern': r'-----BEGIN (RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----',
        'severity': 'CRITICAL'
    },
    {
        'name': 'Password in URL',
        'pattern': r'[a-zA-Z]{3,10}://[^/\s:@]*:[^/\s:@]*@[^/\s]*',
        'severity': 'CRITICAL'
    },
    {
        'name': 'Database Connection String',
        'pattern': r'(postgres|mysql|mongodb|redis)://[^\s]*:[^\s]*@[^\s]*',
        'severity': 'CRITICAL'
    },
    {
        'name': 'API Key Pattern',
        'pattern': r'(?i)(api[_-]?key|apikey)\s*[:=]\s*["\']?[a-zA-Z0-9_\-]{16,}',
        'severity': 'HIGH'
    },
    {
        'name': 'Secret Pattern',
        'pattern': r'(?i)(secret[_-]?key|secret)\s*[:=]\s*["\']?[a-zA-Z0-9_\-]{16,}',
        'severity': 'HIGH'
    },
    {
        'name': 'Token Pattern',
        'pattern': r'(?i)(auth[_-]?token|access[_-]?token|bearer)\s*[:=]\s*["\']?[a-zA-Z0-9_\-]{16,}',
        'severity': 'HIGH'
    },
]

# File patterns that might contain secrets but are often false positives
ALLOWED_FILES = [
    r'\.env\.example$',
    r'\.env\.sample$',
    r'\.env\.template$',
    r'\.env\.local\.example$',
    r'docker-compose\.ya?ml\.example$',
]

def should_skip_file(file_path):
    """Check if file should be skipped (e.g., example files)."""
    for pattern in ALLOWED_FILES:
        if re.search(pattern, file_path, re.IGNORECASE):
            return True
    return False

def scan_content(content, context=''):
    """Scan content for secrets."""
    findings = []
    
    for rule in SECRET_PATTERNS:
        pattern = rule['pattern']
        matches = re.finditer(pattern, content)
        
        for match in matches:
            # Check context if provided
            if 'context' in rule:
                context_pattern = rule['context']
                # Look for context pattern in surrounding area
                start = max(0, match.start() - 100)
                end = min(len(content), match.end() + 100)
                surrounding = content[start:end]
                
                if not re.search(context_pattern, surrounding, re.IGNORECASE):
                    continue
            
            # Redact the match for display
            match_text = match.group()
            if len(match_text) > 20:
                redacted = match_text[:8] + '...' + match_text[-4:]
            else:
                redacted = match_text[:4] + '...'
            
            findings.append({
                'type': rule['name'],
                'severity': rule['severity'],
                'match': redacted,
                'position': match.start()
            })
    
    return findings

def scan_file(file_path):
    """Scan a file for secrets."""
    if should_skip_file(file_path):
        return []
    
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        return scan_content(content, file_path)
    except Exception:
        return []

def format_findings(findings):
    """Format findings for display."""
    if not findings:
        return None
    
    critical = [f for f in findings if f['severity'] == 'CRITICAL']
    high = [f for f in findings if f['severity'] == 'HIGH']
    
    lines = []
    lines.append("\n🔒 SECRET DETECTION ALERT:\n")
    
    if critical:
        lines.append(f"  CRITICAL ({len(critical)} found):" )
        for f in critical:
            lines.append(f"    - {f['type']}: {f['match']}")
    
    if high:
        lines.append(f"  HIGH ({len(high)} found):")
        for f in high:
            lines.append(f"    - {f['type']}: {f['match']}")
    
    lines.append("\n  ⚠️  NEVER commit credentials or API keys!")
    lines.append("  🛡️  Use: git-crypt, .env files (gitignored), or a secrets manager")
    
    return '\n'.join(lines)

def main():
    """Main entry point for secret scanner."""
    if len(sys.argv) < 2:
        print("Usage: secret-scanner.py <file> [file2 ...]", file=sys.stderr)
        sys.exit(1)
    
    all_findings = []
    
    for file_path in sys.argv[1:]:
        if not Path(file_path).exists():
            continue
        
        findings = scan_file(file_path)
        if findings:
            all_findings.extend(findings)
            output = format_findings(findings)
            if output:
                print(f"\n📄 {file_path}:")
                print(output)
    
    # Exit with error if critical secrets found
    critical_count = len([f for f in all_findings if f['severity'] == 'CRITICAL'])
    if critical_count > 0:
        print(f"\n❌ BLOCKED: {critical_count} critical secret(s) detected!")
        sys.exit(1)
    
    sys.exit(0)

if __name__ == '__main__':
    main()
