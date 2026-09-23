import React, { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";

const MAX_LEN = 2000;

const timeOf = (d) => new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
const dayOf = (d) => new Date(d).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

// Message bubbles + composer shared by the donor "Ask a Doctor" page and the doctor inbox.
// `me` is "donor" or "doctor"; `onSend(text)` returns a promise and may throw.
function ConsultChat({ messages, me, onSend, placeholder, emptyTitle, emptyText }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef(null);
  const seenCount = useRef(0);

  // Keep the newest message in view
  useEffect(() => {
    if (messages.length !== seenCount.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      seenCount.current = messages.length;
    }
  }, [messages]);

  const submit = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    setError("");
    try {
      await onSend(value);
      setText("");
    } catch (err) {
      setError(err.response?.data?.message || "Your message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  let lastDay = "";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-6 text-center">
            <p className="text-lg font-extrabold text-navy">{emptyTitle}</p>
            <p className="mt-2 max-w-sm text-sm text-slate-500">{emptyText}</p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender === me;
            const day = dayOf(m.createdAt);
            const showDay = day !== lastDay;
            lastDay = day;
            return (
              <React.Fragment key={m._id}>
                {showDay && (
                  <div className="py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {day}
                  </div>
                )}
                <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-[70%] ${
                      mine
                        ? "rounded-br-md bg-navy text-white"
                        : "rounded-bl-md border border-line bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p className={`mt-1 text-right text-[10px] ${mine ? "text-white/60" : "text-slate-400"}`}>
                      {timeOf(m.createdAt)}
                    </p>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      <div className="border-t border-line bg-white p-3 sm:p-4">
        {error && <p className="mb-2 text-xs font-semibold text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
            onKeyDown={onKeyDown}
            rows={2}
            placeholder={placeholder}
            className="max-h-40 min-h-[3rem] flex-1 resize-none rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-navy focus:ring-2 focus:ring-navy/15"
          />
          <button
            type="button"
            onClick={submit}
            disabled={sending || !text.trim()}
            className="inline-flex h-12 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            <span className="hidden sm:inline">{sending ? "Sending…" : "Send"}</span>
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-slate-400">Enter to send · Shift+Enter for a new line</p>
      </div>
    </div>
  );
}

export default ConsultChat;
