'use client';

/**
 * Composant de sélection de Saga simplifié
 * Version sans Command pour éviter les erreurs de props
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Plus, Book, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

export interface SimpleSagaSelectProps {
  value?: string;
  onValueChange: (value: string | undefined) => void;
  onCreateSaga?: () => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
}

export function SimpleSagaSelect({
  value,
  onValueChange,
  onCreateSaga,
  placeholder = "Sélectionnez une saga...",
  disabled = false,
  error
}: SimpleSagaSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Récupérer les sagas avec recherche ou liste complète
  const { data: searchResults, isLoading: isSearching } = useSagaSearch(
    debouncedSearchQuery,
    debouncedSearchQuery.length >= 2
  );
  const { data: allSagas, isLoading: isLoadingAll } = useSagas({
    pageSize: 20,
    enabled: debouncedSearchQuery.length < 2
  });
  
  const sagas = debouncedSearchQuery.length >= 2 ? (searchResults?.data || []) : (allSagas?.data || []);
  const isLoading = isSearching || isLoadingAll;
  
  // Trouver la saga sélectionnée
  const selectedSaga = sagas.find(saga => saga.id === value);
  
  const handleSagaSelect = (saga: Saga) => {
    onValueChange(saga.id);
    setIsOpen(false);
    setSearchQuery('');
  };
  
  const handleClear = () => {
    onValueChange(undefined);
  };
  
  const handleCreateNew = () => {
    onCreateSaga?.();
    setIsOpen(false);
  };
  
  // Filtrer les sagas basé sur la recherche
  const filteredSagas = sagas.filter(saga => 
    saga.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    saga.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            disabled={disabled}
            className={cn(
              "w-full justify-between",
              error && "border-destructive"
            )}
          >
            {selectedSaga ? (
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Book className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{selectedSaga.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={getStatusBadgeVariant(selectedSaga.status)} className="text-xs">
                      {getStatusLabel(selectedSaga.status)}
                    </Badge>
                    {selectedSaga.bookCount && selectedSaga.bookCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {selectedSaga.bookCount} tome{selectedSaga.bookCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une saga..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Recherche en cours...
              </div>
            ) : filteredSagas.length === 0 ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Aucune saga trouvée
                </p>
                {onCreateSaga && (
                  <Button
                    onClick={handleCreateNew}
                    size="sm"
                    variant="outline"
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Créer une nouvelle saga
                  </Button>
                )}
              </div>
            ) : (
              <div className="py-1">
                {filteredSagas.map((saga) => (
                  <div
                    key={saga.id}
                    onClick={() => handleSagaSelect(saga)}
                    className={cn(
                      "flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50 mx-1 rounded-sm transition-colors",
                      saga.id === value && "bg-muted"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Book className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{saga.name}</div>
                        {saga.description && (
                          <div className="text-xs text-muted-foreground truncate mt-1">
                            {saga.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <Badge variant={getStatusBadgeVariant(saga.status)} className="text-xs">
                        {getStatusLabel(saga.status)}
                      </Badge>
                      {saga.bookCount && saga.bookCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {saga.bookCount} tome{saga.bookCount > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Bouton pour créer une nouvelle saga */}
            {onCreateSaga && filteredSagas.length > 0 && (
              <div className="border-t p-2">
                <Button
                  onClick={handleCreateNew}
                  className="w-full gap-2"
                  variant="ghost"
                  size="sm"
                >
                  <Plus className="w-4 h-4" />
                  Créer une nouvelle saga
                </Button>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {selectedSaga && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Effacer la sélection
        </Button>
      )}
      
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}