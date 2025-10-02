import re

files_to_check = [
    'apps/web/src/components/admin/books-manager.tsx',
    'apps/web/src/contexts/AuthContext.tsx'
]

for filepath in files_to_check:
    print(f'\n==== Checking {filepath} ====\n')

    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # Look for problematic patterns
    for i, line in enumerate(lines, 1):
        issues = []

        # Check for mixed template literals
        # Pattern: `something${var}' or 'something${var}` or `something${var}"
        if '${' in line:
            # Find template literal expressions
            if re.search(r"'[^']*\$\{", line):
                issues.append("Single quote start with template literal")
            if re.search(r'"[^"]*\$\{', line):
                issues.append("Double quote start with template literal")
            if re.search(r'\$\{[^}]*}[^`]*[\'"]$', line):
                issues.append("Template literal ends with quote instead of backtick")

        # Look for quote mix patterns
        if re.search(r'`[^`\n]{0,50}\$\{[^}]+}[^`\n]{0,50}[\'"]', line):
            issues.append("Backtick template with quote ending")

        if issues:
            print(f'Line {i}: {", ".join(issues)}')
            print(f'  Content: {line.strip()[:100]}')
            print()

print('\nDone!')
