const fs = require('fs');
const path = require('path');

const filePath = 'apps/web/src/components/admin/books-manager.tsx';
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

console.log('Checking for problematic characters...\n');

// Check specifically around line 275
for (let i = 270; i < 280; i++) {
  const line = lines[i];
  if (!line) continue;

  // Check for any Unicode quotes (curly quotes, etc.)
  const badChars = [];
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    const code = line.charCodeAt(j);

    // Check for problematic characters
    // Regular quotes: ' (0x27), " (0x22), ` (0x60)
    // Curly quotes: ' (0x2018), ' (0x2019), " (0x201C), " (0x201D)
    // Prime: ′ (0x2032), ″ (0x2033)
    if (code === 0x2018 || code === 0x2019 || code === 0x201C || code === 0x201D ||
        code === 0x2032 || code === 0x2033 || code === 0x00B4 || code === 0x0060) {
      badChars.push({ pos: j, char, code: code.toString(16) });
    }
  }

  if (badChars.length > 0) {
    console.log(`Line ${i + 1}:`);
    console.log(`  Content: ${line.substring(0, 100)}`);
    badChars.forEach(bc => {
      console.log(`  Position ${bc.pos}: '${bc.char}' (U+${bc.code})`);
    });
    console.log('');
  }
}

console.log('Done!');
