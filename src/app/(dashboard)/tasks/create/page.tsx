"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PlusCircle, Calendar, Clock, BookOpen, Tag } from "lucide-react";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";
import Image from "next/image";
import { useToast } from "@/components/ui/Toast";

import { GoogleDriveIcon } from "@/components/ui/GoogleDriveIcon";
import { detectVideoProvider } from "@/lib/gdrive";

interface CourseOption {
  id: string;
  name: string;
}

function CreateTaskForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get("courseId") || "";

  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [courseId, setCourseId] = useState(initialCourseId);
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [scheduledTime, setScheduledTime] = useState("19:00");
  const [duration, setDuration] = useState("30");

  const [previewTitle, setPreviewTitle] = useState("");
  const [previewThumbnail, setPreviewThumbnail] = useState("");
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { showToast } = useToast();

  const providerInfo = detectVideoProvider(youtubeUrl);
  const isGDrive = providerInfo.provider === "GDRIVE";

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

  const handleUrlBlur = async () => {
    if (!youtubeUrl.trim()) return;

    if (isGDrive) {
      showToast("Google Drive video URL detected! 📁", "info");
      return;
    }

    setFetchingMetadata(true);
    try {
      const res = await fetch(`/api/youtube/oembed?url=${encodeURIComponent(youtubeUrl)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.metadata) {
          setPreviewTitle(data.metadata.title);
          setPreviewThumbnail(data.metadata.thumbnailUrl);
          if (!topic) setTopic(data.metadata.title);
          showToast("YouTube metadata fetched!", "info");
        }
      }
    } catch (err) {
      console.warn("oEmbed preview failed:", err);
    } finally {
      setFetchingMetadata(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          subject,
          topic: topic || previewTitle || `${subject} Study Session`,
          youtubeUrl,
          scheduledDate,
          scheduledTime,
          duration: parseInt(duration, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule task");
      }

      showToast("Study task scheduled successfully! 🎯", "success");
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error creating task";
      setError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900">Schedule Single Study Video</h1>
        <p className="text-slate-500 text-sm">Add a YouTube or Google Drive video to your study plan and get a free Telegram reminder.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold p-3.5 rounded-2xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-5">
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Select Course</span>
          </label>
          {courses.length === 0 ? (
            <div className="text-xs text-amber-700 bg-amber-50 p-3.5 rounded-2xl border border-amber-200">
              No courses created yet. Please create a course first!
            </div>
          ) : (
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
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              <span>Subject / Module</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DBMS, Algorithms, Physics"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Topic Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Normalization & BCNF"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            {isGDrive ? (
              <span className="flex items-center gap-1.5 text-blue-600">
                <GoogleDriveIcon className="w-4 h-4" />
                <span>Google Drive Video URL</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-red-600">
                <YouTubeIcon className="w-4 h-4" />
                <span>YouTube or Google Drive URL</span>
              </span>
            )}
          </label>
          <input
            type="url"
            required
            placeholder="https://www.youtube.com/watch?v=... or https://drive.google.com/file/d/..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            onBlur={handleUrlBlur}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
          />
          {fetchingMetadata && <p className="text-[11px] text-slate-400">Fetching video preview...</p>}
        </div>

        {previewTitle && (
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            {previewThumbnail && (
              <Image
                src={previewThumbnail}
                alt="Thumbnail"
                width={80}
                height={45}
                unoptimized
                className="w-20 aspect-video object-cover rounded-xl shrink-0 shadow-xs"
              />
            )}
            <div className="space-y-0.5">
              <p className="text-[11px] font-bold text-red-600 uppercase">Fetched Metadata</p>
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{previewTitle}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Date</span>
            </label>
            <input
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Time Slot</span>
            </label>
            <input
              type="time"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1 col-span-2 md:col-span-1">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Duration (Min)</label>
            <input
              type="number"
              min="5"
              max="240"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || courses.length === 0}
          className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{submitting ? "Scheduling Task..." : "Schedule Study Task"}</span>
        </button>
      </form>
    </div>
  );
}

export default function CreateTaskPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-400 text-sm">Loading task form...</div>}>
      <CreateTaskForm />
    </Suspense>
  );
}
