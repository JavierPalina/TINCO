"use client";

import { useState } from 'react';
import { Eye, MessageSquare, StickyNote } from 'lucide-react';
import { Client } from '@/types/client';
import { Button } from '../ui/button';

import { ViewNotesDialog } from './ViewNotesDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { ViewInteractionsDialog } from './ViewInteractionsDialog';
import { AddInteractionDialog } from './AddInteractionDialog';

type Props = {
  client: Client;
  actionType: 'notas' | 'interacciones';
}

// Definimos qué diálogo está activo: 'view', 'add', o ninguno (null)
type ActiveDialog = 'view' | 'add' | null;

export function TableCellActions({ client, actionType }: Props) {
  // 1. Estado unificado para controlar qué diálogo se muestra. ¡Mucho más limpio!
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  // 2. Función para cambiar del diálogo de "Ver" al de "Agregar".
  // Se la pasaremos como prop al componente de visualización.
  const handleOpenAdd = () => {
    setActiveDialog('add');
  };
  
  const isNotes = actionType === 'notas';
  const buttonTitle = isNotes ? "Ver / Añadir Notas" : "Ver / Añadir Interacciones";
  const Icon = isNotes ? StickyNote : MessageSquare;

  return (
    <>
      {/* 3. Botón de entrada único que siempre abre el diálogo de "Ver" primero */}
      <div className="flex items-center justify-center">
        <Button 
          onClick={() => setActiveDialog('view')} 
          title={buttonTitle} 
          className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary"
        >
          <Icon className="h-4 w-4" />
        </Button>
      </div>
      
      {/* 4. Renderizado condicional de los diálogos basado en el estado unificado */}
      {isNotes ? (
        <>
          <ViewNotesDialog 
            client={client} 
            isOpen={activeDialog === 'view'} 
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
            onAddNew={handleOpenAdd} 
          />
          <AddNoteDialog 
            client={client} 
            isOpen={activeDialog === 'add'} 
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
          />
        </>
      ) : (
        <>
          <ViewInteractionsDialog 
            client={client} 
            isOpen={activeDialog === 'view'} 
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
            onAddNew={handleOpenAdd}
          />
          <AddInteractionDialog 
            client={client} 
            isOpen={activeDialog === 'add'} 
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
          />
        </>
      )}
    </>
  );
}