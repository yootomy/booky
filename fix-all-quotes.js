const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, 'apps', 'web', 'src');

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const original = content;

    // Fix 1: ['book`, bookId] → ['book', bookId]
    content = content.replace(/\['([^'`]+)`/g, "['$1'");
    
    // Fix 2: ? `s' : → ? 's' :
    content = content.replace(/\?\s*`s'/g, "? 's'");
    
    // Fix 3: : ``} → : ''}
    content = content.replace(/:\s*``\}/g, ": ''}");
    
    // Fix 4: className=`...` → className="..."  (when no ${})
    content = content.replace(/className=`([^`$]*?)`/g, 'className="$1"');
    
    // Fix 5: className=`h-4 w-4 mr-2" → className="h-4 w-4 mr-2"
    content = content.replace(/className=`([^`"]*?)"/g, 'className="$1"');

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

console.log('🔧 Fixing remaining quote issues...\n');
const fixedCount = walkDir(targetDir);
console.log(`\n✅ Fixed ${fixedCount} files`);
