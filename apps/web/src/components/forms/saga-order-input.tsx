'use client';

/**
 * Composant pour saisir l'ordre d'un livre dans une saga
 * Avec validation et suggestions d'ordre disponible
 */

import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, HelpCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useSagaNextOrder, useSagaOrderAvailable } from '@/hooks/use-sagas';
import { useDebounce } from '@/hooks/use-debounce';
import type { SagaOrderInputProps } from '@/types/saga';
import { cn } from '@/lib/utils';

export function SagaOrderInput({
  sagaId,
  value,
  onChange,
  error,
  disabled = false,
  excludeBookId,
}: SagaOrderInputProps) {
  const [localValue, setLocalValue] = useState(value !== undefined ? value.toString() : '');
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const [initialValue] = useState(value); // Conserver la valeur initiale
  const debouncedValue = useDebounce(localValue, 500);
  const numberValue = debouncedValue ? parseInt(debouncedValue) : undefined;
  
  // Ne valider que si l'utilisateur a interagi ET que les valeurs ont changé des valeurs initiales
  const shouldValidate = hasUserInteracted && numberValue !== initialValue;
  
  // Query pour obtenir le prochain ordre disponible
  const { data: nextOrderResponse, isLoading: isLoadingNextOrder } = useSagaNextOrder(
    sagaId || '', 
    !!sagaId
  );
  
  // Query pour vérifier si l'ordre saisi est disponible
  const { data: orderAvailableResponse, isLoading: isCheckingOrder } = useSagaOrderAvailable(
    sagaId || '', 
    numberValue || 0, 
    excludeBookId, // Exclure le livre actuel pour éviter le conflit avec soi-même
    !!sagaId && !!numberValue && numberValue > 0 && shouldValidate
  );
  
  const nextOrder = nextOrderResponse?.data?.nextOrder;
  const isOrderAvailable = orderAvailableResponse?.available;
  
  // Synchroniser avec la prop value
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value.toString());
    }
  }, [value]);
  
  // Notifier les changements après debounce
  useEffect(() => {
    const numValue = debouncedValue && !isNaN(parseInt(debouncedValue)) 
      ? parseInt(debouncedValue) 
      : undefined;
    
    if (numValue !== value) {
      onChange(numValue);
    }
  }, [debouncedValue, onChange, value]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Autoriser seulement les nombres positifs
    if (inputValue === '' || /^[1-9]\d*$/.test(inputValue)) {
      setLocalValue(inputValue);
      setHasUserInteracted(true); // Marquer l'interaction utilisateur
    }
  };
  
  const handleUseNextOrder = () => {
    if (nextOrder) {
      setLocalValue(nextOrder.toString());
      setHasUserInteracted(true); // Marquer l'interaction utilisateur
      onChange(nextOrder);
    }
  };
  
  // Déterminer l'état de validation
  const getValidationState = () => {
    if (!sagaId || !numberValue) return 'neutral';
    if (!shouldValidate) return 'neutral'; // Pas de validation si pas d'interaction
    if (isCheckingOrder) return 'loading';
    if (error) return 'error';
    if (isOrderAvailable === false) return 'conflict';
    if (isOrderAvailable === true) return 'valid';
    return 'neutral';
  };
  
  const validationState = getValidationState();
  
  const renderValidationIcon = () => {
    switch (validationState) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'valid':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'conflict':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };
  
  const getErrorMessage = () => {
    if (error) return error;
    if (validationState === 'conflict' && shouldValidate) {
      return `L'ordre ${numberValue} est déjà occupé dans cette saga`;
    }
    return null;
  };
  
  if (!sagaId) {
    return null; // Ne pas afficher si aucune saga sélectionnée
  }
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="saga-order" className="text-sm font-medium">
          Ordre dans la saga *
        </Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-auto p-0">
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Numéro d'ordre du tome dans la saga (ex: 1, 2, 3...)</p>
              <p>Chaque ordre doit être unique dans une saga.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Input
            id="saga-order"
            type="text"
            inputMode="numeric"
            value={localValue}
            onChange={handleInputChange}
            disabled={disabled || isLoadingNextOrder}
            placeholder="Ex: 1"
            className={cn(
              "pr-10",
              validationState === 'conflict' && "border-destructive",
              validationState === 'valid' && "border-green-500"
            )}
          />
          {renderValidationIcon() && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {renderValidationIcon()}
            </div>
          )}
        </div>
        
        {nextOrder && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUseNextOrder}
            disabled={disabled || isLoadingNextOrder}
            className="shrink-0"
          >
            {isLoadingNextOrder ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              `Utiliser ${nextOrder}`
            )}
          </Button>
        )}
      </div>
      
      {getErrorMessage() && (
        <p className="text-sm text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {getErrorMessage()}
        </p>
      )}
      
      {validationState === 'valid' && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Ordre disponible
        </p>
      )}
      
      {nextOrder && nextOrder !== numberValue && (
        <p className="text-sm text-muted-foreground">
          Prochain ordre suggéré: {nextOrder}
        </p>
      )}
    </div>
  );
}