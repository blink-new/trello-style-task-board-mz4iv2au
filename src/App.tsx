
import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Check,
  GripVertical,
} from "lucide-react";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "react-beautiful-dnd";

const DEFAULT_COLUMNS = [
  {
    id: "todo",
    title: "To Do",
    color: "from-blue-100 to-blue-200",
    accent: "bg-blue-500",
    border: "border-blue-300",
    shadow: "shadow-blue-200",
    gradient: "bg-gradient-to-br from-blue-100 to-blue-200",
  },
  {
    id: "inprogress",
    title: "In Progress",
    color: "from-violet-100 to-violet-200",
    accent: "bg-violet-500",
    border: "border-violet-300",
    shadow: "shadow-violet-200",
    gradient: "bg-gradient-to-br from-violet-100 to-violet-200",
  },
  {
    id: "done",
    title: "Done",
    color: "from-emerald-100 to-emerald-200",
    accent: "bg-emerald-500",
    border: "border-emerald-300",
    shadow: "shadow-emerald-200",
    gradient: "bg-gradient-to-br from-emerald-100 to-emerald-200",
  },
];

type Task = {
  id: string;
  content: string;
};

type Column = {
  id: string;
  title: string;
  color: string;
  accent: string;
  border: string;
  shadow: string;
  gradient: string;
  taskIds: string[];
};

type BoardData = {
  tasks: Record<string, Task>;
  columns: Record<string, Column>;
  columnOrder: string[];
};

const getInitialData = (): BoardData => {
  const saved = localStorage.getItem("trello-board");
  if (saved) return JSON.parse(saved);
  // Default empty board
  const columns: Record<string, Column> = {};
  DEFAULT_COLUMNS.forEach((col) => {
    columns[col.id] = {
      id: col.id,
      title: col.title,
      color: col.color,
      accent: col.accent,
      border: col.border,
      shadow: col.shadow,
      gradient: col.gradient,
      taskIds: [],
    };
  });
  return {
    tasks: {},
    columns,
    columnOrder: DEFAULT_COLUMNS.map((c) => c.id),
  };
};

