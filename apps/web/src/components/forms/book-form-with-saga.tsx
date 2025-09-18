'use client';

/**
 * Wrapper du BookForm qui ajoute la gestion des Sagas
 * Intègre la section saga dans le formulaire de livre existant
 */

import React, { useState, useEffect } from 'react';
import { BookForm, type BookFormProps } from './book-form';
import { SagaSection } from './saga-section';
import type { Book, BookCreateInput, BookUpdateInput } from '@/types/book';

// Types unifiés pour gérer création et édition avec saga
type BookFormDataWithSaga = (BookCreateInput | BookUpdateInput) & {
  sagaId?: string;
  sagaOrder?: number;
};

interface BookFormWithSagaProps extends Omit<BookFormProps, 'onSubmit'> {
  onSubmit: (data: BookFormDataWithSaga) => void | Promise<void>;
  initialData?: Book;
}

export function BookFormWithSaga({
  initialData,
  onSubmit,
  ...bookFormProps
}: BookFormWithSagaProps) {
  // États locaux pour gérer les valeurs saga
  const [sagaId, setSagaId] = useState<string | undefined>(initialData?.sagaId);
  const [sagaOrder, setSagaOrder] = useState<number | undefined>(initialData?.sagaOrder);
  const [sagaErrors, setSagaErrors] = useState<{sagaId?: string; sagaOrder?: string}>({});
  
  // Synchroniser avec les données initiales
  useEffect(() => {
    if (initialData) {
      setSagaId(initialData.sagaId);
      setSagaOrder(initialData.sagaOrder);
    }
  }, [initialData]);
  
  // Validation des champs saga
  const validateSagaFields = () => {
    const errors: {sagaId?: string; sagaOrder?: string} = {};
    
    // Si saga est activée (sagaId défini), l'ordre est obligatoire
    if (sagaId && !sagaOrder) {
      errors.sagaOrder = 'L\'ordre dans la saga est obligatoire';
    }
    
    // Si ordre défini mais pas de saga
    if (sagaOrder && !sagaId) {
      errors.sagaId = 'Veuillez sélectionner une saga';
    }
    
    setSagaErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Wrapper pour la soumission qui inclut les données saga
  const handleSubmitWithSaga = async (bookData: BookCreateInput | BookUpdateInput) => {
    // Valider les champs saga seulement si une saga est définie
    if (sagaId) {
      const sagaValidationPassed = validateSagaFields();
      
      if (!sagaValidationPassed) {
        // Empêcher la soumission si la validation saga échoue
        return;
      }
    }
    
    // Combiner les données du livre avec les données saga
    // Si pas de saga, envoyer explicitement null pour la déliaison
    const dataWithSaga: BookFormDataWithSaga = {
      ...bookData,
      sagaId: sagaId || undefined,
      sagaOrder: sagaId ? sagaOrder : undefined,
    };
    
    try {
      await onSubmit(dataWithSaga);
    } catch (error) {
      // Gérer les erreurs spécifiques aux conflits d'ordre
      if (error && typeof error === 'object' && 'statusCode' in error) {
        const apiError = error as { statusCode: number; error?: string };
        if (apiError.statusCode === 409) {
          setSagaErrors({
            sagaOrder: apiError.error || 'Cet ordre est déjà occupé dans cette saga'
          });
          return;
        }
      }
      
      // Relancer l'erreur pour qu'elle soit gérée par le composant parent
      throw error;
    }
  };
  
  // Réinitialiser les erreurs saga quand les valeurs changent
  useEffect(() => {
    if (sagaErrors.sagaId || sagaErrors.sagaOrder) {
      setSagaErrors({});
    }
  }, [sagaId, sagaOrder]);
  
  return (
    <div className="space-y-6">
      {/* Section Saga en premier */}
      <SagaSection
        sagaId={sagaId}
        sagaOrder={sagaOrder}
        onSagaIdChange={setSagaId}
        onSagaOrderChange={setSagaOrder}
        disabled={bookFormProps.loading}
        errors={sagaErrors}
        excludeBookId={initialData?.id}
      />
      
      {/* Formulaire de livre existant */}
      <BookForm
        {...bookFormProps}
        initialData={initialData}
        onSubmit={handleSubmitWithSaga}
      />
    </div>
  );
}