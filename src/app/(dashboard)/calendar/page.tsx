"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import TaskModal, { TaskModalData } from "@/components/tasks/TaskModal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

const CalendarView = dynamic(() => import("@/components/calendar/CalendarView"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4 p-4">
      <Skeleton className="h-10 w-full rounded-2xl" />
      <Skeleton className="h-96 w-full rounded-3xl" />
    </div>
  ),
});

interface TaskItem {
  id: string;
  subject: string;
  topic: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  course: { name: string };
}

export default function CalendarPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskModalData | null>(null);
  const { showToast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to fetch calendar tasks:", err);
      showToast("Error loading calendar tasks", "error");
    }
  }, [showToast]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleStatusChange = (taskId: string, newStatus: "PENDING" | "COMPLETED" | "SKIPPED") => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
    const label = newStatus === "COMPLETED" ? "completed! 🎉" : newStatus === "SKIPPED" ? "skipped" : "reopened";
    showToast(`Task marked as ${label}`, "success");
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast("Task removed", "info");
  };

  const calendarEvents = tasks.map((task) => {
    const dateStr = new Date(task.scheduledDate).toISOString().split("T")[0];
    const startIso = `${dateStr}T${task.scheduledTime}:00`;

    let backgroundColor = "#3b82f6"; // pending blue
    if (task.status === "COMPLETED") backgroundColor = "#10b981"; // emerald green
    if (task.status === "SKIPPED") backgroundColor = "#64748b"; // slate grey

    return {
      id: task.id,
      title: `${task.subject}: ${task.topic}`,
      start: startIso,
      backgroundColor,
      borderColor: backgroundColor,
      extendedProps: { ...task },
    };
  });

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Study Calendar</h1>
          <p className="text-slate-500 text-sm">Visual schedule of your YouTube study sessions.</p>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500" /> Pending
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> Completed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-slate-500" /> Skipped
          </span>
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <CalendarView
          events={calendarEvents}
          onEventClick={(props) => {
            setSelectedTask({
              ...props,
              scheduledDate: new Date(props.scheduledDate).toISOString().split("T")[0],
            });
          }}
        />
      </div>

      <TaskModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteTask}
      />
    </div>
  );
}
