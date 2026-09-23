import React, { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, QrCode, Key, CheckCircle, RefreshCw, X, Copy, Check, Smartphone } from "lucide-react";

export default function WhatsAppConnectModal({ isOpen, onClose, onStatusChange }) {
  const [activeTab, setActiveTab] = useState("pairing"); // 'pairing' | 'qr'
  const [status, setStatus] = useState("disconnected");
  const [connectedNumber, setConnectedNumber] = useState(null);
  const [qrCode, setQrCode] = useState(null);
  const [pairingCode, setPairingCode] = useState(null);
  const [phone, setPhone] = useState("616408886");
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await axios.get("/api/whatsapp/status");
      setStatus(res.data.status);
      setConnectedNumber(res.data.connectedNumber);
      if (res.data.qrCode) setQrCode(res.data.qrCode);
      if (res.data.pairingCode) setPairingCode(res.data.pairingCode);
      if (onStatusChange) onStatusChange(res.data);
    } catch (err) {
      console.error("Failed to fetch WhatsApp status:", err);
    }
  };

  const handleRefreshQR = async () => {
    setQrLoading(true);
    try {
      const res = await axios.get("/api/whatsapp/refresh-qr");
      setStatus(res.data.status);
      if (res.data.qrCode) setQrCode(res.data.qrCode);
      if (onStatusChange) onStatusChange(res.data);
    } catch (err) {
      console.error("Failed to refresh QR:", err);
    } finally {
      setQrLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      if (activeTab === "qr" && !qrCode) {
        handleRefreshQR();
      }
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [isOpen, activeTab]);

  const handleRequestPairingCode = async () => {
    setLoading(true);
    try {
      const res = await axios.post("/api/whatsapp/pair", { phone });
      if (res.data.pairingCode) {
        setPairingCode(res.data.pairingCode);
      } else if (res.data.alreadyConnected) {
        setStatus("connected");
      }
      fetchStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to generate pairing code. Please retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleLogout = async () => {
    if (!confirm("Are you sure you want to disconnect WhatsApp session?")) return;
    try {
      await axios.post("/api/whatsapp/logout");
      setPairingCode(null);
      setQrCode(null);
      fetchStatus();
    } catch (err) {
      alert("Logout failed");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg">WhatsApp Gateway</h3>
              <p className="text-xs text-emerald-100">Automatic Message Dispatcher (616408886)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Pill */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center gap-3">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  status === "connected"
                    ? "bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse"
                    : status === "qr_ready" || status === "connecting"
                    ? "bg-amber-500 animate-ping"
                    : "bg-red-500"
                }`}
              />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Status</div>
                <div className="font-bold text-slate-800 text-sm capitalize">
                  {status === "connected"
                    ? `Connected (${connectedNumber || "252616408886"})`
                    : status === "qr_ready"
                    ? "Ready to Link (QR / Code)"
                    : status === "connecting"
                    ? "Starting Gateway..."
                    : "Disconnected (Click Link)"}
                </div>
              </div>
            </div>

            {status === "connected" ? (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                Disconnect
              </button>
            ) : (
              <button
                onClick={handleRefreshQR}
                disabled={qrLoading}
                className="p-2 text-slate-500 hover:text-emerald-600 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Generate Fresh QR / Code"
              >
                <RefreshCw className={`w-4 h-4 ${qrLoading ? "animate-spin text-emerald-600" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            )}
          </div>

          {status === "connected" ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-800">WhatsApp Gateway is Active!</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Whenever you click <strong className="text-slate-800">"Send Request"</strong>, the server automatically sends the real WhatsApp message from <strong>{connectedNumber || "616408886"}</strong> directly to the donor's WhatsApp.
              </p>
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  onClick={() => setActiveTab("pairing")}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "pairing"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Key className="w-4 h-4" />
                  Pairing Code (Easiest)
                </button>
                <button
                  onClick={() => {
                    setActiveTab("qr");
                    handleRefreshQR();
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    activeTab === "qr"
                      ? "bg-white text-emerald-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <QrCode className="w-4 h-4" />
                  Scan QR Code
                </button>
              </div>

              {/* Pairing Code Tab */}
              {activeTab === "pairing" && (
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700">Sender WhatsApp Number</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="616408886"
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      <button
                        onClick={handleRequestPairingCode}
                        disabled={loading}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {loading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Generating...</span>
                          </>
                        ) : (
                          <span>Get Code</span>
                        )}
                      </button>
                    </div>
                  </div>

                  {pairingCode ? (
                    <div className="p-5 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-center space-y-3">
                      <div className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
                        Enter this 8-digit code on your WhatsApp phone:
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        <div className="text-3xl font-black tracking-widest text-emerald-700 font-mono py-1 px-4 bg-white rounded-xl border border-emerald-200 shadow-sm">
                          {pairingCode}
                        </div>
                        <button
                          onClick={handleCopyCode}
                          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all shadow-sm"
                          title="Copy Code"
                        >
                          {copied ? <Check className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        1. Open WhatsApp on your phone (<strong>{phone}</strong>)<br />
                        2. Tap <strong>Linked Devices &gt; Link with phone number instead</strong><br />
                        3. Type the 8-digit code above.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-4 h-4 text-emerald-600" />
                        How to link with code:
                      </div>
                      <p>Click <strong>"Get Code"</strong> to receive an 8-digit code, then enter it on your phone under WhatsApp Linked Devices.</p>
                    </div>
                  )}
                </div>
              )}

              {/* QR Code Tab */}
              {activeTab === "qr" && (
                <div className="text-center space-y-3 pt-1">
                  {qrCode ? (
                    <div className="p-4 bg-white border border-slate-200 rounded-2xl inline-block shadow-md">
                      <img src={qrCode} alt="WhatsApp QR Code" className="w-52 h-52 mx-auto" />
                    </div>
                  ) : (
                    <div className="h-52 flex flex-col items-center justify-center p-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                      <RefreshCw className="w-7 h-7 animate-spin mb-2 text-emerald-600" />
                      <span>{qrLoading ? "Generating fresh QR code..." : "Click Refresh to load QR Code"}</span>
                      <button
                        onClick={handleRefreshQR}
                        className="mt-3 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                      >
                        Generate QR Code
                      </button>
                    </div>
                  )}
                  {qrCode && (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleRefreshQR}
                        disabled={qrLoading}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${qrLoading ? "animate-spin" : ""}`} />
                        <span>Refresh QR</span>
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-slate-600">
                    Open WhatsApp &gt; <strong>Linked Devices</strong> &gt; <strong>Link a Device</strong> &gt; Scan this QR code.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
