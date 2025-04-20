
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
  { id: "todo", title: "To Do", color: "bg-blue-100", accent: "bg-blue-500" },
  { id: "inprogress", title: "In Progress", color: "bg-yellow-100", accent: "bg-yellow-500" },
  { id: "done", title: "Done", color: "bg-green-100", accent: "bg-green-500" },
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 flex flex-col">
      <header className="py-6 px-8 flex items-center justify-between bg-white shadow-sm">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-2">
          <GripVertical className="w-7 h-7 text-blue-500" />
          Task Board
        </h1>
        <span className="text-slate-400 font-medium">Trello-style Board</span>
      </header>
      <main className="flex-1 flex flex-col items-center justify-start py-8 px-2">
        <div className="w-full max-w-7xl">
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 overflow-x-auto pb-4">
              {board.columnOrder.map((colId) => {
                const column = board.columns[colId];
                return (
                  <div
                    key={column.id}
                    className={`flex flex-col rounded-2xl shadow-md min-w-[320px] w-96 ${column.color} transition-all`}
                  >
                    <div className="flex items-center justify-between px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-full ${column.accent}`}></span>
                        <h2 className="text-lg font-bold text-slate-700">{column.title}</h2>
                      </div>
                      <button
                        className="p-1 rounded hover:bg-slate-200 transition"
                        onClick={() => openNewTaskModal(column.id)}
                        aria-label="Add Task"
                      >
                        <Plus className="w-5 h-5 text-slate-500" />
                      </button>
                    </div>
                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 px-4 pb-4 min-h-[80px] transition-all ${
                            snapshot.isDraggingOver ? "bg-slate-200/60" : ""
                          }`}
                        >
                          {column.taskIds.length === 0 && (
                            <div className="text-slate-400 text-center py-8 select-none">
                              <span className="italic">No tasks</span>
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
                                    className={`group bg-white rounded-xl shadow p-4 mb-4 flex items-start gap-3 border border-slate-100 transition-all ${
                                      snapshot.isDragging
                                        ? "ring-2 ring-blue-400 scale-105"
                                        : ""
                                    }`}
                                    style={{
                                      ...provided.draggableProps.style,
                                      boxShadow: snapshot.isDragging
                                        ? "0 8px 32px 0 rgba(56, 189, 248, 0.15)"
                                        : "0 2px 8px 0 rgba(0,0,0,0.04)",
                                    }}
                                  >
                                    <div className="flex-1">
                                      <div className="text-slate-800 font-medium break-words">
                                        {task.content}
                                      </div>
                                    </div>
                                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition">
                                      <button
                                        className="p-1 rounded hover:bg-blue-100"
                                        onClick={() =>
                                          openEditTaskModal(task.id, column.id)
                                        }
                                        aria-label="Edit"
                                      >
                                        <Edit className="w-4 h-4 text-blue-500" />
                                      </button>
                                      <button
                                        className="p-1 rounded hover:bg-red-100"
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
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 p-2 rounded hover:bg-slate-100"
              onClick={closeModal}
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
            <h3 className="text-xl font-bold mb-4 text-slate-700">
              {modalTask.id ? "Edit Task" : "Add Task"}
            </h3>
            <textarea
              className="w-full min-h-[80px] border border-slate-200 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-800 text-base resize-none transition"
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
            <div className="flex justify-end gap-2 mt-6">
              <button
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-1 transition ${
                  modalTask.content.trim()
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-blue-200 text-white cursor-not-allowed"
                }`}
                onClick={handleModalSave}
                disabled={!modalTask.content.trim()}
              >
                <Check className="w-4 h-4" />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm relative animate-fadeIn">
            <h3 className="text-lg font-bold mb-4 text-slate-700">
              Delete this task?
            </h3>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete this task? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-600 font-medium hover:bg-slate-200 transition"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
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
        `}
      </style>
    </div>
  );
}

export default App;