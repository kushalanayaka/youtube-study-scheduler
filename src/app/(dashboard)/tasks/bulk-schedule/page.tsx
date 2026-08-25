"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListPlus, BookOpen, Tag, Calendar, Clock, Sparkles, Copy } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

interface CourseOption {
  id: string;
  name: string;
}

const SAMPLE_PLAYLIST_URLS = `https://www.youtube.com/watch?v=dQw4w9WgXcQ
https://www.youtube.com/watch?v=3JZ_D3ELwOQ
https://www.youtube.com/watch?v=2Vv-BfVoq4g
https://www.youtube.com/watch?v=fJ9rUzIMcZQ`;

function BulkScheduleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId") || "";

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [subject, setSubject] = useState("Computer Science");
  const [urlsText, setUrlsText] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [videosPerDay, setVideosPerDay] = useState("2");
  const [slot1, setSlot1] = useState("09:00");
  const [slot2, setSlot2] = useState("19:00");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successCount, setSuccessCount] = useState<number | null>(null);

  const { showToast } = useToast();

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
        if (!initialCourseId && data.courses?.length > 0) {
          setCourseId(data.courses[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to load courses:", err);
      showToast("Failed to load courses", "error");
    }
  }, [initialCourseId, showToast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handlePasteSample = () => {
    setUrlsText(SAMPLE_PLAYLIST_URLS);
    showToast("Pasted sample YouTube playlist URLs! 🎬", "info");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessCount(null);
    setSubmitting(true);

    try {
      const slots = parseInt(videosPerDay, 10) === 1 ? [slot1] : [slot1, slot2];

      const res = await fetch("/api/tasks/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          subject,
          urlsText,
          startDate,
          videosPerDay,
          timeSlots: slots,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to bulk schedule tasks");
      }

      setSuccessCount(data.count);
      showToast(`Successfully scheduled ${data.count} videos! 🎉`, "success");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error performing bulk schedule";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const parsedUrlCount = urlsText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-red-600 uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Smart Auto-Distributor</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Bulk Schedule YouTube Playlists</h1>
        <p className="text-slate-500 text-sm">
          Paste multiple YouTube video URLs to automatically distribute them across daily time slots.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-2xl">
          {error}
        </div>
      )}

      {successCount !== null && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold p-4 rounded-2xl">
          🎉 Successfully scheduled {successCount} YouTube videos! Redirecting to your dashboard...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Select Course</span>
            </label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Subject Tag</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DBMS, Data Structures"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              YouTube Video URLs (One URL per line)
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePasteSample}
                className="text-[11px] font-bold text-red-600 hover:text-red-700 underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Paste Sample Playlist</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">
                {parsedUrlCount} {parsedUrlCount === 1 ? "video" : "videos"} detected
              </span>
            </div>
          </div>
          <textarea
            rows={6}
            required
            placeholder="https://www.youtube.com/watch?v=xxxxx&#10;https://youtu.be/yyyyy&#10;https://www.youtube.com/watch?v=zzzzz"
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Start Date</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Videos Per Day</label>
            <select
              value={videosPerDay}
              onChange={(e) => setVideosPerDay(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="1">1 video / day</option>
              <option value="2">2 videos / day</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Slot 1 Time</span>
            </label>
            <input
              type="time"
              required
              value={slot1}
              onChange={(e) => setSlot1(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          {videosPerDay === "2" && (
            <div className="space-y-1 sm:col-start-3">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Slot 2 Time</span>
              </label>
              <input
                type="time"
                required
                value={slot2}
                onChange={(e) => setSlot2(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={submitting || parsedUrlCount === 0 || courses.length === 0}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          <ListPlus className="w-4 h-4" />
          <span>{submitting ? "Auto-Distributing Schedule..." : `Auto-Schedule ${parsedUrlCount} Videos`}</span>
        </button>
      </form>
    </div>
  );
}

export default function BulkSchedulePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading bulk schedule form...</div>}>
      <BulkScheduleForm />
    </Suspense>
  );
}