function App() {
  const [board, setBoard] = useState<BoardData>(getInitialData);
  const [showModal, setShowModal] = useState(false);
  const [modalTask, setModalTask] = useState<{ id?: string; content: string; columnId: string } | null>(null);
  const [deleting, setDeleting] = useState<{ taskId: string; columnId: string } | null>(null);

  useEffect(() => {
    localStorage.setItem("trello-board", JSON.stringify(board));
  }, [board]);

  const openNewTaskModal = (columnId: string) => {
    setModalTask({ content: "", columnId });
    setShowModal(true);
  };

  const openEditTaskModal = (taskId: string, columnId: string) => {
    setModalTask({ id: taskId, content: board.tasks[taskId].content, columnId });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setModalTask(null);
  };

  const handleModalSave = () => {
    if (!modalTask) return;
    if (modalTask.content.trim() === "") return;
    if (modalTask.id) {
      // Edit
      setBoard((prev) => ({
        ...prev,
        tasks: {
          ...prev.tasks,
          [modalTask.id!]: { ...prev.tasks[modalTask.id!], content: modalTask.content },
        },
      }));
    } else {
      // New
      const id = "task-" + Date.now();
      setBoard((prev) => {
        const newTasks = { ...prev.tasks, [id]: { id, content: modalTask.content } };
        const newColumns = {
          ...prev.columns,
          [modalTask.columnId]: {
            ...prev.columns[modalTask.columnId],
            taskIds: [id, ...prev.columns[modalTask.columnId].taskIds],
          },
        };
        return { ...prev, tasks: newTasks, columns: newColumns };
      });
    }
    closeModal();
  };

  const handleDeleteTask = (taskId: string, columnId: string) => {
    setDeleting({ taskId, columnId });
  };

  const confirmDelete = () => {
    if (!deleting) return;
    setBoard((prev) => {
      const newTasks = { ...prev.tasks };
      delete newTasks[deleting.taskId];
      const newColumns = {
        ...prev.columns,
        [deleting.columnId]: {
          ...prev.columns[deleting.columnId],
          taskIds: prev.columns[deleting.columnId].taskIds.filter((id) => id !== deleting.taskId),
        },
      };
      return { ...prev, tasks: newTasks, columns: newColumns };
    });
    setDeleting(null);
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    )
      return;

    setBoard((prev) => {
      const start = prev.columns[source.droppableId];
      const finish = prev.columns[destination.droppableId];

      // Moving within same column
      if (start === finish) {
        const newTaskIds = Array.from(start.taskIds);
        newTaskIds.splice(source.index, 1);
        newTaskIds.splice(destination.index, 0, draggableId);
        const newColumn = { ...start, taskIds: newTaskIds };
        return {
          ...prev,
          columns: { ...prev.columns, [newColumn.id]: newColumn },
        };
      }

      // Moving to another column
      const startTaskIds = Array.from(start.taskIds);
      startTaskIds.splice(source.index, 1);
      const newStart = { ...start, taskIds: startTaskIds };

      const finishTaskIds = Array.from(finish.taskIds);
      finishTaskIds.splice(destination.index, 0, draggableId);
      const newFinish = { ...finish, taskIds: finishTaskIds };

      return {
        ...prev,
        columns: {
          ...prev.columns,
          [newStart.id]: newStart,
          [newFinish.id]: newFinish,
        },
      };
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col relative overflow-x-hidden">
      {/* Subtle background pattern */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 20% 40%, rgba(99,102,241,0.07) 0, transparent 60%), radial-gradient(circle at 80% 60%, rgba(16,185,129,0.07) 0, transparent 60%)",
        }}
      />
      <header className="py-7 px-8 flex items-center justify-between bg-white/80 shadow-md backdrop-blur z-10 relative">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3 font-display drop-shadow-sm">
          <GripVertical className="w-8 h-8 text-blue-500" />
          Task Board
        </h1>
        <span className="text-slate-400 font-medium text-lg">Trello-style Board</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start py-10 px-2 z-10 relative">
        <div className="w-full max-w-7xl">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-8 overflow-x-auto pb-4">
              {board.columnOrder.map((colId) => {
                const column = board.columns[colId];
                return (
                  <div
                    key={column.id}
                    className={`flex flex-col rounded-3xl border-2 ${column.border} ${column.gradient} ${column.shadow} min-w-[340px] w-96 transition-all duration-300 hover:scale-[1.015] hover:shadow-xl`}
                  >
                    <div className="flex items-center justify-between px-7 py-5">
                      <div className="flex items-center gap-3">
                        <span className={`w-4 h-4 rounded-full ${column.accent} shadow-md`}></span>
                        <h2 className="text-2xl font-bold text-slate-700 font-display drop-shadow-sm">{column.title}</h2>
                      </div>
                      <button
                        className="p-2 rounded-full bg-white/70 hover:bg-blue-100 shadow transition"
                        onClick={() => openNewTaskModal(column.id)}
                        aria-label="Add Task"
                      >
                        <Plus className="w-5 h-5 text-blue-500" />
                      </button>
                    </div>
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 px-5 pb-6 min-h-[80px] transition-all duration-200 ${
                            snapshot.isDraggingOver ? "bg-white/60" : ""
                          }`}
                        >
                          {column.taskIds.length === 0 && (
                            <div className="text-slate-400 text-center py-10 select-none italic font-medium">
                              No tasks
                            </div>
                          )}
                          {column.taskIds.map((taskId, idx) => {
                            const task = board.tasks[taskId];
                            return (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={idx}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`group bg-white rounded-2xl shadow-md p-5 mb-5 flex items-start gap-3 border border-slate-100 transition-all duration-200 cursor-pointer hover:shadow-lg hover:-translate-y-1 hover:border-blue-200 ${
                                      snapshot.isDragging
                                        ? "ring-2 ring-blue-400 scale-105 shadow-xl"
                                        : ""
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      boxShadow: snapshot.isDragging
                                        ? "0 12px 32px 0 rgba(56, 189, 248, 0.18)"
                                        : "0 2px 8px 0 rgba(0,0,0,0.06)",
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div className="text-slate-800 font-medium break-words text-lg font-sans">
                                        {task.content}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                                      <button
                                        className="p-1.5 rounded-full hover:bg-blue-100"
                                        onClick={() =>
                                          openEditTaskModal(task.id, column.id)
                                        }
                                        aria-label="Edit"
                                      >
                                        <Edit className="w-4 h-4 text-blue-500" />
                                      </button>
                                      <button
                                        className="p-1.5 rounded-full hover:bg-red-100"
                                        onClick={() =>
                                          handleDeleteTask(task.id, column.id)
                                        }
                                        aria-label="Delete"
                                      >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </main>
      {/* Task Modal */}
      {showModal && modalTask && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-lg relative animate-fadeIn border-2 border-blue-100">
            <button
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100"
              onClick={closeModal}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-2xl font-bold mb-5 text-slate-700 font-display">
              {modalTask.id ? "Edit Task" : "Add Task"}
            </h3>
            <textarea
              className="w-full min-h-[90px] border-2 border-slate-200 rounded-xl p-4 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 text-lg resize-none transition font-sans"
              placeholder="Task details..."
              value={modalTask.content}
              onChange={(e) =>
                setModalTask((prev) =>
                  prev ? { ...prev, content: e.target.value } : prev
                )
              }
              autoFocus
              maxLength={300}
            />
            <div className="flex justify-end gap-3 mt-8">
              <button
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition text-lg"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 text-lg transition shadow ${
                  modalTask.content.trim()
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-200 text-white cursor-not-allowed"
                }`}
                onClick={handleModalSave}
                disabled={!modalTask.content.trim()}
              >
                <Check className="w-5 h-5" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center">
          <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md relative animate-fadeIn border-2 border-red-100">
            <h3 className="text-xl font-bold mb-4 text-slate-700 font-display">
              Delete this task?
            </h3>
            <p className="text-slate-500 mb-7 text-lg">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition text-lg"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition text-lg shadow"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <style>
        {`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.96);}
          to { opacity: 1; transform: scale(1);}
        }
        .animate-fadeIn {
          animation: fadeIn 0.18s cubic-bezier(.4,0,.2,1);
        }
        .font-display {
          font-family: 'Poppins', 'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif;
        }
        `}
      </style>
      {/* Google Fonts for Poppins */}
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;800&display=swap"
        rel="stylesheet"
      />
    </div>
  );
}

export default App;