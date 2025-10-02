const fs = require('fs');

const file = 'apps/web/src/components/admin/books-manager.tsx';
const content = fs.readFileSync(file, 'utf-8');
const lines = content.split('\n');

const stack = [];
let inString = null;
let inComment = false;
let inMultilineComment = false;

for (let i = 0; i < 275 && i < lines.length; i++) {
  const line = lines[i];

  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const nextChar = line[j + 1];
    const prevChar = j > 0 ? line[j - 1] : '';

    // Skip escaped characters
    if (prevChar === '\\') continue;

    // Handle comments
    if (!inString) {
      if (char === '/' && nextChar === '/') {
        inComment = true;
        break; // rest of line is comment
      }
      if (char === '/' && nextChar === '*') {
        inMultilineComment = true;
        j++;
        continue;
      }
      if (inMultilineComment && char === '*' && nextChar === '/') {
        inMultilineComment = false;
        j++;
        continue;
      }
      if (inMultilineComment) continue;
    }

    // Handle strings
    if ((char === '"' || char === "'" || char === '`') && !inMultilineComment) {
      if (!inString) {
        inString = char;
      } else if (inString === char) {
        inString = null;
      }
      continue;
    }

    if (inString || inComment || inMultilineComment) continue;

    // Track braces
    if (char === '(' || char === '[' || char === '{') {
      stack.push({ char, line: i + 1, col: j });
    } else if (char === ')' || char === ']' || char === '}') {
      const expected = char === ')' ? '(' : char === ']' ? '[' : '{';
      const top = stack[stack.length - 1];

      if (!top) {
        console.log(`⚠️  Line ${i + 1}, col ${j}: Unexpected closing '${char}'`);
      } else if (top.char !== expected) {
        console.log(`⚠️  Line ${i + 1}, col ${j}: Mismatched brace. Expected '${expected === '(' ? ')' : expected === '[' ? ']' : '}'}' but got '${char}'`);
        console.log(`  Opened at line ${top.line}, col ${top.col}`);
      } else {
        stack.pop();
      }
    }
  }

  inComment = false; // comments don't span lines (single-line)
}

console.log('\n=== Stack at line 275 ===');
if (stack.length === 0) {
  console.log('✅ All braces balanced!');
} else {
  console.log(`⚠️  ${stack.length} unclosed braces:\n`);
  stack.forEach(item => {
    console.log(`  Line ${item.line}, col ${item.col}: '${item.char}'`);
    if (lines[item.line - 1]) {
      console.log(`    ${lines[item.line - 1].substring(0, 80)}`);
    }
  });
}
