# 📐 Guide de Style - Booky

**Version:** 1.0
**Dernière mise à jour:** 11 octobre 2025
**Objectif:** Assurer une cohérence visuelle totale sur l'ensemble du site

---

## 🎨 Principes de Design

### Identité Visuelle
- **Thème:** Dark Romance / Bibliothèque élégante
- **Couleurs principales:**
  - Primary: `#8B1538` (rouge bordeaux)
  - Accent: `#6B4C7B` (violet profond)
- **Typographies:**
  - Titres et UI: **Playfair Display** (serif)
  - Contenu et descriptions: **Inter** (sans-serif)

---

## 📝 Typographie

### Titres Principaux (H1)
```tsx
className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground"
style={{ fontFamily: 'Playfair Display, serif' }}
```
- **Avec icône:** `<Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />`
- **Gap:** `gap-2 sm:gap-3`

### Sous-titres (H2)
```tsx
className="text-xl sm:text-2xl font-bold text-foreground"
style={{ fontFamily: 'Playfair Display, serif' }}
```

### Sous-titres de section (H3)
```tsx
className="text-lg sm:text-xl font-semibold text-foreground"
style={{ fontFamily: 'Playfair Display, serif' }}
```

### Titres de cartes (H4)
```tsx
className="text-base font-semibold text-foreground"
style={{ fontFamily: 'Playfair Display, serif' }}
```

### Texte de contenu
```tsx
className="text-sm sm:text-base text-foreground"
style={{ fontFamily: 'Inter, sans-serif' }}
```

### Descriptions / Légendes
```tsx
className="text-sm text-muted-foreground"
style={{ fontFamily: 'Inter, sans-serif' }}
```

---

## 📏 Espacements

### Padding des Containers Principaux
```tsx
className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12"
```
- **Max-width:** `max-w-7xl` (standard)
- **Exceptions:** `max-w-5xl` pour contenu focalisé (articles, détails)

### Marges entre Sections Majeures
```tsx
className="mb-6 sm:mb-8 lg:mb-12"
```

### Marges entre Éléments
```tsx
className="mb-4 sm:mb-6"  // Sections moyennes
className="mb-3 sm:mb-4"  // Petites sections
className="mb-2"          // Éléments rapprochés
```

### Espacement dans les Listes (space-y)
```tsx
className="space-y-4"          // Liste de cartes
className="space-y-3"          // Liste compacte
className="space-y-2"          // Liste très compacte
```

---

## 🎴 Cartes et Conteneurs

### Carte Standard
```tsx
className="bg-card/90 backdrop-blur-xl border border-border rounded-xl shadow-lg"
```

### Carte Hero / Importante
```tsx
className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-xl"
```

### Padding des Cartes
```tsx
className="p-4 sm:p-6 md:p-8"  // Grande carte
className="p-3 sm:p-4"         // Carte moyenne
className="p-2 sm:p-3"         // Petite carte
```

### Hover State des Cartes
```tsx
className="hover:border-primary/40 hover:shadow-xl transition-all duration-300"
```

---

## 🔘 Boutons

### Bouton Principal (Primary)
```tsx
<Button
  size="default"
  className="bg-primary text-primary-foreground hover:bg-primary/90"
>
  Action principale
</Button>
```

### Bouton Secondaire
```tsx
<Button variant="outline" size="default">
  Action secondaire
</Button>
```

### Bouton Petit (Compact)
```tsx
<Button size="sm" variant="outline">
  <Icon className="w-4 h-4 mr-2" />
  Action
</Button>
```

### Bouton CTA Spécial (avec gradient)
```tsx
<Button
  style={{
    background: 'linear-gradient(135deg, #8B1538 0%, #6B4C7B 100%)',
    color: 'white'
  }}
  className="hover:opacity-90 transition-opacity"
>
  CTA Important
</Button>
```

### Border Radius
- **Standard:** `rounded-lg` (implicite dans Button)
- **Full:** `rounded-full` (pour CTA spéciaux uniquement)

---

## 🏷️ Badges et Labels

### Badge Status
```tsx
// Utiliser le composant Badge avec variants
<Badge variant="default">Défaut</Badge>
<Badge variant="secondary">Secondaire</Badge>
<Badge variant="outline">Contour</Badge>
```

### Badge Status Coloré (en attente de variants)
```tsx
<Badge className="bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 text-xs">
  <Clock className="w-3 h-3 mr-1" />
  En attente
</Badge>
```

### Taille des Badges
- **Texte:** `text-xs`
- **Padding:** `px-2 py-0.5` ou `px-2.5 py-1`
- **Icônes:** `w-3 h-3`

---

## 🎭 Animations et Transitions

