import { KanbanBoard } from '@/components/kanban/KanbanBoard';

export default function PipelinePage() {
    return (
        <div>
            <div className="p-4 border-b">
                <h1 className="text-3xl font-bold">Pipeline de Ventas</h1>
            </div>
            <KanbanBoard />
        </div>
    );
}