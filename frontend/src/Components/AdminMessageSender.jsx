import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  MessageSquare,
  Send,
  Users,
  Edit3,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Eye,
  Droplet,
  Phone,
  Search,
} from "lucide-react";

/* ─── Default template that hospitals send automatically ─────────────── */
const DEFAULT_TEMPLATE = `Asc Wll {donorName},

Waxaan kula soo xiriiraynaa *{hospitalName}* 🏥

🩸 *Waxaa loo baahan yahay dhiig-bixin degdeg ah!*

Fadlan haddii aad awooddo, kaalay *{hospitalName}*
📍 Goobta: {hospitalLocation}

Mahadsanid walaal {donorName}.
Caawintaadu waxay badbaadin kartaa nolol Allaha ka ajarsiyo. ❤️🩸

— *SOBDA System*`;

const STORAGE_KEY = "waMessageTemplate";

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const applyTemplate = (template, vars = {}) =>
  template
    .replace(/{donorName}/g, vars.donorName || "Walaal")
    .replace(/{hospitalName}/g, vars.hospitalName || "Isbitaalka")
    .replace(/{hospitalLocation}/g, vars.hospitalLocation || "Mogadishu");

const formatPhone = (p) => {
  if (!p) return "";
  let c = p.toString().replace(/\D/g, "");
  if (c.startsWith("0")) c = "252" + c.slice(1);
  else if (!c.startsWith("252") && c.length <= 9) c = "252" + c;
  return c;
};

