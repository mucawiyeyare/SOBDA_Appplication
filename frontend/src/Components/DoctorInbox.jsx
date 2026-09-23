import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { ArrowLeft, Inbox, MessageCircle } from "lucide-react";
import ConsultChat from "./ConsultChat.jsx";

const authHeaders = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } });

const shortTime = (d) => new Date(d).toLocaleDateString([], { day: "numeric", month: "short" });

function DonorAvatar({ donor, size = "h-12 w-12" }) {
  return donor.profileImage ? (
    <img src={donor.profileImage} alt="" className={`${size} flex-shrink-0 rounded-full bg-soft object-cover`} />
  ) : (
    <div className={`${size} flex flex-shrink-0 items-center justify-center rounded-full bg-soft text-sm font-extrabold text-navy`}>
      {(donor.name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// Doctor dashboard: questions donors sent, and the doctor's answers.
function DoctorInbox() {
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedId, setSelectedId] = useState(params.get("donor") || null);
  const [donor, setDonor] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileChat, setMobileChat] = useState(Boolean(params.get("donor")));
  const [error, setError] = useState("");

  const loadThreads = useCallback(async () => {
    try {
      const res = await axios.get("/api/consult/inbox", authHeaders());
      setThreads(res.data || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your inbox.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (donorId) => {
    if (!donorId) return;
    try {
      const res = await axios.get(`/api/consult/inbox/${donorId}`, authHeaders());
      setDonor(res.data.donor);
      setMessages(res.data.messages || []);
      window.dispatchEvent(new Event("consult-unread-changed"));
    } catch {
      // keep what we have
    }
  }, []);

  useEffect(() => {
    loadThreads();
    const timer = setInterval(loadThreads, 8000);
    return () => clearInterval(timer);
  }, [loadThreads]);

  useEffect(() => {
    setMessages([]);
    setDonor(null);
    if (!selectedId) return undefined;
    loadMessages(selectedId);
    const timer = setInterval(() => loadMessages(selectedId), 5000);
    return () => clearInterval(timer);
  }, [selectedId, loadMessages]);

  const select = (id) => {
    setSelectedId(id);
    setMobileChat(true);
    setParams({ donor: id }, { replace: true });
  };

  const send = async (text) => {
    const res = await axios.post(`/api/consult/inbox/${selectedId}`, { text }, authHeaders());
    setMessages((prev) => [...prev, res.data]);
    loadThreads();
  };

  const totalUnread = threads.reduce((sum, t) => sum + (t.unread || 0), 0);

  return (
    <div className="p-3 sm:p-6">
      <div className="mb-4">
        <h1 className="flex items-center gap-2.5 text-2xl font-black text-slate-800">
          <Inbox className="h-7 w-7 text-red-600" />
          Donor Questions
          {totalUnread > 0 && (
            <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white">{totalUnread} new</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Questions donors sent you through the website. Your answers appear in their dashboard.
        </p>
      </div>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid h-[calc(100vh-14rem)] min-h-[480px] overflow-hidden rounded-2xl border border-line bg-white shadow-sm lg:grid-cols-[340px_1fr]">
        {/* Donors who wrote */}
        <aside className={`min-h-0 flex-col border-line lg:flex lg:border-r ${mobileChat ? "hidden" : "flex"}`}>
          <div className="border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <p className="p-6 text-center text-sm text-slate-400">Loading…</p>
            ) : threads.length === 0 ? (
              <p className="p-6 text-center text-sm text-slate-400">
                No questions yet. When a donor writes to you, the conversation will appear here.
              </p>
            ) : (
              threads.map((t) => {
                const active = String(t.donorId) === String(selectedId);
                return (
                  <button
                    key={t.donorId}
                    type="button"
                    onClick={() => select(t.donorId)}
                    className={`flex w-full items-center gap-3 border-b border-line/60 px-4 py-3 text-left transition-colors ${
                      active ? "bg-soft" : "hover:bg-slate-50"
                    }`}
                  >
                    <DonorAvatar donor={t.donor} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-bold text-navy">{t.donor.name}</p>
                        <span className="flex-shrink-0 text-[10px] text-slate-400">{shortTime(t.lastMessage.createdAt)}</span>
                      </div>
                      <p className="truncate text-xs text-slate-500">
                        {t.lastMessage.sender === "doctor" ? "You: " : ""}
                        {t.lastMessage.text}
                      </p>
                    </div>
                    {t.unread > 0 && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{t.unread}</span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Conversation */}
        <section className={`min-h-0 flex-col lg:flex ${mobileChat ? "flex" : "hidden"}`}>
          {selectedId ? (
            <>
              <div className="flex items-center gap-3 border-b border-line px-3 py-3 sm:px-5">
                <button
                  type="button"
                  onClick={() => setMobileChat(false)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                {donor && <DonorAvatar donor={donor} size="h-11 w-11" />}
                <div className="min-w-0">
                  <p className="truncate font-bold text-navy">{donor ? donor.name : "Loading…"}</p>
                  {donor?.bloodType && (
                    <span className="inline-block rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                      Blood group {donor.bloodType}
                    </span>
                  )}
                </div>
              </div>
              <div className="min-h-0 flex-1">
                <ConsultChat
                  messages={messages}
                  me="doctor"
                  onSend={send}
                  placeholder="Write your answer…"
                  emptyTitle="No messages yet"
                  emptyText="This donor has not written yet."
                />
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <MessageCircle className="mb-3 h-12 w-12 text-slate-300" />
              <p className="text-lg font-extrabold text-navy">Select a conversation</p>
              <p className="mt-2 max-w-sm text-sm text-slate-500">
                Open a donor from the list to read their question and reply.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DoctorInbox;
