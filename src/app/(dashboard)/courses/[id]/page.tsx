"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlusCircle, ListPlus, Calendar, Clock, ExternalLink, Search, CheckCircle2 } from "lucide-react";
import TaskModal, { TaskModalData } from "@/components/tasks/TaskModal";
import { useToast } from "@/components/ui/Toast";

interface TaskItem {
  id: string;
  subject: string;
  topic: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
}

interface CourseDetail {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  studyTasks: TaskItem[];
}

export default function CourseDetailPage() {
  const params = useParams();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<TaskModalData | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string>("ALL");

  const { showToast } = useToast();

  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data.course);
      }
    } catch (err) {
      console.error("Failed to fetch course details:", err);
      showToast("Error loading course details", "error");
    } finally {
      setLoading(false);
    }
  }, [courseId, showToast]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  const handleStatusChange = (taskId: string, newStatus: "PENDING" | "COMPLETED" | "SKIPPED") => {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            studyTasks: prev.studyTasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
          }
        : null
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setCourse((prev) =>
      prev
        ? {
            ...prev,
            studyTasks: prev.studyTasks.filter((t) => t.id !== taskId),
          }
        : null
    );
    showToast("Task removed from course", "info");
  };

  // Subjects list
  const subjects = useMemo(() => {
    if (!course) return [];
    return Array.from(new Set(course.studyTasks.map((t) => t.subject)));
  }, [course]);

  // Filtered Tasks (Chronologically Ordered)
  const filteredTasks = useMemo(() => {
    if (!course) return [];
    return course.studyTasks
      .filter((t) => {
        const matchesSearch =
          t.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSubject = selectedSubject === "ALL" || t.subject === selectedSubject;
        return matchesSearch && matchesSubject;
      })
      .sort((a, b) => {
        const dateA = new Date(a.scheduledDate).getTime();
        const dateB = new Date(b.scheduledDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        return a.scheduledTime.localeCompare(b.scheduledTime);
      });
  }, [course, searchQuery, selectedSubject]);

  // Completion Progress
  const progress = useMemo(() => {
    if (!course || course.studyTasks.length === 0) return 0;
    const completed = course.studyTasks.filter((t) => t.status === "COMPLETED").length;
    return Math.round((completed / course.studyTasks.length) * 100);
  }, [course]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400 text-sm">Loading course details...</div>;
  }

  if (!course) {
    return <div className="p-8 text-center text-red-600 font-semibold text-sm">Course not found</div>;
  }

  const completedCount = course.studyTasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-6 py-2">
      <Link href="/courses" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </Link>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 flex-1">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{course.name}</h1>
            {course.description && <p className="text-xs text-slate-500 max-w-xl">{course.description}</p>}
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(course.startDate).toLocaleDateString()} – {new Date(course.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1 max-w-md">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Course Completion</span>
              <span>{progress}% ({completedCount}/{course.studyTasks.length} Done)</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href={`/tasks/create?courseId=${course.id}`}
            className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Single Task</span>
          </Link>
          <Link
            href={`/tasks/bulk-schedule?courseId=${course.id}`}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-colors shadow-xs"
          >
            <ListPlus className="w-4 h-4" />
            <span>Bulk Schedule</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">Scheduled Study Tasks ({course.studyTasks.length})</h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 w-44 sm:w-56 shadow-xs"
              />
            </div>

            {subjects.length > 0 && (
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none shadow-xs"
              >
                <option value="ALL">All Subjects</option>
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {course.studyTasks.length === 0 ? (
          <div className="bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
            No study tasks added for this course yet.
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
            No tasks match your search or subject filter.
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredTasks.map((t) => (
              <div
                key={t.id}
                onClick={() =>
                  setSelectedTask({
                    ...t,
                    scheduledDate: new Date(t.scheduledDate).toISOString().split("T")[0],
                    course: { name: course.name },
                  })
                }
                className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-md"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-bold text-red-600 uppercase tracking-wider">
                    <span>{t.subject}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-500 font-normal">
                      <Clock className="w-3 h-3" />
                      {new Date(t.scheduledDate).toLocaleDateString()} at {t.scheduledTime}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{t.topic}</h3>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                      t.status === "COMPLETED"
                        ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                        : t.status === "SKIPPED"
                        ? "bg-slate-100 text-slate-600 border border-slate-200"
                        : "bg-amber-100 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {t.status}
                  </span>

                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
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
