"use client";

import { useState } from "react";
import { MessageSquare, StickyNote } from "lucide-react";
import { Client } from "@/types/client";

// 👇 importá tu IconCta (ajustá la ruta)
import { IconCta } from "@/components/icon-cta";

import { ViewNotesDialog } from "./ViewNotesDialog";
import { AddNoteDialog } from "./AddNoteDialog";
import { ViewInteractionsDialog } from "./ViewInteractionsDialog";
import { AddInteractionDialog } from "./AddInteractionDialog";

type Props = {
  client: Client;
  actionType: "notas" | "interacciones";
};

type ActiveDialog = "view" | "add" | null;

export function TableCellActions({ client, actionType }: Props) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);

  const handleOpenAdd = () => setActiveDialog("add");

  const isNotes = actionType === "notas";
  const buttonTitle = isNotes ? "Ver / Añadir Notas" : "Ver / Añadir Interacciones";
  const Icon = isNotes ? StickyNote : MessageSquare;

  return (
    <>
      <div className="flex items-center justify-center">
        <IconCta label={buttonTitle} onClick={() => setActiveDialog("view")}>
          <Icon className="h-4 w-4" />
        </IconCta>
      </div>

      {isNotes ? (
        <>
          <ViewNotesDialog
            client={client}
            isOpen={activeDialog === "view"}
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
            onAddNew={handleOpenAdd}
          />
          <AddNoteDialog
            client={client}
            isOpen={activeDialog === "add"}
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
          />
        </>
      ) : (
        <>
          <ViewInteractionsDialog
            client={client}
            isOpen={activeDialog === "view"}
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
            onAddNew={handleOpenAdd}
          />
          <AddInteractionDialog
            client={client}
            isOpen={activeDialog === "add"}
            onOpenChange={(isOpen) => !isOpen && setActiveDialog(null)}
          />
        </>
      )}
    </>
  );
}
