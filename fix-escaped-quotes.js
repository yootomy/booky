const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'apps', 'web', 'src');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix: 'none` → 'none'
    content = content.replace(/'([^'`]+)`/g, "'$1'");
    
    // Fix: = 'text` → = 'text'
    content = content.replace(/=\s*'([^'`]+)`/g, "= '$1'");
    
    // Fix: method: `DELETE` → method: 'DELETE'
    content = content.replace(/method:\s*`([A-Z]+)`/g, "method: '$1'");
    
    // Fix: l\`envoi → l'envoi
    content = content.replace(/l\`/g, "l'");
    content = content.replace(/d\`/g, "d'");
    
    // Fix: réessayer.` → réessayer.'
    content = content.replace(/\.`\)/g, ".')");
    
    // Fix: 'Auteur` → 'Auteur'
    content = content.replace(/'([^']*?)`\)/g, "'$1')");

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

console.log('🔧 Fixing escaped quotes and final issues...\n');
const fixedCount = walkDir(targetDir);
console.log(`\n✅ Fixed ${fixedCount} files`);