### Transitions CSS Standard
```tsx
className="transition-all duration-300"
```
- **Courte:** `duration-200` (hover rapide)
- **Standard:** `duration-300` (la plupart des cas)
- **Longue:** `duration-500` (animations complexes uniquement)

### Framer Motion - Initial Animation
```tsx
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6 }}
```

### Framer Motion - Delays Progressifs
```tsx
transition={{ duration: 0.6, delay: index * 0.1 }}
```
- Progression: `0.1, 0.2, 0.3, 0.4...`
- Maximum: `0.8` pour éviter l'attente

---

## 🖼️ Images et Médias

### Image Couverture Livre (Standard)
```tsx
<div className="relative w-32 h-48 rounded-lg overflow-hidden shadow-md">
  <Image
    src={book.image_couverture}
    alt={book.titre}
    fill
    className="object-cover"
  />
</div>
```

### Image Couverture Livre (Petite)
```tsx
<div className="relative w-16 h-24 rounded overflow-hidden shadow-sm">
  {/* ... */}
</div>
```

### Placeholder Image
```tsx
<div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
  <Book className="w-8 h-8 text-primary" />
</div>
```

---

## 🎯 Composants Spécifiques

### Navigation Sticky
```tsx
<header className="sticky top-0 z-50 bg-background/95 backdrop-blur-lg border-b border-border">
  {/* Contenu navigation */}
</header>
```

### Container de Page
```tsx
<div className="min-h-screen bg-background transition-colors duration-300">
  <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
    {/* Contenu */}
  </div>
</div>
```

### Section avec Titre
```tsx
<section className="mb-6 sm:mb-8 lg:mb-12">
  <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6"
      style={{ fontFamily: 'Playfair Display, serif' }}>
    Titre de Section
  </h2>
  {/* Contenu */}
</section>
```

---

## 🎨 Couleurs Sémantiques

### Status
- **Success:** `bg-emerald-50 dark:bg-emerald-950/20` + `text-emerald-700 dark:text-emerald-300`
- **Warning:** `bg-amber-50 dark:bg-amber-950/20` + `text-amber-700 dark:text-amber-300`
- **Error:** `bg-red-50 dark:bg-red-950/20` + `text-red-700 dark:text-red-300`
- **Info:** `bg-blue-50 dark:bg-blue-950/20` + `text-blue-700 dark:text-blue-300`

### Backgrounds
- **Card:** `bg-card/90` ou `bg-card/95`
- **Muted:** `bg-muted` ou `bg-muted/30`
- **Primary subtle:** `bg-primary/10`
- **Accent subtle:** `bg-accent/10`

---

## ✅ Checklist d'Harmonisation

Avant de valider une page, vérifier :

- [ ] H1 utilise `text-2xl sm:text-3xl lg:text-4xl font-bold`
- [ ] Tous les titres utilisent Playfair Display
- [ ] Padding du container: `py-6 sm:py-8 lg:py-12`
- [ ] Max-width: `max-w-7xl` (sauf exceptions justifiées)
- [ ] Cartes: `bg-card/90 backdrop-blur-xl rounded-xl`
- [ ] Boutons: utilisation du composant Button avec size
- [ ] Transitions: `duration-300`
- [ ] Badges: `text-xs`
- [ ] Espacements cohérents (mb-4 sm:mb-6 ou mb-6 sm:mb-8 lg:mb-12)
- [ ] Icônes dans titres: `w-6 h-6 sm:w-7 sm:h-7`

---

## 🚫 À Éviter

❌ **Ne PAS faire:**
- Mélanger font-normal, font-semibold, font-bold dans les H1
- Utiliser des paddings fixes sans responsive (py-6 uniquement)
- Créer des boutons avec styles inline au lieu du composant Button
- Utiliser des border-radius incohérents (rounded-sm, rounded-md, rounded-2xl, rounded-3xl)
- Mélanger space-y-2, space-y-3, space-y-4, space-y-6, space-y-8 aléatoirement
- Oublier backdrop-blur sur les cartes translucides
- Utiliser max-w-5xl partout (réservé au contenu focalisé)

---

## 📦 Composants à Créer (Futures Améliorations)

Pour améliorer encore la cohérence, considérer la création de:
- `<PageContainer>` - Container standardisé
- `<PageTitle>` - H1 avec icône standardisé
- `<SectionTitle>` - H2 standardisé
- `<StatusBadge>` - Badge avec variants success/warning/error
- `<BookCard>` - Carte livre standardisée
- `<ActionCard>` - Carte d'action avec CTA

---

**Maintenu par:** Claude Code
**Contact:** Pour toute question sur ces standards, consulter ce guide avant de coder.
