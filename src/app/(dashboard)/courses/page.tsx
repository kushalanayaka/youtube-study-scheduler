"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { BookOpen, Plus, Calendar, Trash2, ArrowRight, Search, CheckCircle2 } from "lucide-react";
import { CourseSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";

interface CourseItem {
  id: string;
  name: string;
  description: string | null;
  startDate: string;
  endDate: string;
  _count?: { studyTasks: number };
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [creating, setCreating] = useState(false);

  const { showToast } = useToast();

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      showToast("Failed to load courses", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, startDate, endDate }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setShowModal(false);
        showToast("Course created successfully! 🎉", "success");
        fetchCourses();
      } else {
        showToast("Failed to create course", "error");
      }
    } catch (err) {
      console.error("Failed to create course:", err);
      showToast("Error creating course", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteCourse = async (id: string, courseName: string) => {
    if (!confirm(`Are you sure you want to delete "${courseName}" and all associated study tasks?`)) return;

    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        setCourses((prev) => prev.filter((c) => c.id !== id));
        showToast(`Course "${courseName}" deleted`, "info");
      } else {
        showToast("Failed to delete course", "error");
      }
    } catch (err) {
      console.error("Failed to delete course:", err);
      showToast("Error deleting course", "error");
    }
  };

  const filteredCourses = useMemo(() => {
    return courses.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [courses, searchQuery]);

  return (
    <div className="space-y-6 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Your Exam Prep Courses</h1>
          <p className="text-slate-500 text-sm">Organize your competitive exam preparation goals.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-red-500 w-44 sm:w-56 shadow-xs"
            />
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-md transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Course</span>
          </button>
        </div>
      </div>

      {loading ? (
        <CourseSkeleton />
      ) : courses.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-4 max-w-lg mx-auto shadow-xs">
          <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-900">No Courses Created Yet</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Create your first course (e.g. &quot;GATE CSE 2027&quot; or &quot;Physics 101&quot;) to start adding and scheduling YouTube videos.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="text-xs font-semibold bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl shadow-xs transition-colors"
          >
            Create Course Now
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
          No courses matching &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white p-6 rounded-3xl border border-slate-200 hover:border-slate-300 shadow-xs hover:shadow-md flex flex-col justify-between space-y-4 transition-all"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{course.name}</h3>
                  <button
                    onClick={() => handleDeleteCourse(course.id, course.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {course.description && (
                  <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                )}
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {new Date(course.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} -{" "}
                    {new Date(course.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200/80">
                    {course._count?.studyTasks || 0} tasks
                  </span>
                </div>

                <Link
                  href={`/courses/${course.id}`}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <span>View Tasks &amp; Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h2 className="text-xl font-bold text-slate-900">Create New Course</h2>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Course Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GATE CSE 2027"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Computer Science preparation curriculum"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Save Course"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
