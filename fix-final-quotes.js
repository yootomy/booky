const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'apps', 'web', 'src');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix: === 'TEXT` → === 'TEXT'
    content = content.replace(/===\s*'([^'`]+)`/g, "=== '$1'");
    
    // Fix: variant: "text` → variant: "text"
    content = content.replace(/:\s*"([^"`]+)`/g, ': "$1"');
    
    // Fix: mode: 'text`, → mode: 'text',
    content = content.replace(/:\s*'([^'`]+)`,/g, ": '$1',");
    
    // Fix: format === "PDF' → format === "PDF"
    content = content.replace(/===\s*"([^"']+)'/g, '=== "$1"');
    
    // Fix: boxShadow: `0 8px... → boxShadow: '0 8px...
    content = content.replace(/boxShadow:\s*`([^`$]*?)`/g, "boxShadow: '$1'");
    
    // Fix: fontFamily: "text` → fontFamily: "text"
    content = content.replace(/fontFamily:\s*"([^"`]+)`/g, 'fontFamily: "$1"');

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        fixedCount += walkDir(filePath);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      if (fixFile(filePath)) {
        fixedCount++;
      }
    }
  });

  return fixedCount;
}

console.log('🔧 Final quote fixes...\n');
const fixedCount = walkDir(targetDir);
console.log(`\n✅ Fixed ${fixedCount} files`);
