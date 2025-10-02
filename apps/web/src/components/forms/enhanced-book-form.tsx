"use client";

// =============================================================================
// 📚 ENHANCED BOOK FORM - FORMULAIRE AVEC RECHERCHE INTÉGRÉE
// =============================================================================
// Combine la recherche externe avec le formulaire de livre
// Permet d'importer automatiquement des données et de les modifier avant sauvegarde

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { BookSearchSection } from './book-search-section';
import { BookForm } from './book-form';
import type { ExternalBookResult } from '@/types/api';
import type { BookFormProps } from './book-form';

// =============================================================================
// 🎨 INTERFACES ET TYPES
// =============================================================================

export interface EnhancedBookFormProps extends Omit<BookFormProps, 'onSearchExternal'> {
  // Hérite de toutes les props de BookForm sauf onSearchExternal qui est géré en interne
  
  // Props saga optionnelles
  sagaId?: string;
  sagaOrder?: number;
  onSagaIdChange?: (sagaId: string | undefined) => void;
  onSagaOrderChange?: (order: number | undefined) => void;
  sagaErrors?: {sagaId?: string; sagaOrder?: string};
}

// =============================================================================
// 🔧 UTILITAIRES DE MAPPING
// =============================================================================

/**
 * Convertit un livre externe en données de formulaire
 */
const mapExternalBookToFormData = (book: ExternalBookResult) => {
  // Normaliser le code de langue pour le backend (2 caractères uppercase)
  const normalizeLanguageCode = (langCode: string) => {
    if (!langCode) return '';
    
    // Mapper les codes longs vers les codes courts
    const langMap: { [key: string]: string } = {
      'eng': 'EN',
      'english': 'EN',
      'anglais': 'EN',
      'fre': 'FR', 
      'fra': 'FR',
      'french': 'FR',
      'francais': 'FR',
      'français': 'FR',
      'spa': 'ES',
      'spanish': 'ES',
      'espagnol': 'ES',
      'ger': 'DE',
      'deu': 'DE',
      'german': 'DE',
      'allemand': 'DE',
      'ita': 'IT',
      'italian': 'IT',
      'italien': 'IT',
      'por': 'PT',
      'portuguese': 'PT',
      'portugais': 'PT',
      'rus': 'RU',
      'russian': 'RU',
      'russe': 'RU',
    };
    
    const normalized = langCode.toLowerCase();
    const mapped = langMap[normalized];
    
    if (mapped) return mapped;
    
    // Si c'est déjà un code de 2 caractères, le retourner en uppercase
    if (langCode.length === 2) {
      return langCode.toUpperCase();
    }
    
    // Par défaut, prendre les 2 premiers caractères
    return langCode.substring(0, 2).toUpperCase();
  };

  // Traitement de la date de publication
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      // Si c'est juste une année
      if (/^\d{4}$/.test(dateStr)) {
        return dateStr + '-01-01';
      }
      // Si c'est déjà au format YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
      }
      // Essayer de parser la date
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      return '';
    } catch {
      return '';
    }
  };

  return {
    // Champs de base
    titre: book.titre || '',
    auteur: book.auteur || '',
    isbn: book.isbn || '',
    image_couverture: book.image_couverture || '',
    
    // Métadonnées améliorées
    resume_officiel: book.resume_officiel || '',
    editeur: book.editeur || '',
    date_publication: formatDate(book.date_publication || ''),
    nombre_pages: book.nombre_pages || undefined,
    langue: normalizeLanguageCode(book.langue || ''),
    
    // Valeurs par défaut pour les autres champs
    date_lecture: '',
    statut: 'A_LIRE' as const,
    
    // Notations par défaut
    note_generale: 5,
    niveau_spicy: 1,
    niveau_dark: 1,
    niveau_romance: 5,
    intensite_emotionnelle: 5,
    danger: 1,
    violence: 1,
    originalite: 5,
    rythme: 'MEDIUM_BURN' as const,
    
    // Critiques vides
    resume_personnel: '',
    critique_detaillee: '',
    citations_favorites: '',
    pourquoi_aimer: '',
    questions_sur_le_livre: '',
    recommandation_personnalisee: '',
    
    // Relations vides
    categories: [],
    tags: [],
    
    // Marquer comme importé
    ajout_manuel: false
  };
};

// =============================================================================
// 🎯 COMPOSANT PRINCIPAL
// =============================================================================

export function EnhancedBookForm(props: EnhancedBookFormProps) {
  const [formData, setFormData] = useState(props.initialData);
  const [hasImported, setHasImported] = useState(false);

  // Gérer la sélection d'un livre depuis la recherche externe
  const handleBookSelect = (book: ExternalBookResult) => {
    const mappedData = mapExternalBookToFormData(book);
    setFormData(mappedData as any);
    setHasImported(true);

    toast.success('Données importées', {
      description: 'Les informations de ' + book.titre + ' ont été chargées dans le formulaire'
    });
  };

  // Réinitialiser quand les props changent
  useEffect(() => {
    if (props.initialData) {
      setFormData(props.initialData);
      setHasImported(false);
    }
  }, [props.initialData]);

  return (
    <div className="space-y-6">
      {/* Section de recherche (uniquement en mode création) */}
      {props.mode === "create" && !hasImported && (
        <BookSearchSection
          onBookSelect={handleBookSelect}
          className="mb-6"
        />
      )}

      {/* Message d'information si importé */}
      {hasImported && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full" />
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Données importées depuis une source externe.</strong> 
              Vous pouvez modifier tous les champs ci-dessous avant de sauvegarder.
            </p>
          </div>
        </div>
      )}

      {/* Formulaire principal */}
      <BookForm
        {...props}
        initialData={formData}
        // On retire la recherche externe car elle est gérée par BookSearchSection
        onSearchExternal={undefined}
      />
    </div>
  );
}