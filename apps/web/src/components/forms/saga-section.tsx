'use client';

/**
 * Section Saga pour les formulaires de livre
 * Gère le toggle saga + sélection saga + ordre avec création inline
 */

import React, { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SimpleSagaSelect } from './saga-select-simple';
import { SagaOrderInput } from './saga-order-input';
import { CreateSagaDialog } from './create-saga-dialog';
import type { Saga } from '@/types/saga';

interface SagaSectionProps {
  // Valeurs actuelles
  sagaId?: string;
  sagaOrder?: number;
  
  // Callbacks pour les changements
  onSagaIdChange: (sagaId: string | undefined) => void;
  onSagaOrderChange: (order: number | undefined) => void;
  
  // États
  disabled?: boolean;
  errors?: {
    sagaId?: string;
    sagaOrder?: string;
  };
  
  // ID du livre à exclure pour la validation d'ordre (en mode édition)
  excludeBookId?: string;
}

export function SagaSection({
  sagaId,
  sagaOrder,
  onSagaIdChange,
  onSagaOrderChange,
  disabled = false,
  errors = {},
  excludeBookId
}: SagaSectionProps) {
  const [hasSaga, setHasSaga] = useState(!!sagaId);
  const [createSagaDialogOpen, setCreateSagaDialogOpen] = useState(false);
  
  // Synchroniser l'état du toggle avec la valeur saga
  useEffect(() => {
    setHasSaga(!!sagaId);
  }, [sagaId]);
  
  const handleToggleChange = (enabled: boolean) => {
    setHasSaga(enabled);
    
    if (!enabled) {
      // Désactiver la saga : envoyer null pour la déliaison explicite
      onSagaIdChange(null as any); // null sera converti en undefined côté parent mais signalera l'intention de délier
      onSagaOrderChange(null as any);
    }
  };
  
  const handleSagaChange = (selectedSagaId: string | undefined) => {
    onSagaIdChange(selectedSagaId);
    
    // Si on change de saga, réinitialiser l'ordre
    if (selectedSagaId !== sagaId) {
      onSagaOrderChange(undefined);
    }
  };
  
  const handleCreateSagaSuccess = (newSaga: Saga) => {
    // Sélectionner automatiquement la saga créée
    onSagaIdChange(newSaga.id);
    onSagaOrderChange(undefined); // Reset order for new saga
    setCreateSagaDialogOpen(false);
  };
  
  const handleCreateSagaClick = () => {
    setCreateSagaDialogOpen(true);
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base">Saga</CardTitle>
            <CardDescription>
              Ce livre fait-il partie d'une série ?
            </CardDescription>
          </div>
          <Switch
            checked={hasSaga}
            onCheckedChange={handleToggleChange}
            disabled={disabled}
            aria-label="Ce livre appartient à une saga"
          />
        </div>
      </CardHeader>
      
      {hasSaga && (
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="saga-select">
              Saga *
            </Label>
            <SimpleSagaSelect
              value={sagaId}
              onValueChange={handleSagaChange}
              disabled={disabled}
              error={errors.sagaId}
              onCreateSaga={handleCreateSagaClick}
              placeholder="Sélectionner ou créer une saga..."
            />
          </div>
          
          {sagaId && (
            <SagaOrderInput
              sagaId={sagaId}
              value={sagaOrder}
              onChange={onSagaOrderChange}
              disabled={disabled}
              error={errors.sagaOrder}
              excludeBookId={excludeBookId}
            />
          )}
          
          {!sagaId && (
            <div className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-md">
              💡 Sélectionnez d'abord une saga pour définir l'ordre du livre
            </div>
          )}
        </CardContent>
      )}
      
      <CreateSagaDialog
        open={createSagaDialogOpen}
        onOpenChange={setCreateSagaDialogOpen}
        onSuccess={handleCreateSagaSuccess}
      />
    </Card>
  );
}