'use client';

/**
 * Enhanced Book Form With Saga - Wrapper qui ajoute la gestion des Sagas à EnhancedBookForm
 * Combine la recherche externe avec le formulaire de livre ET la gestion des sagas
 */

import React, { useState, useEffect } from 'react';
import { EnhancedBookForm, type EnhancedBookFormProps } from './enhanced-book-form';
import type { Book, BookCreateInput, BookUpdateInput } from '@/types/book';

// Types unifiés pour gérer création et édition avec saga
type BookFormDataWithSaga = (BookCreateInput | BookUpdateInput) & {
  sagaId?: string;
  sagaOrder?: number;
};

interface EnhancedBookFormWithSagaProps extends Omit<EnhancedBookFormProps, 'onSubmit'> {
  onSubmit: (data: BookFormDataWithSaga) => void | Promise<void>;
  initialData?: Book;
}

export function EnhancedBookFormWithSaga({
  initialData,
  onSubmit,
  ...bookFormProps
}: EnhancedBookFormWithSagaProps) {
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
    // Valider les champs saga
    const sagaValidationPassed = validateSagaFields();
    
    if (!sagaValidationPassed) {
      // Empêcher la soumission si la validation saga échoue
      return;
    }
    
    // Combiner les données du livre avec les données saga
    const dataWithSaga: BookFormDataWithSaga = {
      ...bookData,
      sagaId,
      sagaOrder,
    };

    console.log('🔍 Frontend - Saga data being sent:', {
      sagaId,
      sagaOrder,
      hasSagaId: sagaId !== undefined,
      hasSagaOrder: sagaOrder !== undefined,
      dataWithSaga: { sagaId: dataWithSaga.sagaId, sagaOrder: dataWithSaga.sagaOrder }
    });
    
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
    <EnhancedBookForm
      {...bookFormProps}
      initialData={initialData}
      onSubmit={handleSubmitWithSaga}
      // Passer les props saga au formulaire
      sagaId={sagaId}
      sagaOrder={sagaOrder}
      onSagaIdChange={setSagaId}
      onSagaOrderChange={setSagaOrder}
      sagaErrors={sagaErrors}
      excludeBookId={initialData?.id}
    />
  );
}