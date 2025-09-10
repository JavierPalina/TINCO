"use client";

import { useState } from 'react';
import { Eye, MessageSquarePlus, StickyNote, PlusCircle } from 'lucide-react';
import { Client } from '@/types/client';
import { Button } from '../ui/button';

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
            <Button onClick={() => setViewNotesOpen(true)} title="Ver Notas" className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary" >
              <Eye className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddNoteOpen(true)} title="Añadir Nota" className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </>
        )}
        {actionType === 'interacciones' && (
          <>
            <Button onClick={() => setViewInteractionsOpen(true)} title="Ver Interacciones" className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary">
              <Eye className="h-4 w-4" />
            </Button>
            <Button onClick={() => setAddInteractionOpen(true)} title="Añadir Interacción" className="h-7 w-7 bg-primary/10 hover:bg-primary/40 text-primary">
              <MessageSquarePlus className="h-4 w-4" />
            </Button>
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