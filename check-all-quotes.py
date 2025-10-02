import re
import os

files_to_check = [
    'apps/web/src/components/admin/books-manager.tsx',
    'apps/web/src/contexts/AuthContext.tsx',
    'apps/web/src/lib/utils.ts',
    'apps/web/src/app/admin/activity/page.tsx',
    'apps/web/src/app/admin/books/[id]/edit/page.tsx',
]

all_issues = []

for filepath in files_to_check:
    if not os.path.exists(filepath):
        print(f'⚠️  File not found: {filepath}')
        continue

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Look for problematic patterns
    for i, line in enumerate(lines, 1):
        issues = []

        # Pattern 1: Template literals with mixed quotes
        if '${' in line:
            # Find template literal expressions
            if re.search(r"'[^'\n]*\$\{", line):
                issues.append("Single quote start with template literal")
            if re.search(r'"[^"\n]*\$\{', line):
                issues.append("Double quote start with template literal")
            if re.search(r'\$\{[^}]*}[^`\n]*[\'"](?!\w)', line):
                issues.append("Template literal with quote ending")

        # Pattern 2: Mixed quotes in strings
        if re.search(r'`[^`\n]{1,100}\$\{[^}]+}[^`\n]{1,100}[\'"]', line):
            issues.append("Backtick template with quote ending")

        # Pattern 3: String starting with one quote type, ending with another
        if re.search(r"=\"[^\"]*'(?!\w)", line) or re.search(r"='[^']*\"(?!\w)", line):
            issues.append("Mixed quote delimiters in attribute")

        # Pattern 4: Specific known patterns from build errors
        if re.search(r'"[^"]*\'(?:\s|$|;|\))', line) or re.search(r"'[^']*\"(?:\s|$|;|\))", line):
            issues.append("String with mixed delimiters")

        if issues:
            all_issues.append({
                'file': filepath,
                'line': i,
                'content': line.rstrip(),
                'issues': issues
            })

print(f'\nFound {len(all_issues)} potential issues:\n')

for issue in all_issues[:30]:  # Show first 30
    print(f'{issue["file"]}:{issue["line"]}')
    print(f'  Issues: {", ".join(issue["issues"])}')
    print(f'  Content: {issue["content"][:100]}')
    print()

print(f'\n{"="*60}')
print(f'Total issues found: {len(all_issues)}')
