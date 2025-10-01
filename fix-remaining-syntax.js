const fs = require('fs');
const path = require('path');

// Patterns to fix remaining syntax issues
const fixes = [
  {
    // Fix mixed quotes in template literals
    pattern: /'([^']*\$\{[^}]*\}[^']*)'([^']*)`/g,
    replacement: '`$1$2`'
  },
  {
    // Fix template literals that start with single quote
    pattern: /'([^']*\$\{[^}]*\}[^']*)`/g,
    replacement: '`$1`'
  },
  {
    // Fix template literals ending with single quote instead of backtick
    pattern: /`([^`]*)'$/gm,
    replacement: '`$1`'
  },
  {
    // Fix single quote followed by template literal
    pattern: /'([^']*)`/g,
    replacement: '`$1`'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let modified = false;

    fixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        modified = true;
      }
    });

    // Check for unclosed template literals more broadly
    const lines = content.split('\n');
    let inTemplateLiteral = false;
    let templateStartLine = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Count backticks in the line (ignoring those in strings)
      let backtickCount = 0;
      let inString = false;
      let stringChar = '';

      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        const prevChar = j > 0 ? line[j-1] : '';

        if (!inString && (char === '"' || char === "'")) {
          inString = true;
          stringChar = char;
        } else if (inString && char === stringChar && prevChar !== '\\') {
          inString = false;
          stringChar = '';
        } else if (!inString && char === '`') {
          backtickCount++;
        }
      }

      if (backtickCount % 2 === 1) {
        inTemplateLiteral = !inTemplateLiteral;
        if (inTemplateLiteral) {
          templateStartLine = i;
        }
      }
    }

    if (modified && content !== originalContent) {
      fs.writeFileSync(filePath, content);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Target specific problematic files
const targetFiles = [
  'apps/web/src/components/admin/lists-manager.tsx',
  'apps/web/src/components/admin/export-manager.tsx',
  'apps/web/src/components/admin/categories-manager.tsx',
  'apps/web/src/components/admin/books-manager.tsx',
  'apps/web/src/components/admin/add-books-to-list-dialog.tsx'
];

console.log('🔧 Fixing remaining syntax errors...');
let fixedCount = 0;

targetFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (fs.existsSync(fullPath)) {
    console.log(`Checking ${file}...`);
    if (fixFile(fullPath)) {
      console.log(`✅ Fixed ${file}`);
      fixedCount++;
    } else {
      console.log(`⏭️  No fixes needed for ${file}`);
    }
  } else {
    console.log(`❌ File not found: ${file}`);
  }
});

console.log(`\n📊 Summary: ${fixedCount} files fixed`);
console.log('\n🚀 Next: npm run build');