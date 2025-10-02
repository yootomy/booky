const fs = require('fs');
const path = require('path');

// Vraiment les dernières corrections !!

const finalFixes = [
  // search-box.tsx
  {
    file: 'src/components/search/search-box.tsx',
    from: "router.push(`/books?author=${encodeURIComponent(suggestion.name || '`)}');",
    to: "router.push(`/books?author=${encodeURIComponent(suggestion.name || '')}`);"
  },
  // tag-selector.tsx
  {
    file: 'src/components/search/tag-selector.tsx',
    from: '{tag.count && " (${tag.count})' }',
    to: '{tag.count && ` (${tag.count})`}'
  },
  // FavoritesTest.tsx
  {
    file: 'src/components/test/FavoritesTest.tsx',
    from: '{Array.from(favorites).join(', `)}',
    to: '{Array.from(favorites).join(', ')}'
  }
];

finalFixes.forEach(fix => {
  try {
    const filePath = path.join(__dirname, 'apps/web', fix.file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes(fix.from)) {
      content = content.replace(fix.from, fix.to);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${fix.file}`);
    } else {
      console.log(`⚠️ Pattern not found in ${fix.file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${fix.file}:`, error.message);
  }
});

console.log('\n🎉 TOUTES les corrections terminées !');