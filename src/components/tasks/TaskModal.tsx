"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, SkipForward, Clock, ExternalLink, Trash2, BookOpen, FileText, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

import { GoogleDriveIcon } from "@/components/ui/GoogleDriveIcon";
import { YouTubeIcon } from "@/components/ui/YouTubeIcon";

export interface TaskModalData {
  id: string;
  subject: string;
  topic: string;
  youtubeUrl: string;
  youtubeVideoId: string;
  scheduledDate: string;
  scheduledTime: string;
  status: "PENDING" | "COMPLETED" | "SKIPPED";
  videoType?: string;
  course?: { name: string };
}

interface TaskModalProps {
  task: TaskModalData | null;
  onClose: () => void;
  onStatusChange: (taskId: string, newStatus: "PENDING" | "COMPLETED" | "SKIPPED") => void;
  onDelete?: (taskId: string) => void;
}

export default function TaskModal({ task, onClose, onStatusChange, onDelete }: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [studyNotes, setStudyNotes] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (task) {
      const savedNotes = localStorage.getItem(`study_notes_${task.id}`) || "";
      setStudyNotes(savedNotes);
    }
  }, [task]);

  if (!task) return null;

  const isGDrive = task.videoType === "GDRIVE" || task.youtubeUrl.includes("drive.google.com");
  const embedSrc = isGDrive
    ? `https://drive.google.com/file/d/${task.youtubeVideoId}/preview`
    : `https://www.youtube.com/embed/${task.youtubeVideoId}?autoplay=0`;

  const handleNotesChange = (val: string) => {
    setStudyNotes(val);
    localStorage.setItem(`study_notes_${task.id}`, val);
  };

  const handleStatusUpdate = async (newStatus: "PENDING" | "COMPLETED" | "SKIPPED") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        onStatusChange(task.id, newStatus);
      } else {
        showToast("Failed to update task status", "error");
      }
    } catch (err) {
      console.error("Failed to update task status:", err);
      showToast("Error updating task status", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this scheduled task?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok && onDelete) {
        onDelete(task.id);
        onClose();
      } else {
        showToast("Failed to delete task", "error");
      }
    } catch (err) {
      console.error("Failed to delete task:", err);
      showToast("Error deleting task", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(task.youtubeUrl);
    setCopied(true);
    showToast(`${isGDrive ? "Google Drive" : "YouTube"} link copied to clipboard`, "info");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-900 text-white flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              {isGDrive ? (
                <span className="flex items-center gap-1.5 text-blue-400">
                  <GoogleDriveIcon className="w-4 h-4" />
                  <span>Google Drive Video</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-red-400">
                  <YouTubeIcon className="w-4 h-4" />
                  <span>YouTube Video</span>
                </span>
              )}
              <span>•</span>
              <span className="text-slate-300 font-semibold">{task.course?.name || task.subject}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white line-clamp-1">{task.topic}</h2>
            <div className="flex items-center gap-4 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-semibold">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {task.scheduledDate} at {task.scheduledTime}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                  task.status === "COMPLETED"
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : task.status === "SKIPPED"
                    ? "bg-slate-700 text-slate-300"
                    : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                }`}
              >
                {task.status}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Video Embed */}
          <div className="aspect-video bg-black rounded-2xl overflow-hidden shadow-inner w-full shrink-0">
            <iframe
              src={embedSrc}
              title={task.topic}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Quick Study Notes */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-700" />
              <span>Quick Study Notes &amp; Formulas</span>
            </label>
            <textarea
              rows={3}
              placeholder="Write down key formulas, concepts, or timestamp notes for revision..."
              value={studyNotes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
            />
            <p className="text-[11px] text-slate-400">Notes are saved automatically in your browser.</p>
          </div>
        </div>

        {/* Actions & Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 shrink-0">
          <div className="flex items-center gap-2">
            {task.status !== "COMPLETED" && (
              <button
                disabled={loading}
                onClick={() => handleStatusUpdate("COMPLETED")}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-colors disabled:opacity-50"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Complete</span>
              </button>
            )}

            {task.status !== "SKIPPED" && (
              <button
                disabled={loading}
                onClick={() => handleStatusUpdate("SKIPPED")}
                className="flex items-center gap-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>
            )}

            {task.status !== "PENDING" && (
              <button
                disabled={loading}
                onClick={() => handleStatusUpdate("PENDING")}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline px-2 py-1"
              >
                Reopen Task
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              title={`Copy ${isGDrive ? "Google Drive" : "YouTube"} Link`}
              className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold hover:text-slate-900 bg-white hover:bg-slate-100 px-3 py-2 rounded-xl border border-slate-200 transition-colors shadow-xs"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy Link"}</span>
            </button>

            <a
              href={task.youtubeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border transition-colors shadow-xs ${
                isGDrive
                  ? "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                  : "text-red-600 bg-red-50 hover:bg-red-100 border-red-200"
              }`}
            >
              <span>{isGDrive ? "Open in Google Drive" : "Open on YouTube"}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>            {onDelete && (
              <button
                disabled={loading}
                onClick={handleDelete}
                title="Delete Task"
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
