'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { booksApi, categoriesApi, tagsApi } from '@/utils/orpc';
import { EnhancedBookFormWithSaga } from './enhanced-book-form-with-saga';
import { useToast } from '@/hooks/use-toast';
import type { Book, BookCreateInput, BookUpdateInput } from '@/types/book';

// Types unifiés pour gérer création et édition avec saga
type BookFormDataWithSaga = (BookCreateInput | BookUpdateInput) & {
  sagaId?: string;
  sagaOrder?: number;
};

interface AdminBookFormProps {
  book?: Book;
  onSuccess?: (book: Book) => void;
  onCancel?: () => void;
}

export function AdminBookForm({ book, onSuccess, onCancel }: AdminBookFormProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { toast } = useToast();

  // Récupérer les catégories et tags disponibles
  const { data: categoriesResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.getAll(),
  });

  const { data: tagsResponse } = useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.getAll(),
  });

  const categories = categoriesResponse?.data || [];
  const tags = tagsResponse?.data || [];

  // Mutation pour créer un livre
  const createBookMutation = useMutation({
    mutationFn: (data: BookCreateInput) => booksApi.create(data),
    onSuccess: async (response) => {
      if (response.data) {
        // Attendre les invalidations de cache avec exactitude false
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin-books'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['books'], exact: false }),
          // Force un refetch immédiat de la liste admin
          queryClient.invalidateQueries({ queryKey: ['admin-books', 'all'], exact: true }),
        ]);

        // Préfetcher le livre pour éviter le 404
        if (response.data?.id) {
          await queryClient.prefetchQuery({
            queryKey: ['book', response.data.id],
            queryFn: () => booksApi.getById(response.data!.id),
            staleTime: 5 * 60 * 1000, // 5 minutes
          });
        }

        toast({
          title: "Livre créé",
          description: "Le livre a été ajouté avec succès",
        });

        if (onSuccess) onSuccess(response.data);
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le livre",
        variant: "destructive",
      });
      console.error('Erreur création livre:', error);
    },
  });

  // Mutation pour mettre à jour un livre
  const updateBookMutation = useMutation({
    mutationFn: (data: BookUpdateInput) => booksApi.update(book!.id, data),
    onSuccess: async (response) => {
      if (response.data) {
        // Mettre à jour directement le cache avec les nouvelles données AVANT d'invalider
        queryClient.setQueryData(['book', response.data.id], response.data);

        // Attendre les invalidations de cache (sauf pour le livre en cours d'édition)
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ['admin-books'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['books'], exact: false }),
          // Force un refetch immédiat de la liste admin
          queryClient.invalidateQueries({ queryKey: ['admin-books', 'all'], exact: true }),
          // Invalider aussi les caches liés aux relations
          queryClient.invalidateQueries({ queryKey: ['categories'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['tags'], exact: false }),
          queryClient.invalidateQueries({ queryKey: ['sagas'] }),
        ]);

        toast({
          title: "Livre mis à jour",
          description: "Les modifications ont été sauvegardées",
        });

        if (onSuccess) onSuccess(response.data);
      }
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le livre",
        variant: "destructive",
      });
      console.error('Erreur mise à jour livre:', error);
    },
  });

  const handleSubmit = async (data: BookFormDataWithSaga) => {
    if (book) {
      // Mode édition - s'assurer que les données ont un ID
      const updateData = { ...data, id: book.id };
      await updateBookMutation.mutateAsync(updateData);
    } else {
      // Mode création - les données doivent être au format BookCreateInput
      await createBookMutation.mutateAsync(data as BookCreateInput);
    }
  };

  const isLoading = createBookMutation.isPending || updateBookMutation.isPending;

  return (
    <EnhancedBookFormWithSaga
      mode={book ? 'edit' : 'create'}
      initialData={book}
      onSubmit={handleSubmit}
      onCancel={onCancel || (() => {})}
      loading={isLoading}
      availableCategories={categories || []}
      availableTags={tags || []}
    />
  );
}