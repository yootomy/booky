'use client';

/**
 * Composant de sélection de Saga avec recherche autocomplete
 * Permet de sélectionner une saga existante ou d'en créer une nouvelle
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Book, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { useSagaSearch, useSagas } from '@/hooks/use-sagas';
import { useDebounce } from '@/hooks/use-debounce';
import type { SagaSelectProps } from '@/types/saga';
import type { Saga, SagaStatus } from '@/types/saga';
import { cn } from '@/lib/utils';

// Utilitaire pour obtenir la couleur du badge de statut
const getStatusBadgeVariant = (status: SagaStatus) => {
  switch (status) {
    case 'ONGOING':
      return 'default';
    case 'COMPLETED':
      return 'secondary';
    case 'HIATUS':
      return 'outline';
    default:
      return 'destructive';
  }
};

// Utilitaire pour obtenir le libellé du statut
const getStatusLabel = (status: SagaStatus) => {
  switch (status) {
    case 'ONGOING':
      return 'En cours';
    case 'COMPLETED':
      return 'Terminée';
    case 'HIATUS':
      return 'Pause';
    case 'UNKNOWN':
      return 'Inconnu';
    default:
      return status;
  }
};

interface SagaOptionProps {
  saga: Saga;
  onSelect: (saga: Saga) => void;
  isSelected?: boolean;
}

function SagaOption({ saga, onSelect, isSelected }: SagaOptionProps) {
  return (
    <CommandItem
      key={saga.id}
      value={saga.name}
      onSelect={() => onSelect(saga)}
      className={cn(
        "flex items-center justify-between p-3 cursor-pointer",
        isSelected && "bg-accent"
      )}
    >
      <div className="flex flex-col gap-1 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{saga.name}</span>
          <Badge variant={getStatusBadgeVariant(saga.status)} className="text-xs">
            {getStatusLabel(saga.status)}
          </Badge>
        </div>
        {saga.description && (
          <p className="text-sm text-muted-foreground line-clamp-1">
            {saga.description}
          </p>
        )}
        {saga.bookCount !== undefined && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Book className="w-3 h-3" />
            <span>{saga.bookCount} tome{saga.bookCount > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
    </CommandItem>
  );
}

export function SagaSelect({
  value,
  onChange,
  placeholder="Sélectionner une saga...",
  disabled = false,
  error,
  required = false,
  onCreateSaga
}: SagaSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedQuery = useDebounce(searchQuery, 300);
  
  // Query pour récupérer toutes les sagas (premières options)
  const { data: allSagasResponse } = useSagas({
    pageSize: 20,
    enabled: !debouncedQuery
  });
  
  // Query pour la recherche
  const { data: searchResponse } = useSagaSearch(
    debouncedQuery, 
    debouncedQuery.length >= 2
  );
  
  // Déterminer les sagas à afficher
  const sagas = debouncedQuery.length >= 2 
    ? (searchResponse?.data || [])
    : (allSagasResponse?.data || []);
  
  // Saga sélectionnée
  const selectedSaga = sagas.find(saga => saga.id === value);
  
  const handleSelect = (saga: Saga) => {
    onChange(saga.id);
    setOpen(false);
    setSearchQuery('');
  };
  
  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };
  
  const handleCreateNew = () => {
    setOpen(false);
    if (onCreateSaga) {
      // Le dialog de création sera géré par le parent
    }
  };
  
  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              "w-full justify-between h-auto p-3",
              error && "border-destructive",
              !selectedSaga && "text-muted-foreground"
            )}
          >
            {selectedSaga ? (
              <div className="flex flex-col items-start gap-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedSaga.name}</span>
                  <Badge variant={getStatusBadgeVariant(selectedSaga.status)} className="text-xs">
                    {getStatusLabel(selectedSaga.status)}
                  </Badge>
                </div>
                {selectedSaga.bookCount !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Book className="w-3 h-3" />
                    <span>{selectedSaga.bookCount} tome{selectedSaga.bookCount > 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Rechercher une saga..."
            />
            <CommandEmpty>
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Aucune saga trouvée
                </p>
                {onCreateSaga && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateNew}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Créer une nouvelle saga
                  </Button>
                )}
              </div>
            </CommandEmpty>
            <CommandGroup>
              {sagas.map((saga) => (
                <SagaOption
                  key={saga.id}
                  saga={saga}
                  onSelect={handleSelect}
                  isSelected={saga.id === value}
                />
              ))}
              {sagas.length > 0 && onCreateSaga && (
                <CommandItem onSelect={handleCreateNew} className="border-t">
                  <div className="flex items-center gap-2 text-primary">
                    <Plus className="w-4 h-4" />
                    <span>Créer une nouvelle saga</span>
                  </div>
                </CommandItem>
              )}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      {selectedSaga && (
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{selectedSaga.name}</span>
                  <Badge variant={getStatusBadgeVariant(selectedSaga.status)} className="text-xs">
                    {getStatusLabel(selectedSaga.status)}
                  </Badge>
                </div>
                {selectedSaga.description && (
                  <p className="text-xs text-muted-foreground">
                    {selectedSaga.description}
                  </p>
                )}
                {selectedSaga.bookCount !== undefined && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Book className="w-3 h-3" />
                    <span>{selectedSaga.bookCount} tome{selectedSaga.bookCount > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="text-muted-foreground hover:text-foreground"
              >
                Retirer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}