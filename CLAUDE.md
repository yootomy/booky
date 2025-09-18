# 🚀 Booky - Guide de développement

## ⚡ Commands recommandées

### ✅ **Pour développer sans crashes :**
```bash
# Lance tout SAUF l'app native (RECOMMANDÉ)
bun run dev:stable

# Ou séparément si besoin
bun run dev:web      # App web uniquement (port 3001)
bun run dev:server   # API backend uniquement (port 3000)
```

### ❌ **ATTENTION - À éviter absolument :**
```bash
bun run dev  # ❌ CRASHE - inclut l'app native Expo
```

## 🚨 **IMPORTANT**
- **TOUJOURS** utiliser `bun run dev:stable`
- **JAMAIS** utiliser `bun run dev` (ça crashe à cause d'Expo)
- Si vous utilisez `bun run dev` par habitude, ça va crasher !

## 🎯 **URLs de développement**
- **App Web:** http://localhost:3001
- **API Server:** http://localhost:3000

## 🐛 **Problèmes connus**
- L'app native Expo cause des crashes (`TypeError: fetch failed`)
- Utiliser `dev:stable` pour éviter ces problèmes

## 📝 **Notes Claude Code**
- Page de détail de livre optimisée avec animations stables
- Corrections anti-crash appliquées (fuites mémoire, useEffect)
- Design romantique avec glassmorphism et éléments flottants