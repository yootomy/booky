const fs = require('fs');
const path = require('path');

// Script pour les toutes dernières erreurs spécifiques

const specificFixes = [
  // ConseilRequestModal: `${tag.couleur}20` est correct mais peut-être dans un mauvais contexte
  // dark-rating: aria-label avec template literal cassé
  {
    file: 'src/components/ratings/dark-rating.tsx',
    from: "aria-label={'Niveau dark ${darkValue} sur ${max}`}",
    to: "aria-label={`Niveau dark ${darkValue} sur ${max}`}"
  },
  // romance-rating: même problème
  {
    file: 'src/components/ratings/romance-rating.tsx',
    from: "aria-label={'Niveau romance ${romanceValue} sur ${max}`}",
    to: "aria-label={`Niveau romance ${romanceValue} sur ${max}`}"
  },
  // spicy-rating: même problème
  {
    file: 'src/components/ratings/spicy-rating.tsx',
    from: "aria-label={'Niveau spicy ${spicyValue} sur ${max}`}",
    to: "aria-label={`Niveau spicy ${spicyValue} sur ${max}`}"
  }
];

specificFixes.forEach(fix => {
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

console.log('\n✨ Dernières corrections terminées!');