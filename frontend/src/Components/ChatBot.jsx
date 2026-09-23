import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Droplet } from "lucide-react";

// ── FAQ Knowledge Base ──────────────────────────────────────────────
const FAQ = [
  {
    keywords: ["what is sobda", "about sobda", "what is this", "who are you", "tell me about"],
    answer:
      "🩸 **SOBDA** is Somalia's national blood donation management system. We connect registered blood donors with hospitals in real time, making it faster and easier to save lives across the country.",
  },
  {
    keywords: ["register", "sign up", "how to join", "become donor", "how do i donate"],
    answer:
      "✅ To register as a donor:\n1. Click **'Register as Donor'** on the home page\n2. Fill in your name, blood type, phone, and location\n3. Submit — you're in! Hospitals can now find and contact you when they need blood.",
  },
  {
    keywords: ["blood type", "types", "which blood", "accept", "compatible"],
    answer:
      "🩸 We accept all 8 blood types:\n**A+, A−, B+, B−, AB+, AB−, O+, O−**\n\nEvery blood type is needed. O− is the universal donor — especially critical in emergencies!",
  },
  {
    keywords: ["how often", "how many times", "frequency", "cooldown", "wait", "donate again"],
    answer:
      "⏳ You can donate whole blood every **90 days (3 months)**. After a completed donation, your status is temporarily set to unavailable, then automatically resets to Available after the cooldown period.",
  },
  {
    keywords: ["what happens after", "after donate", "after donation", "next step", "process"],
    answer:
      "❤️ After you donate:\n1. Your status is marked **Donated**\n2. A 90-day cooldown starts automatically\n3. Your donation is recorded in your history\n4. After cooldown, you're Available again to help save more lives!",
  },
  {
    keywords: ["hospital", "how hospital", "request", "hospital send", "how does hospital"],
    answer:
      "🏥 Hospitals log into SOBDA and:\n1. Filter donors by blood type, location & availability\n2. Select one or multiple donors\n3. Fill in patient details\n4. Send a WhatsApp request directly to the donor\n5. A **2-hour arrival window** starts automatically",
  },
  {
    keywords: ["2 hour", "two hour", "time limit", "pending", "expire", "window"],
    answer:
      "⏱️ The **2-Hour Rule**: When a hospital sends you a request, you have 2 hours to arrive at the hospital. If 2 hours pass without arrival, your status resets to Available automatically — no manual action needed.",
  },
  {
    keywords: ["contacted", "whatsapp", "message", "how will i", "notification", "notify"],
    answer:
      "📱 When a hospital selects you, you'll receive a **WhatsApp message** directly to your phone number. The message includes:\n- Hospital name & location\n- Patient details\n- What's needed\n\nMake sure your phone number is up to date!",
  },
  {
    keywords: ["benefit", "why donate", "profit", "good", "advantage", "why should i", "reason"],
    answer:
      "💪 Benefits of donating blood:\n❤️ Save up to 3 lives per donation\n🏥 Free health check before each donation\n🔥 Burns ~650 calories per donation\n🩸 Stimulates new blood cell production\n🌍 Builds community resilience\n🏆 Track your impact — see how many lives you've saved on your profile!",
  },
  {
    keywords: ["safe", "privacy", "information", "data", "secure", "personal"],
    answer:
      "🔒 Your information is **completely safe**. SOBDA:\n- Only shares your first name and blood type with hospitals\n- Never shares your National ID or full address publicly\n- Uses secure authentication for all users\n- Your donation history is private to you",
  },
  {
    keywords: ["status", "my status", "available", "check status", "donor status"],
    answer:
      "📊 Your donor status moves through these stages:\n🟢 **Available** — Ready to donate\n🟡 **Pending** — Hospital has sent a request (2-hr window)\n🔵 **Arrived** — You're at the hospital\n🔴 **Donated** — Donation complete, in 90-day cooldown",
  },
  {
    keywords: ["contact", "help", "support", "problem", "issue", "reach"],
    answer:
      "📞 Need help? Visit our **Contact** page to reach the SOBDA team. You can also check the **About** page to learn more about our mission.",
  },
];

const QUICK_TOPICS = [
  { label: "What is SOBDA?", query: "what is sobda" },
  { label: "How to register?", query: "how to register" },
  { label: "Benefits of donating", query: "why donate blood" },
  { label: "How requests work", query: "how does hospital send request" },
  { label: "The 2-hour rule", query: "2 hour rule" },
  { label: "Blood types accepted", query: "which blood types" },
];

function getBotAnswer(input) {
  const lower = input.toLowerCase();
  for (const faq of FAQ) {
    if (faq.keywords.some((kw) => lower.includes(kw))) {
      return faq.answer;
    }
  }
  return "🤔 I'm not sure about that yet! Try asking about:\n- How to register\n- Blood types\n- The 2-hour rule\n- Benefits of donating\n\nOr visit our **Contact** page for human support. 😊";
}

function formatAnswer(text) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i}>{part}</strong> : part
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "👋 Hello! I'm the **SOBDA Assistant**.\n\nI can answer questions about blood donation, how our system works, and how you can save lives. What would you like to know?",
      time: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showQuick, setShowQuick] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, typing]);

  const sendMessage = (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");
    setShowQuick(false);

    setMessages((prev) => [...prev, { from: "user", text: userText, time: new Date() }]);
    setTyping(true);

    setTimeout(() => {
      const answer = getBotAnswer(userText);
      setMessages((prev) => [...prev, { from: "bot", text: answer, time: new Date() }]);
      setTyping(false);
    }, 900);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-red-600 to-red-700 text-white shadow-2xl shadow-red-500/40 flex items-center justify-center hover:scale-110 transition-transform"
        aria-label="Open chat"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
          style={{ height: "520px" }}>

          {/* Header */}
          <div className="bg-white border-b border-line px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-soft flex items-center justify-center">
              <Droplet className="w-5 h-5 text-brand" />
            </div>
            <div>
              <p className="text-navy font-bold text-sm">SOBDA Assistant</p>
              <p className="text-slate-500 text-xs flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                Online — always here to help
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.from === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold
                  ${msg.from === "bot" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600"}`}>
                  {msg.from === "bot" ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-line
                  ${msg.from === "bot"
                    ? "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                    : "bg-red-600 text-white rounded-tr-sm"}`}>
                  {formatAnswer(msg.text)}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typing && (
              <div className="flex gap-2 items-center">
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-red-600" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1 items-center">
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick replies */}
            {showQuick && !typing && (
              <div className="pt-1">
                <p className="text-xs text-slate-400 mb-2 font-medium">Quick Topics:</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TOPICS.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => sendMessage(t.query)}
                      className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors font-medium"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-100 bg-white flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about SOBDA..."
              className="flex-1 text-sm px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
