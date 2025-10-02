const fs = require('fs');

const filePath = 'apps/web/src/components/admin/books-manager.tsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Searching for unclosed strings or mixed quotes...\n');

// Check around line 275
const startLine = 250;
const endLine = 280;

for (let i = startLine; i < endLine && i < lines.length; i++) {
  const line = lines[i];

  // Look for template literals that might have mixed quotes
  const templateLiteralPattern = /`[^`]*\${[^}]*}[^`]*`/g;
  const matches = line.match(templateLiteralPattern);

  if (matches) {
    console.log(`Line ${i + 1}: Template literal found`);
    console.log(`  ${line.trim()}`);

    // Check each match for issues
    matches.forEach(match => {
      // Check if there are unescaped quotes inside
      const insideTemplate = match.substring(1, match.length - 1);
      if (insideTemplate.includes('"') || insideTemplate.includes("'")) {
        console.log(`  ⚠️  Contains quotes: ${match}`);
      }
    });
    console.log('');
  }

  // Check for strings that mix quote types
  if ((line.includes('`') && line.includes('"')) ||
      (line.includes('`') && line.includes("'")) ||
      (line.includes('"') && line.includes("'") && !line.includes('\\') && line.includes('=') )) {

    // Count quotes
    const backticks = (line.match(/`/g) || []).length;
    const doubleQuotes = (line.match(/"/g) || []).length;
    const singleQuotes = (line.match(/'/g) || []).length;

    if (backticks % 2 !== 0 || doubleQuotes % 2 !== 0 || singleQuotes % 2 !== 0) {
      console.log(`Line ${i + 1}: UNMATCHED QUOTES`);
      console.log(`  Backticks: ${backticks}, Double: ${doubleQuotes}, Single: ${singleQuotes}`);
      console.log(`  ${line.trim()}`);
      console.log('');
    }
  }
}

console.log('Done!');
