import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  Mail, Phone, Calendar, Trash2, Search, Filter, MessageSquare, 
  User, Clock, Paperclip, FileText, Image as ImageIcon, Eye, Download,
  ExternalLink, X, ShieldAlert, CheckCircle, Smartphone
} from "lucide-react";

function DashboardMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [previewDoc, setPreviewDoc] = useState(null); // { name, type, size, category, data, isImage, isPdf }

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      const response = await axios.get("/api/contact", config);
      setMessages(response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages");
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message and its justification records?")) {
      try {
        const token = localStorage.getItem("token");
        const config = {
          headers: {
            Authorization: `Bearer ${token}`
          }
        };
        await axios.delete(`/api/contact/${id}`, config);
        setMessages(messages.filter((msg) => msg._id !== id));
      } catch (err) {
        console.error("Error deleting message:", err);
        alert("Failed to delete message");
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "New": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Read": return "bg-gray-100 text-gray-800 border-gray-200";
      case "Replied": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case "Emergency":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-red-600 text-white animate-pulse">🚨 EMERGENCY</span>;
      case "Urgent":
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">🔴 URGENT</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">🟢 Normal</span>;
    }
  };

  const cleanPhoneForWhatsApp = (msg) => {
    if (!msg.phone) return "";
    let clean = msg.phone.replace(/\D/g, "");
    if (clean.startsWith("0")) {
      clean = clean.substring(1);
    }
    if (clean.startsWith("252")) return clean;
    if (msg.carrierCode && msg.carrierCode.includes("+252")) {
      const prefixDigits = msg.carrierCode.replace(/\D/g, "");
      if (clean.startsWith(prefixDigits.replace("252", ""))) {
        return `252${clean}`;
      }
      return `${prefixDigits}${clean}`;
    }
    return `252${clean}`;
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = 
      (msg.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.subject || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.message || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.phone || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === "all") return matchesSearch;
    if (filter === "with_attachments") return matchesSearch && (msg.attachments && msg.attachments.length > 0);
    return matchesSearch && msg.status === filter;
  });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-red-600" />
            Messages & Blood Justification Inquiries
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Review urgent blood requests, official hospital requisitions, and medical verification files
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name, email, subject, phone..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 w-full sm:w-72 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white text-sm font-semibold cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Submissions</option>
            <option value="with_attachments">📎 Has Justification Files</option>
            <option value="New">New</option>
            <option value="Read">Read</option>
            <option value="Replied">Replied</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
          {error}
        </div>
      )}

      {filteredMessages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-700">No messages found</h3>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search query or filter selection</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredMessages.map((msg) => {
            const hasAttachments = msg.attachments && msg.attachments.length > 0;
            const waNumber = cleanPhoneForWhatsApp(msg);

            return (
              <div key={msg._id} className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6 md:p-7 hover:shadow-md transition-all min-w-0 break-words">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="flex-1 min-w-0">
                    {/* Status & Timestamp Header */}
                    <div className="flex flex-wrap items-center gap-2.5 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(msg.status)}`}>
                        {msg.status}
                      </span>
                      {getUrgencyBadge(msg.urgency)}

                      {msg.carrier && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          📶 {msg.carrier}
                        </span>
                      )}

                      <span className="text-xs text-gray-500 flex items-center gap-1 ml-auto sm:ml-0">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {/* Subject */}
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 mb-2 flex flex-wrap items-center gap-2">
                      <span>{msg.subject}</span>
                      {hasAttachments && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                          <Paperclip className="w-3.5 h-3.5" />
                          {msg.attachments.length} {msg.attachments.length === 1 ? "Justification File" : "Justification Files"}
                        </span>
                      )}
                    </h3>
                    
                    {/* User info bar */}
                    <div className="flex flex-wrap gap-y-2 gap-x-5 text-sm text-gray-600 mb-4 bg-slate-50/70 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-2 font-bold text-slate-800">
                        <User className="w-4 h-4 text-red-600" />
                        {msg.fullName}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <a href={`mailto:${msg.email}`} className="hover:text-red-600 hover:underline">
                          {msg.email}
                        </a>
                      </div>
                      {msg.phone && (
                        <div className="flex items-center gap-2 font-semibold">
                          <Smartphone className="w-4 h-4 text-slate-400" />
                          <span>{msg.formattedPhone || `${msg.carrierCode || "+252 61"} ${msg.phone}`}</span>
                        </div>
                      )}
                    </div>

                    {/* Message body */}
                    <div className="bg-slate-50/90 rounded-2xl p-4 text-gray-800 border border-slate-200 text-sm leading-relaxed mb-4">
                      <p className="whitespace-pre-wrap">{msg.message}</p>
                    </div>

                    {/* ATTACHMENTS PREVIEW LIST */}
                    {hasAttachments && (
                      <div className="mt-4 pt-4 border-t border-slate-200/80">
                        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Paperclip className="w-4 h-4 text-red-600" />
                          Attached Medical Justification Documents ({msg.attachments.length}):
                        </h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {msg.attachments.map((att, idx) => {
                            const isImg = (att.type && att.type.startsWith("image/")) || (att.data && att.data.startsWith("data:image/"));
                            const isPdf = (att.type && att.type.includes("pdf")) || (att.name && att.name.toLowerCase().endsWith(".pdf"));

                            return (
                              <div
                                key={idx}
                                className="flex items-center justify-between gap-2.5 p-2.5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow hover:border-red-300 transition-all group"
                              >
                                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                  {isImg ? (
                                    <div
                                      onClick={() => setPreviewDoc({ ...att, isImage: true, isPdf: false })}
                                      className="w-11 h-11 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 cursor-pointer border border-slate-200 relative group-hover:opacity-90"
                                    >
                                      <img
                                        src={att.data}
                                        alt={att.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      onClick={() => setPreviewDoc({ ...att, isImage: false, isPdf: isPdf })}
                                      className="w-11 h-11 rounded-xl bg-red-50 text-red-600 flex-shrink-0 flex items-center justify-center border border-red-100 cursor-pointer"
                                    >
                                      <FileText className="w-5 h-5" />
                                    </div>
                                  )}

                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>
                                      {att.name}
                                    </p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                      <span className="text-[10px] text-slate-500">
                                        {formatFileSize(att.size)}
                                      </span>
                                      <span className="text-[9px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-bold truncate max-w-[110px]">
                                        {att.category || "Justification"}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => setPreviewDoc({ ...att, isImage: isImg, isPdf: isPdf })}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="View Document"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <a
                                    href={att.data}
                                    download={att.name}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Download Document"
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="flex lg:flex-col gap-2.5 justify-end lg:justify-start lg:border-l lg:pl-6 lg:border-gray-100 flex-shrink-0">
                    {/* WhatsApp Quick Reply */}
                    {waNumber && (
                      <a
                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(`Hello ${msg.fullName}, we received your blood request / inquiry regarding "${msg.subject}".`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                        title="Chat directly on WhatsApp"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>WhatsApp Chat</span>
                      </a>
                    )}

                    {/* Email Reply */}
                    <a
                      href={`mailto:${msg.email}?subject=Re: ${msg.subject}`}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-blue-200 hover:border-blue-300 text-xs font-bold"
                      title="Reply via Email"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email Reply</span>
                    </a>

                    {/* Delete Message */}
                    <button
                      onClick={() => handleDelete(msg._id)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 hover:border-red-300 text-xs font-bold"
                      title="Delete Record"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  {previewDoc.isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm truncate max-w-md">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-400">
                    {previewDoc.category} • {formatFileSize(previewDoc.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex items-center justify-center bg-slate-100 min-h-[350px]">
              {previewDoc.isImage ? (
                <img
                  src={previewDoc.data}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              ) : previewDoc.isPdf ? (
                <iframe
                  src={previewDoc.data}
                  title={previewDoc.name}
                  className="w-full h-[65vh] rounded-xl border border-slate-300"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-3" />
                  <h4 className="font-bold text-slate-800 mb-1">{previewDoc.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">Binary Document ({formatFileSize(previewDoc.size)})</p>
                  <a
                    href={previewDoc.data}
                    download={previewDoc.name}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700"
                  >
                    <Download className="w-4 h-4" />
                    Download File
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-semibold">
                Medical Justification Document Viewer
              </span>
              <div className="flex gap-2">
                <a
                  href={previewDoc.data}
                  download={previewDoc.name}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DashboardMessages;

