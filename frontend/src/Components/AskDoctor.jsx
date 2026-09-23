import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, MessageCircle, Stethoscope, Info } from "lucide-react";
import ConsultChat from "./ConsultChat.jsx";
import { doctorDisplayName, initialsOf } from "../utils/doctorName.js";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const shortTime = (d) =>
  new Date(d).toLocaleDateString([], { day: "numeric", month: "short" });

function DoctorAvatar({ doctor, size = "h-12 w-12" }) {
  return doctor.photo ? (
    <img src={doctor.photo} alt="" className={`${size} flex-shrink-0 rounded-full bg-soft object-cover`} />
  ) : (
    <div className={`${size} flex flex-shrink-0 items-center justify-center rounded-full bg-soft text-sm font-extrabold text-navy`}>
      {initialsOf(doctor.name)}
    </div>
  );
}

// Donor dashboard: choose a doctor and message them inside the app (never WhatsApp).
function AskDoctor() {
  const [params, setParams] = useSearchParams();
  const [doctors, setDoctors] = useState([]);
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(params.get("doctor") || null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileChat, setMobileChat] = useState(Boolean(params.get("doctor")));

  const loadThreads = useCallback(async () => {
    try {
      const res = await axios.get("/api/consult/my-threads", authHeaders());
      setThreads(res.data || []);
    } catch {
      // keep what we have
    }
  }, []);

  const loadMessages = useCallback(async (doctorId) => {
    if (!doctorId) return;
    try {
      const res = await axios.get(`/api/consult/thread/${doctorId}`, authHeaders());
      setMessages(res.data.messages || []);
      window.dispatchEvent(new Event("consult-unread-changed"));
    } catch {
      // keep what we have
    }
  }, []);

  // Doctors that can answer in the app
  useEffect(() => {
    axios
      .get("/api/doctors")
      .then((res) => setDoctors((res.data || []).filter((d) => d.canChat)))
      .catch(() => {})
      .finally(() => setLoading(false));
    loadThreads();
    const timer = setInterval(loadThreads, 8000);
    return () => clearInterval(timer);
  }, [loadThreads]);

  // Open conversation: load now, then poll for the doctor's replies
  useEffect(() => {
    setMessages([]);
    if (!selectedId) return undefined;
    loadMessages(selectedId);
    const timer = setInterval(() => loadMessages(selectedId), 5000);
    return () => clearInterval(timer);
  }, [selectedId, loadMessages]);

  const items = useMemo(() => {
    const byDoctor = new Map(threads.map((t) => [String(t.doctorId), t]));
    return doctors
      .map((d) => ({ doctor: d, thread: byDoctor.get(String(d._id)) || null }))
      .sort((a, b) => {
        if (a.thread && b.thread) return new Date(b.thread.lastMessage.createdAt) - new Date(a.thread.lastMessage.createdAt);
        if (a.thread) return -1;
        if (b.thread) return 1;
        return a.doctor.name.localeCompare(b.doctor.name);
      });
  }, [doctors, threads]);

  const selected = doctors.find((d) => String(d._id) === String(selectedId)) || null;

  const select = (id) => {
    setSelectedId(id);
    setMobileChat(true);
    setParams({ doctor: id }, { replace: true });
  };

  const send = async (text) => {
    const res = await axios.post(`/api/consult/thread/${selectedId}`, { text }, authHeaders());
    setMessages((prev) => [...prev, res.data]);
    loadThreads();
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4">
        <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-800">
          <Stethoscope className="h-7 w-7 text-red-600" />
          Ask a Doctor
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Send your question to one of our doctors. They answer here, inside SOBDA.
        </p>
      </div>

      <div className="grid h-[calc(100vh-14rem)] min-h-[480px] overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:grid-cols-[320px_1fr]">
        {/* Doctor list */}
        <aside className={`min-h-0 flex-col border-line lg:flex lg:border-r ${mobileChat ? "hidden" : "flex"}`}>
          <div className="border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Choose a doctor
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">Loading doctors…</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                No doctors are available for chat yet. Please check back soon.
              </p>
            ) : (
              items.map(({ doctor, thread }) => {
                const active = String(doctor._id) === String(selectedId);
                return (
                  <button
                    key={doctor._id}
                    type="button"
                    onClick={() => select(doctor._id)}
                    className={`flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors ${
                      active ? "bg-soft" : "hover:bg-slate-50"
                    }`}
                  >
                    <DoctorAvatar doctor={doctor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-navy">{doctorDisplayName(doctor.name)}</p>
                        {thread && <span className="flex-shrink-0 text-[10px] text-slate-400">{shortTime(thread.lastMessage.createdAt)}</span>}
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {thread
                          ? `${thread.lastMessage.sender === "donor" ? "You: " : ""}${thread.lastMessage.text}`
                          : doctor.specialty}
                      </p>
                    </div>
                    {thread?.unread > 0 && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{thread.unread}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Conversation */}
        <section className={`min-h-0 flex-col lg:flex ${mobileChat ? "flex" : "hidden"}`}>
          {selected ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setMobileChat(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                  aria-label="Back to doctors"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <DoctorAvatar doctor={selected} size="h-11 w-11" />
                <div className="min-w-0">
                  <p className="truncate font-bold text-navy">{doctorDisplayName(selected.name)}</p>
                  <p className="truncate text-xs text-slate-500">{selected.specialty}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 border-b border-line bg-amber-50 px-4 py-2 text-[11px] text-amber-800">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                <span>Doctors give general guidance only. In an emergency, go to the nearest hospital.</span>
              </div>
              <div className="min-h-0 flex-1">
                <ConsultChat
                  messages={messages}
                  me="donor"
                  onSend={send}
                  placeholder={`Write the question you want to ask ${doctorDisplayName(selected.name)}…`}
                  emptyTitle="Ask Doctor"
                  emptyText={`Write the question you want to ask ${doctorDisplayName(selected.name)}. You will be notified as soon as they answer.`}
                />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-lg font-extrabold text-navy">Select a doctor</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Choose a doctor from the list to ask them a question about donating blood or your health.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default AskDoctor;
