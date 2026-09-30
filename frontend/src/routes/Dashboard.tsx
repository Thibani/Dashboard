import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { fetchAbout, fetchDashboard, saveDashboard, UnauthorizedError } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { type AboutResponse, type WidgetInstance } from "../features/widgets/types";
import { WidgetShell } from "../features/widgets/WidgetShell";
import { AddWidgetDialog } from "../features/widgets/AddWidgetDialog";
import '../style/Dashboard.css'

function SortableWidget({
  instance,
  onRemove,
  onEdit,
  onResize,
}: {
  instance: WidgetInstance;
  onRemove: (id: string) => void;
  onEdit: (instance: WidgetInstance) => void;
  onResize: (id: string, width: number, height: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: instance.id });

  const width = instance.width ?? 1;
  const height = instance.height ?? 1;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    gridColumn: `span ${width}`,
    gridRow: `span ${height}`,
  };

  return (
    <div ref={setNodeRef} style={style} className="sortable-widget">
      <WidgetShell
        instance={instance}
        onRemove={onRemove}
        onEdit={onEdit}
        dragHandleProps={{ ...attributes, ...listeners }}
      />

      <div
        className="widget-resize-handle"
        onPointerDown={(event) => {
          event.stopPropagation();

          const startX = event.clientX;
          const startY = event.clientY;

          const startWidth = width;
          const startHeight = height;

          const grid = event.currentTarget.parentElement?.parentElement;

          if (!grid) return;

          const gridRect = grid.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(grid);

          const columns = computedStyle.gridTemplateColumns.split(" ").length;
          const columnGap = parseFloat(computedStyle.columnGap) || 0;
          const rowGap = parseFloat(computedStyle.rowGap) || 0;

          const columnWidth =
            (gridRect.width - columnGap * (columns - 1)) / columns;

          const rowHeight =
            parseFloat(computedStyle.gridAutoRows) || 180;

          const handlePointerMove = (moveEvent: PointerEvent) => {
            const deltaX = moveEvent.clientX - startX;
            const deltaY = moveEvent.clientY - startY;

            const columnChange = Math.round(
              deltaX / (columnWidth + columnGap)
            );

            const rowChange = Math.round(
              deltaY / (rowHeight + rowGap)
            );

            const newWidth = Math.min(
              columns,
              Math.max(1, startWidth + columnChange)
            );

            const newHeight = Math.max(
              1,
              startHeight + rowChange
            );

            onResize(instance.id, newWidth, newHeight);
          };

          const handlePointerUp = () => {
            window.removeEventListener("pointermove", handlePointerMove);
            window.removeEventListener("pointerup", handlePointerUp);
          };

          window.addEventListener("pointermove", handlePointerMove);
          window.addEventListener("pointerup", handlePointerUp);
        }}
      />
    </div>
  );
}

interface DashboardContentProps {
  about: AboutResponse;
  initialInstances: WidgetInstance[];
  token: string;
  onUnauthorized: () => void;
}

function DashboardContent({ about, initialInstances, token, onUnauthorized }: DashboardContentProps) {
  const [instances, setInstances] = useState<WidgetInstance[]>(initialInstances);
  const [dialogState, setDialogState] = useState<{ open: boolean; editing?: WidgetInstance }>({ open: false });
  const [saveFailed, setSaveFailed] = useState(false);
  // What the server already has: skips the pointless save right after loading
  // (and the second effect run in StrictMode).
  const lastSaved = useRef(JSON.stringify(initialInstances));

  useEffect(() => {
    const json = JSON.stringify(instances);
    if (json === lastSaved.current) return;
    lastSaved.current = json;
    saveDashboard(token, instances)
      .then(() => setSaveFailed(false))
      .catch((err) => {
        if (err instanceof UnauthorizedError) onUnauthorized();
        else setSaveFailed(true);
      });
  }, [instances, token, onUnauthorized]);

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

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <button onClick={() => setDialogState({ open: true })}>+ Add widget</button>
      </header>

      {saveFailed && <p className="widget-error">Could not save your changes. Check your connection.</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={instances.map((i) => i.id)} strategy={rectSortingStrategy}>
          <div className="dashboard-grid">
            {instances.map((instance) => (
              <SortableWidget
                key={instance.id}
                instance={instance}
                onRemove={(id) =>
                  setInstances((prev) => prev.filter((i) => i.id !== id))
                }
                onEdit={(inst) =>
                  setDialogState({ open: true, editing: inst })
                }
                onResize={(id, width, height) => {
                  setInstances((prev) =>
                    prev.map((instance) =>
                      instance.id === id
                        ? { ...instance, width, height }
                        : instance
                    )
                  );
                }}
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

export function Dashboard() {
  const { user, token, logout } = useAuth();

  const about = useQuery({ queryKey: ["about"], queryFn: fetchAbout });
  const saved = useQuery({
    // The email is part of the key so two accounts never share cached widgets.
    queryKey: ["dashboard", user?.email],
    queryFn: () => fetchDashboard(token as string),
    enabled: !!token,
    gcTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Expired or invalid token: log out, RequireAuth then sends the user to /login.
  useEffect(() => {
    if (saved.error instanceof UnauthorizedError) logout();
  }, [saved.error, logout]);

  if (about.isLoading || saved.isLoading) return <p>Loading…</p>;
  if (about.error || !about.data) return <p className="widget-error">Could not reach the server.</p>;
  if (saved.error || !saved.data) return <p className="widget-error">Could not load your dashboard.</p>;

  return (
    <DashboardContent
      key={user?.email}
      about={about.data}
      initialInstances={saved.data}
      token={token as string}
      onUnauthorized={logout}
    />
  );
}