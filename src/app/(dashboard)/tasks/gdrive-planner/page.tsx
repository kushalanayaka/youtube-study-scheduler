"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ListPlus, BookOpen, Tag, Calendar, Clock, Sparkles, Copy, HardDrive } from "lucide-react";
import { GoogleDriveIcon } from "@/components/ui/GoogleDriveIcon";
import { useToast } from "@/components/ui/Toast";

interface CourseOption {
  id: string;
  name: string;
}

const SAMPLE_GDRIVE_COURSE = `1. ER Diagrams & Entity Relationships | https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J1K2L/view
2. Relational Model & Keys (Candidate, Primary, Foreign) | https://drive.google.com/file/d/1B2C3D4E5F6G7H8I9J0K1L2M/view
3. Functional Dependencies & Attribute Closure | https://drive.google.com/file/d/1C2D3E4F5G6H7I8J9K0L1M2N/view
4. Normal Forms: 1NF, 2NF, 3NF & BCNF | https://drive.google.com/file/d/1D2E3F4G5H6I7J8K9L0M1N2O/view
5. SQL Queries, Joins & Subqueries | https://drive.google.com/file/d/1E2F3G4H5I6J7K8L9M0N1O2P/view`;

function GDrivePlannerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId") || "";

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [subject, setSubject] = useState("GATE Computer Science");
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
    setUrlsText(SAMPLE_GDRIVE_COURSE);
    showToast("Pasted sample GATE Google Drive course topics & links! 📁", "info");
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
        throw new Error(data.error || "Failed to bulk schedule Google Drive tasks");
      }

      setSuccessCount(data.count);
      showToast(`Successfully created ${data.count} Google Drive study tasks! 🎉`, "success");

      setTimeout(() => {
        if (courseId) {
          router.push(`/courses/${courseId}`);
        } else {
          router.push("/dashboard");
        }
        router.refresh();
      }, 1500);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error creating Google Drive study planner";
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
        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider">
          <GoogleDriveIcon className="w-4 h-4" />
          <span>Google Drive Study Planner</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900">Create Full Google Drive Study Plan</h1>
        <p className="text-slate-500 text-sm">
          Specify your Google Drive video links topic-by-topic (e.g. GATE course, semester lectures) to auto-distribute them into a daily study schedule with Telegram reminders.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-2xl">
          {error}
        </div>
      )}

      {successCount !== null && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold p-4 rounded-2xl">
          🎉 Successfully scheduled {successCount} Google Drive video lectures! Redirecting to your course schedule...
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Target Course</span>
            </label>
            {courses.length === 0 ? (
              <div className="text-xs text-amber-700 bg-amber-50 p-3 rounded-xl border border-amber-200">
                No courses found. Create a course first in Courses page!
              </div>
            ) : (
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Subject / Module</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DBMS, Data Structures, GATE CSE"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              <span>Google Drive Video Links (Topic Title | Drive URL)</span>
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePasteSample}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                <span>Paste Sample GATE Course</span>
              </button>
              <span className="text-xs font-semibold text-slate-400">
                {parsedUrlCount} {parsedUrlCount === 1 ? "lecture" : "lectures"} detected
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-[11px] text-blue-800 space-y-1">
            <p className="font-semibold">💡 Tip: You can paste either direct Google Drive links, or specify topic titles using standard pipe format:</p>
            <code className="block font-mono bg-white/80 p-1.5 rounded text-blue-900 border border-blue-200">
              Topic Name | https://drive.google.com/file/d/FILE_ID/view
            </code>
          </div>

          <textarea
            rows={8}
            required
            placeholder={`1. ER Diagram & Database Design | https://drive.google.com/file/d/xxxxx/view\n2. Normalization 1NF to BCNF | https://drive.google.com/file/d/yyyyy/view\n3. B+ Tree Indexing & Hashing | https://drive.google.com/file/d/zzzzz/view`}
            value={urlsText}
            onChange={(e) => setUrlsText(e.target.value)}
            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Lectures Per Day</label>
            <select
              value={videosPerDay}
              onChange={(e) => setVideosPerDay(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            >
              <option value="1">1 lecture / day</option>
              <option value="2">2 lectures / day</option>
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
          className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          <ListPlus className="w-4 h-4" />
          <span>{submitting ? "Building Study Planner..." : `Auto-Schedule ${parsedUrlCount} Google Drive Lectures`}</span>
        </button>
      </form>
    </div>
  );
}

export default function GDrivePlannerPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading GDrive planner...</div>}>
      <GDrivePlannerForm />
    </Suspense>
  );
}
