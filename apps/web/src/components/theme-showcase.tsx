/**
 * Composant de démonstration du thème Dark Romance
 * Affiche la palette de couleurs et les variantes de composants
 */

"use client";

import { ButtonDarkRomance } from "./ui/button-dark-romance";
import { CardDarkRomance, CardDarkRomanceContent, CardDarkRomanceDescription, CardDarkRomanceHeader, CardDarkRomanceTitle } from "./ui/card-dark-romance";
import { BadgeDarkRomance } from "./ui/badge-dark-romance";
import { Heart, Star, Flame, Skull } from "lucide-react";

export function ThemeShowcase() {
  return (
    <div className="space-y-8 p-6">
      {/* Palette de couleurs */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Palette Dark Romance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg" style={{ backgroundColor: "var(--color-blood-red)" }}></div>
            <p className="text-sm font-medium">Blood Red</p>
            <p className="text-xs text-muted-foreground">#8B0000</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg" style={{ backgroundColor: "var(--color-crimson)" }}></div>
            <p className="text-sm font-medium">Crimson</p>
            <p className="text-xs text-muted-foreground">#DC143C</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg border" style={{ backgroundColor: "var(--color-deep-black)" }}></div>
            <p className="text-sm font-medium">Deep Black</p>
            <p className="text-xs text-muted-foreground">#0A0A0A</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg border" style={{ backgroundColor: "var(--color-charcoal)" }}></div>
            <p className="text-sm font-medium">Charcoal</p>
            <p className="text-xs text-muted-foreground">#1A1A1A</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg" style={{ backgroundColor: "var(--color-indigo)" }}></div>
            <p className="text-sm font-medium">Indigo</p>
            <p className="text-xs text-muted-foreground">#4B0082</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg" style={{ backgroundColor: "var(--color-deep-purple)" }}></div>
            <p className="text-sm font-medium">Deep Purple</p>
            <p className="text-xs text-muted-foreground">#2E0854</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg" style={{ backgroundColor: "var(--color-royal-purple)" }}></div>
            <p className="text-sm font-medium">Royal Purple</p>
            <p className="text-xs text-muted-foreground">#6A0DAD</p>
          </div>
          <div className="space-y-2">
            <div 
              className="h-16 w-full rounded-lg" 
              style={{ background: 'var(--gradient-dark-romance)' }}
            ></div>
            <p className="text-sm font-medium">Dark Romance</p>
            <p className="text-xs text-muted-foreground">Gradient</p>
          </div>
        </div>
      </div>

      {/* Variantes de boutons */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Boutons Dark Romance</h2>
        <div className="flex flex-wrap gap-4">
          <ButtonDarkRomance variant="blood-red">Blood Red</ButtonDarkRomance>
          <ButtonDarkRomance variant="deep-purple">Deep Purple</ButtonDarkRomance>
          <ButtonDarkRomance variant="gradient-blood">Gradient Blood</ButtonDarkRomance>
          <ButtonDarkRomance variant="gradient-royal">Gradient Royal</ButtonDarkRomance>
          <ButtonDarkRomance variant="gradient-dark-romance">Dark Romance</ButtonDarkRomance>
          <ButtonDarkRomance variant="outline-crimson">Outline Crimson</ButtonDarkRomance>
          <ButtonDarkRomance variant="outline-purple">Outline Purple</ButtonDarkRomance>
        </div>
      </div>

      {/* Variantes de cartes */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Cartes Dark Romance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardDarkRomance variant="blood-glow">
            <CardDarkRomanceHeader>
              <CardDarkRomanceTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[var(--color-crimson)]" />
                Blood Glow
              </CardDarkRomanceTitle>
            </CardDarkRomanceHeader>
            <CardDarkRomanceContent>
              <p>Carte avec effet glow rouge sang</p>
            </CardDarkRomanceContent>
          </CardDarkRomance>

          <CardDarkRomance variant="purple-glow">
            <CardDarkRomanceHeader>
              <CardDarkRomanceTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-[var(--color-royal-purple)]" />
                Purple Glow
              </CardDarkRomanceTitle>
            </CardDarkRomanceHeader>
            <CardDarkRomanceContent>
              <p>Carte avec effet glow violet royal</p>
            </CardDarkRomanceContent>
          </CardDarkRomance>

          <CardDarkRomance variant="dark-romance">
            <CardDarkRomanceHeader>
              <CardDarkRomanceTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-[var(--color-blood-red)]" />
                Dark Romance
              </CardDarkRomanceTitle>
            </CardDarkRomanceHeader>
            <CardDarkRomanceContent>
              <p>Carte avec gradient dark romance</p>
            </CardDarkRomanceContent>
          </CardDarkRomance>
        </div>
      </div>

      {/* Badges pour les livres */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Badges pour livres</h2>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Types de contenu :</p>
            <div className="flex flex-wrap gap-2">
              <BadgeDarkRomance variant="spicy" className="flex items-center gap-1">
                <Flame className="h-3 w-3" />
                Spicy
              </BadgeDarkRomance>
              <BadgeDarkRomance variant="dark" className="flex items-center gap-1">
                <Skull className="h-3 w-3" />
                Dark
              </BadgeDarkRomance>
              <BadgeDarkRomance variant="romance" className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                Romance
              </BadgeDarkRomance>
              <BadgeDarkRomance variant="trigger">Trigger Warning</BadgeDarkRomance>
              <BadgeDarkRomance variant="trope">Enemies to Lovers</BadgeDarkRomance>
              <BadgeDarkRomance variant="genre">Fantasy Romance</BadgeDarkRomance>
            </div>
          </div>
          
          <div>
            <p className="text-sm font-medium mb-2">Statuts de lecture :</p>
            <div className="flex flex-wrap gap-2">
              <BadgeDarkRomance variant="read">Lu</BadgeDarkRomance>
              <BadgeDarkRomance variant="reading">En cours</BadgeDarkRomance>
              <BadgeDarkRomance variant="to-read">À lire</BadgeDarkRomance>
            </div>
          </div>
        </div>
      </div>

      {/* Exemple de carte de livre */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Exemple de carte de livre</h2>
        <CardDarkRomance variant="book-card" className="max-w-md">
          <CardDarkRomanceHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardDarkRomanceTitle className="text-lg">From Blood and Ash</CardDarkRomanceTitle>
                <CardDarkRomanceDescription>par Jennifer L. Armentrout</CardDarkRomanceDescription>
              </div>
              <div className="flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-[var(--color-crimson)] text-[var(--color-crimson)]" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">9/10</span>
              </div>
            </div>
          </CardDarkRomanceHeader>
          <CardDarkRomanceContent>
            <div className="flex flex-wrap gap-2 mb-3">
              <BadgeDarkRomance variant="spicy" className="text-xs">🌶️ 8/10</BadgeDarkRomance>
              <BadgeDarkRomance variant="dark" className="text-xs">💀 6/10</BadgeDarkRomance>
              <BadgeDarkRomance variant="romance" className="text-xs">❤️ 9/10</BadgeDarkRomance>
            </div>
            <div className="flex flex-wrap gap-1">
              <BadgeDarkRomance variant="genre" className="text-xs">Fantasy</BadgeDarkRomance>
              <BadgeDarkRomance variant="trope" className="text-xs">Chosen One</BadgeDarkRomance>
              <BadgeDarkRomance variant="trope" className="text-xs">Slow Burn</BadgeDarkRomance>
            </div>
          </CardDarkRomanceContent>
        </CardDarkRomance>
      </div>
    </div>
  );
}