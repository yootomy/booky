const fs = require('fs');

const file = 'apps/web/src/components/admin/books-manager.tsx';
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

console.log('Looking for unclosed strings before line 275...\n');

let inString = null; // tracks if we're inside a string: ', ", or `
let stringStart = null;

for (let i = 0; i < 275 && i < lines.length; i++) {
  const line = lines[i];
  let j = 0;

  while (j < line.length) {
    const char = line[j];
    const prevChar = j > 0 ? line[j - 1] : '';

    // Skip escaped characters
    if (prevChar === '\\') {
      j++;
      continue;
    }

    // Check for template literal ${
    if (inString === '`' && char === '$' && line[j + 1] === '{') {
      // Inside template literal expression - need to track braces
      let braceCount = 1;
      j += 2;
      while (j < line.length && braceCount > 0) {
        if (line[j] === '{') braceCount++;
        if (line[j] === '}') braceCount--;
        j++;
      }
      continue;
    }

    // String delimiters
    if (char === '"' || char === "'" || char === '`') {
      if (!inString) {
        inString = char;
        stringStart = { line: i + 1, col: j, char };
      } else if (inString === char) {
        inString = null;
        stringStart = null;
      }
    }

    j++;
  }

  // If we end the line with an unclosed string (not template literal)
  if (inString && inString !== '`' && i < 274) {
    console.log(`⚠️  Line ${i + 1}: Unclosed ${inString} string started at column ${stringStart.col}`);
    console.log(`  Content: ${line.substring(0, 100)}`);
    console.log('');
  }
}

if (inString) {
  console.log(`\n🚨 FOUND: Unclosed ${inString} string that started at line ${stringStart.line}, column ${stringStart.col}`);
  console.log(`This is likely causing the error at line 275!`);
} else {
  console.log('\n✅ No unclosed strings found before line 275');
}
