'use client';

/**
 * Dialog pour créer une nouvelle saga en inline
 * Utilisé depuis le sélecteur de saga dans le formulaire de livre
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useCreateSaga } from '@/hooks/use-sagas';
import type { SagaCreateInput, SagaStatus, Saga } from '@/types/saga';

// Schéma de validation
const createSagaSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères'),
  description: z
    .string()
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
    .optional(),
  status: z.enum(['ONGOING', 'COMPLETED', 'HIATUS', 'UNKNOWN']).optional(),
});

type CreateSagaFormData = z.infer<typeof createSagaSchema>;

interface CreateSagaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (saga: Saga) => void;
}

// Options de statut avec libellés français
const statusOptions = [
  { value: 'ONGOING', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminée' },
  { value: 'HIATUS', label: 'En pause' },
  { value: 'UNKNOWN', label: 'Inconnu' },
] as const;

export function CreateSagaDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateSagaDialogProps) {
  const createSagaMutation = useCreateSaga();
  
  const form = useForm<CreateSagaFormData>({
    resolver: zodResolver(createSagaSchema),
    defaultValues: {
      name: '',
      description: '',
      status: 'ONGOING',
    },
  });
  
  const onSubmit = async (data: CreateSagaFormData) => {
    try {
      const response = await createSagaMutation.mutateAsync({
        ...data,
        status: data.status as SagaStatus || 'ONGOING',
      });
      
      if (response.success && response.data) {
        onSuccess?.(response.data);
        onOpenChange(false);
        form.reset();
      }
    } catch (error) {
      // L'erreur sera gérée par le hook useCreateSaga
      console.error("Erreur lors de la création de la saga:", error);
    }
  };
  
  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Créer une nouvelle saga
          </DialogTitle>
          <DialogDescription>
            Créez une nouvelle saga pour organiser vos livres en série.
            Vous pourrez ensuite y ajouter des livres avec un ordre spécifique.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nom de la saga *
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Twisted Series, Cat and Mouse Duet..."
                      {...field}
                      disabled={createSagaMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Statut</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={createSagaMutation.isPending}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un statut" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez brièvement cette saga..."
                      className="min-h-[80px] resize-none"
                      {...field}
                      disabled={createSagaMutation.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        
        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={createSagaMutation.isPending}
          >
            Annuler
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={createSagaMutation.isPending}
            className="gap-2"
          >
            {createSagaMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Créer la saga
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}