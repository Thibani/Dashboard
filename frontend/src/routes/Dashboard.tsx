import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { fetchAbout } from "../lib/api";
import { loadInstances, saveInstances } from "../lib/dashboard-storage";
import { type WidgetInstance } from "../features/widgets/types";
import { WidgetShell } from "../features/widgets/WidgetShell";
import { AddWidgetDialog } from "../features/widgets/AddWidgetDialog";
import "../style/Dashboard.css"

function SortableWidget({ instance, onRemove, onEdit }: {
  instance: WidgetInstance;
  onRemove: (id: string) => void;
  onEdit: (instance: WidgetInstance) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: instance.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style}>
      <WidgetShell instance={instance} onRemove={onRemove} onEdit={onEdit} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

export function Dashboard() {
  const { data: about, isLoading, error } = useQuery({ queryKey: ["about"], queryFn: fetchAbout });
  const [instances, setInstances] = useState<WidgetInstance[]>(() => loadInstances());
  const [dialogState, setDialogState] = useState<{ open: boolean; editing?: WidgetInstance }>({ open: false });

  useEffect(() => saveInstances(instances), [instances]);

  const sensors = useSensors(useSensor(PointerSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setInstances((prev) => {
      const oldIndex = prev.findIndex((i) => i.id === active.id);
      const newIndex = prev.findIndex((i) => i.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }

  function handleConfirm(instance: WidgetInstance) {
    setInstances((prev) => {
      const exists = prev.some((i) => i.id === instance.id);
      return exists ? prev.map((i) => (i.id === instance.id ? instance : i)) : [...prev, instance];
    });
    setDialogState({ open: false });
  }

  if (isLoading) return <p>Loading services…</p>;
  if (error || !about) return <p className="widget-error">Could not reach the server.</p>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={() => setDialogState({ open: true })}>+ Add widget</button>
      </header>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={instances.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="dashboard-grid">
            {instances.map((instance) => (
              <SortableWidget
                key={instance.id}
                instance={instance}
                onRemove={(id) => setInstances((prev) => prev.filter((i) => i.id !== id))}
                onEdit={(inst) => setDialogState({ open: true, editing: inst })}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {instances.length === 0 && <p className="dashboard-empty">No widgets yet — add one to get started.</p>}

      {dialogState.open && (
        <AddWidgetDialog about={about} editingInstance={dialogState.editing} onConfirm={handleConfirm} onClose={() => setDialogState({ open: false })} />
      )}
    </div>
  );
}