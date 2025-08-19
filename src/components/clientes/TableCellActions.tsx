"use client";

import { useState } from 'react';
import { Eye, MessageSquarePlus, StickyNote, PlusCircle } from 'lucide-react';
import { Client } from '@/types/client';

import { ViewNotesDialog } from './ViewNotesDialog';
import { AddNoteDialog } from './AddNoteDialog';
import { ViewInteractionsDialog } from './ViewInteractionsDialog';
import { AddInteractionDialog } from './AddInteractionDialog';

type Props = { client: Client; actionType: 'notas' | 'interacciones'; }

export function TableCellActions({ client, actionType }: Props) {
  const [isViewNotesOpen, setViewNotesOpen] = useState(false);
  const [isAddNoteOpen, setAddNoteOpen] = useState(false);
  const [isViewInteractionsOpen, setViewInteractionsOpen] = useState(false);
  const [isAddInteractionOpen, setAddInteractionOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-center gap-2">
        {actionType === 'notas' && (
          <>
            <button onClick={() => setViewNotesOpen(true)} title="Ver Notas"><Eye className="h-4 w-4 text-muted-foreground hover:text-primary" /></button>
            <button onClick={() => setAddNoteOpen(true)} title="Añadir Nota"><PlusCircle className="h-4 w-4 text-muted-foreground hover:text-primary" /></button>
          </>
        )}
        {actionType === 'interacciones' && (
          <>
            <button onClick={() => setViewInteractionsOpen(true)} title="Ver Interacciones"><Eye className="h-4 w-4 text-muted-foreground hover:text-primary" /></button>
            <button onClick={() => setAddInteractionOpen(true)} title="Añadir Interacción"><MessageSquarePlus className="h-4 w-4 text-muted-foreground hover:text-primary" /></button>
          </>
        )}
      </div>
      
      {/* Diálogos que se abren según el estado */}
      <ViewNotesDialog client={client} isOpen={isViewNotesOpen} onOpenChange={setViewNotesOpen} />
      <AddNoteDialog client={client} isOpen={isAddNoteOpen} onOpenChange={setAddNoteOpen} />
      <ViewInteractionsDialog client={client} isOpen={isViewInteractionsOpen} onOpenChange={setViewInteractionsOpen} />
      <AddInteractionDialog client={client} isOpen={isAddInteractionOpen} onOpenChange={setAddInteractionOpen} />
    </>
  );
}