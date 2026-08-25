"use client";

import React from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

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

interface CalendarViewProps {
  events: Array<{
    id: string;
    title: string;
    start: string;
    backgroundColor: string;
    borderColor: string;
    extendedProps: TaskItem;
  }>;
  onEventClick: (task: TaskItem) => void;
}

export default function CalendarView({ events, onEventClick }: CalendarViewProps) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      events={events}
      eventClick={(info) => {
        const props = info.event.extendedProps as TaskItem;
        onEventClick(props);
      }}
      height="auto"
    />
  );
}