/* ══════════════════════════════════════════════════════════════════════ */
export default function AdminMessageSender() {
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  /* ── State ── */
  const [tab, setTab] = useState("template"); // template | single | broadcast
  const [donors, setDonors] = useState([]);
  const [loadingDonors, setLoadingDonors] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // Template editor
  const [template, setTemplate] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_TEMPLATE
  );
  const [templateSaved, setTemplateSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Single send
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [customMsg, setCustomMsg] = useState("");
  const [sendingDonor, setSendingDonor] = useState(false);

  // Broadcast
  const [broadcastMsg, setBroadcastMsg] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_TEMPLATE
  );
  const [filterBlood, setFilterBlood] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  /* ── Fetch donors ── */
  useEffect(() => {
    axios
      .get("/api/users?role=donor&limit=500", { headers })
      .then((r) => setDonors(r.data?.users || r.data?.donors || r.data || []))
      .catch(() => setDonors([]))
      .finally(() => setLoadingDonors(false));
  }, []);

  const showToast = (type, title, desc) => {
    setToast({ type, title, desc });
    setTimeout(() => setToast(null), 5000);
  };

  /* ── Template save ── */
  const saveTemplate = () => {
    localStorage.setItem(STORAGE_KEY, template);
    setTemplateSaved(true);
    setTimeout(() => setTemplateSaved(false), 2500);
    showToast("success", "Template Saved", "Default WhatsApp message template updated.");
  };

  const resetTemplate = () => {
    setTemplate(DEFAULT_TEMPLATE);
    localStorage.setItem(STORAGE_KEY, DEFAULT_TEMPLATE);
    showToast("info", "Template Reset", "Restored original default message.");
  };

  /* ── Single send ── */
  const handleSingleSend = async () => {
    if (!selectedDonor) return showToast("warning", "Select a donor first", "");
    if (!customMsg.trim()) return showToast("warning", "Message is empty", "Type a message before sending.");
    setSendingDonor(true);
    try {
      const phone = formatPhone(selectedDonor.phone);
      await axios.post("/api/whatsapp/send", { phone, message: customMsg }, { headers });
      showToast("success", "Sent ✅", `WhatsApp message delivered to ${selectedDonor.name}.`);
    } catch (err) {
      showToast("warning", "Send Failed", err.response?.data?.message || "WhatsApp gateway may be disconnected.");
    } finally {
      setSendingDonor(false);
    }
  };

  /* ── Broadcast ── */
  const handleBroadcast = async () => {
    const targets = donors.filter(
      (d) =>
        d.status === "Available" &&
        (filterBlood === "" || d.bloodType === filterBlood)
    );
    if (targets.length === 0)
      return showToast("warning", "No Donors", "No available donors match the filter.");
    if (!broadcastMsg.trim())
      return showToast("warning", "Message empty", "Write a message before broadcasting.");

    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await axios.post(
        "/api/requests/create-batch",
        {
          donorIds: targets.map((d) => d._id),
          bloodType: filterBlood || undefined,
          urgency: "Urgent",
          message: broadcastMsg,
        },
        { headers }
      );
      setBroadcastResult(res.data);
      showToast(
        "success",
        "Broadcast Sent ✅",
        `Sent to ${res.data.createdCount} donors. Skipped: ${res.data.skippedCount || 0}.`
      );
    } catch (err) {
      showToast("warning", "Broadcast Failed", err.response?.data?.message || "Try again.");
    } finally {
      setBroadcasting(false);
    }
  };

  /* ── Filtered donor list ── */
  const filteredDonors = donors.filter((d) =>
    [d.name, d.phone, d.bloodType, d.location]
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  /* ── Tab style helper ── */
  const tabClass = (t) =>
    `px-4 py-2.5 text-sm font-semibold rounded-xl transition-all ${
      tab === t
        ? "bg-red-600 text-white shadow-md"
        : "text-slate-400 hover:bg-slate-700/60 hover:text-white"
    }`;

  /* ══════════ Render ══════════ */
  return (
    <div className="min-h-screen bg-slate-950 p-4 sm:p-6 text-white">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Send Messages</h1>
            <p className="text-xs text-slate-400">
              Edit the auto-sent WhatsApp template • Send to individual donors • Broadcast to all
            </p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-xl shadow-xl border text-sm max-w-sm animate-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
              : toast.type === "warning"
              ? "bg-red-900/90 border-red-700 text-red-100"
              : "bg-slate-800 border-slate-700 text-slate-100"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
          )}
          <div>
            <p className="font-bold">{toast.title}</p>
            {toast.desc && <p className="text-xs mt-0.5 opacity-80">{toast.desc}</p>}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 bg-slate-900/60 p-1.5 rounded-2xl w-full sm:w-fit">
        <button onClick={() => setTab("template")} className={tabClass("template")}>
          <span className="flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" /> Template Editor
          </span>
        </button>
        <button onClick={() => setTab("single")} className={tabClass("single")}>
          <span className="flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Send to Donor
          </span>
        </button>
        <button onClick={() => setTab("broadcast")} className={tabClass("broadcast")}>
          <span className="flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Broadcast
          </span>
        </button>
      </div>

      {/* ── TAB: Template Editor ── */}
      {tab === "template" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-base text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-400" />
                Auto-Send Template
              </h2>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white border border-slate-700 rounded-lg px-2 py-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                {showPreview ? "Hide Preview" : "Preview"}
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              Placeholders:{" "}
              <code className="bg-slate-800 px-1 rounded text-indigo-300">{"{donorName}"}</code>{" "}
              <code className="bg-slate-800 px-1 rounded text-indigo-300">{"{hospitalName}"}</code>{" "}
              <code className="bg-slate-800 px-1 rounded text-indigo-300">{"{hospitalLocation}"}</code>
            </p>

            <textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={16}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
              placeholder="Write WhatsApp message template..."
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={saveTemplate}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-colors"
              >
                <Save className="w-4 h-4" />
                {templateSaved ? "Saved ✓" : "Save Template"}
              </button>
              <button
                onClick={resetTemplate}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm text-slate-300 font-semibold transition-colors"
                title="Reset to default"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <h2 className="font-bold text-base text-white flex items-center gap-2 mb-3">
              <Eye className="w-4 h-4 text-emerald-400" />
              Live Preview
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              This is how the message looks when sent with sample values.
            </p>
            <div className="bg-[#0b1014] rounded-xl p-4 border border-slate-800 min-h-[320px]">
              {/* WhatsApp-style bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-[#005c4b] rounded-2xl rounded-tr-sm px-4 py-3">
                  <pre className="whitespace-pre-wrap text-sm text-[#e9edef] font-sans leading-relaxed">
                    {applyTemplate(template, {
                      donorName: "Abdisamad Guutale",
                      hospitalName: "Martini Hospital",
                      hospitalLocation: "Mogadishu",
                    })}
                  </pre>
                  <p className="text-right text-[10px] text-[#8696a0] mt-2">
                    {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ✓✓
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Template is used automatically when hospitals send blood requests
            </p>
          </div>
        </div>
      )}

      {/* ── TAB: Send to Single Donor ── */}
      {tab === "single" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donor search list */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <h2 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-sky-400" />
              Select Donor
            </h2>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, phone, blood type..."
                className="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {loadingDonors ? (
                <p className="text-xs text-slate-500 text-center py-8">Loading donors…</p>
              ) : filteredDonors.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-8">No donors found</p>
              ) : (
                filteredDonors.slice(0, 60).map((d) => (
                  <button
                    key={d._id}
                    onClick={() => {
                      setSelectedDonor(d);
                      setCustomMsg(
                        applyTemplate(template, {
                          donorName: d.name,
                          hospitalName: localStorage.getItem("userName") || "Isbitaalka",
                          hospitalLocation: "Mogadishu",
                        })
                      );
                    }}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${
                      selectedDonor?._id === d._id
                        ? "bg-indigo-600/20 border-indigo-500/50 text-white"
                        : "border-slate-800 hover:bg-slate-800 text-slate-300"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center flex-shrink-0">
                      <Droplet className="w-4 h-4 text-red-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {d.bloodType} • {d.phone}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        d.status === "Available"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {d.status || "Unknown"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message composer */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col">
            <h2 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              Compose Message
            </h2>

            {selectedDonor ? (
              <div className="mb-3 flex items-center gap-3 bg-slate-800/60 rounded-xl px-3 py-2.5 border border-slate-700">
                <div className="w-8 h-8 rounded-full bg-red-600/30 flex items-center justify-center">
                  <Droplet className="w-4 h-4 text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{selectedDonor.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {selectedDonor.phone}
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-3 bg-slate-800/40 rounded-xl px-3 py-3 border border-dashed border-slate-700 text-center text-xs text-slate-500">
                Select a donor from the list
              </div>
            )}

            <textarea
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              rows={12}
              placeholder="Message will appear here after selecting a donor…"
              className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
            />

            <button
              onClick={handleSingleSend}
              disabled={sendingDonor || !selectedDonor}
              className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors"
            >
              <Send className="w-4 h-4" />
              {sendingDonor ? "Sending…" : "Send WhatsApp Message"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: Broadcast ── */}
      {tab === "broadcast" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <h2 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-amber-400" />
              Broadcast to All Donors
            </h2>

            {/* Filter */}
            <div className="mb-4">
              <label className="text-xs text-slate-400 font-semibold mb-1 block">
                Filter by Blood Type (optional)
              </label>
              <select
                value={filterBlood}
                onChange={(e) => setFilterBlood(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">All Blood Types</option>
                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Target count */}
            <div className="mb-4 bg-slate-800/60 rounded-xl px-4 py-3 border border-slate-700">
              <p className="text-xs text-slate-400 mb-1">Target donors</p>
              <p className="text-2xl font-black text-white">
                {
                  donors.filter(
                    (d) =>
                      d.status === "Available" &&
                      (filterBlood === "" || d.bloodType === filterBlood)
                  ).length
                }
                <span className="text-sm font-medium text-slate-400 ml-2">Available donors</span>
              </p>
            </div>

            <textarea
              value={broadcastMsg}
              onChange={(e) => setBroadcastMsg(e.target.value)}
              rows={10}
              placeholder="Type the broadcast message…"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
            />

            <button
              onClick={handleBroadcast}
              disabled={broadcasting}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm transition-colors"
            >
              <Users className="w-4 h-4" />
              {broadcasting ? "Broadcasting…" : "Send to All Matching Donors"}
            </button>
          </div>

          {/* Result */}
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
            <h2 className="font-bold text-base text-white flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              Last Broadcast Result
            </h2>
            {broadcastResult ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-900/30 border border-emerald-800/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-emerald-400">{broadcastResult.createdCount}</p>
                    <p className="text-xs text-emerald-300 mt-1">Sent successfully</p>
                  </div>
                  <div className="bg-amber-900/30 border border-amber-800/50 rounded-xl p-4 text-center">
                    <p className="text-3xl font-black text-amber-400">{broadcastResult.skippedCount || 0}</p>
                    <p className="text-xs text-amber-300 mt-1">Skipped</p>
                  </div>
                </div>
                {broadcastResult.skipped?.length > 0 && (
                  <div className="bg-slate-800/60 rounded-xl p-3 border border-slate-700">
                    <p className="text-xs font-bold text-slate-300 mb-2">Skipped donors:</p>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {broadcastResult.skipped.map((s, i) => (
                        <p key={i} className="text-xs text-slate-400">
                          • {s.name || s.donorId} — {s.reason}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-slate-600">
                <Users className="w-12 h-12 mb-3" />
                <p className="text-sm">No broadcast sent yet</p>
                <p className="text-xs mt-1">Results will appear here after sending</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
