import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Clock,
  Building2,
  Droplet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Info,
  Phone,
  CheckCircle2,
  HeartHandshake,
  MessageCircle,
  Sparkles,
  ShieldCheck,
  Heart,
  User,
  Users,
  Trophy,
} from "lucide-react";

function DonorRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");
  const [donorStats, setDonorStats] = useState(null);
  const [donorStatus, setDonorStatus] = useState(null);

  // Response Modal
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [responseType, setResponseType] = useState("accept");
  const [availabilityTime, setAvailabilityTime] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Live timer tick
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchRequests();
    fetchDonorStatus();
    fetchDonorStats();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const fetchDonorStats = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      const res = await axios.get("/api/requests/my-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonorStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const url = filterStatus
        ? `/api/requests/donor?status=${filterStatus}`
        : "/api/requests/donor";

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setRequests(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError(err.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const fetchDonorStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = JSON.parse(atob(token.split(".")[1]));
      const donorId = payload.id;

      const res = await axios.get(`/api/requests/status/${donorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setDonorStatus(res.data);
    } catch (err) {
      console.error("Error checking donor status:", err);
    }
  };

  // Deep-link support: a tap on "Accept"/"Decline" from an OS push
  // notification (app closed/backgrounded) lands here with these params,
  // so we open straight to the response modal instead of a plain list view.
  useEffect(() => {
    if (loading || requests.length === 0) return;

    const quickAction = searchParams.get("quickAction");
    const requestId = searchParams.get("requestId");
    if (!quickAction || !requestId) return;

    const target = requests.find((r) => r._id === requestId);
    if (target && target.status === "Pending") {
      openModal(target, quickAction === "decline" ? "decline" : "accept");
    }

    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, requests]);

  const openModal = (request, type) => {
    setSelectedRequest(request);
    setResponseType(type);
    setAvailabilityTime("Leaving now (approx 20-30 mins)");
    setDeclineReason("");
    setShowResponseModal(true);
  };

  const handleResponseSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/requests/${selectedRequest._id}/respond`,
        {
          response: responseType,
          availabilityTime,
          declineReason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowResponseModal(false);
      fetchRequests();
      fetchDonorStatus();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
    }
  };

  const formatCountdown = (pendingUntil) => {
    if (!pendingUntil) return null;
    const diff = Math.floor((new Date(pendingUntil).getTime() - now) / 1000);
    if (diff <= 0) return <span className="text-red-600 font-bold">Expired</span>;
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return (
      <span className="font-mono font-bold text-amber-800">
        {hours > 0 ? `${hours}h ` : ""}{minutes}m {seconds < 10 ? `0${seconds}` : seconds}s
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading requests & donor status...</p>
        </div>
      </div>
    );
  }

  // Determine current active step for the workflow stepper (1: Available, 2: Pending, 3: Arrived, 4: Donated)
  const currentStep =
    donorStatus?.status === "Donated"
      ? 4
      : donorStatus?.status === "Arrived"
      ? 3
      : donorStatus?.status === "Pending"
      ? 2
      : 1;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
          <span className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
            <HeartHandshake className="w-6 h-6" />
          </span>
          My Status & Requests
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Track your real-time blood donation workflow and respond to hospital emergencies
        </p>
      </div>

      {/* Donor Impact Stats Banner */}
      <div className="mb-6 p-6 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white shadow-xl shadow-red-600/20 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 text-white">
            <Heart className="w-8 h-8 fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-red-200 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Life-Saver Dashboard</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black">
              {donorStats?.livesHelped === 1
                ? "1 Person Saved! 🩸"
                : `${donorStats?.livesHelped || 0} Patients Helped! 🩸`}
            </h2>
            <p className="text-red-100 text-xs sm:text-sm mt-1 max-w-xl">
              {donorStats?.livesHelped === 1
                ? "You answered the call and saved 1 person with your donation. Somalia thanks you! 💪"
                : donorStats && donorStats.livesHelped > 1
                ? `You have answered the call and saved ${donorStats.livesHelped} people. Somalia thanks you! 💪`
                : "When hospitals urgently need blood, you'll receive requests right here. Ready to save lives!"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center min-w-[100px]">
            <span className="text-2xl font-black text-white">{donorStats?.totalCompleted || 0}</span>
            <p className="text-[10px] font-bold text-red-200 uppercase">Donations</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-center min-w-[100px]">
            <span className="text-2xl font-black text-amber-300">{donorStats?.totalPending || 0}</span>
            <p className="text-[10px] font-bold text-red-200 uppercase">Pending</p>
          </div>
        </div>
      </div>

      {/* 1. Real-Time Status Workflow Stepper Banner */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-sky-500 to-emerald-500"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Donor Status</span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                {donorStatus?.status === "Available" && <span className="text-emerald-600">✓ Ready to Donate (Available)</span>}
                {donorStatus?.status === "Pending" && <span className="text-amber-600">⏳ Requested by Hospital (Pending)</span>}
                {donorStatus?.status === "Arrived" && <span className="text-sky-600">🏥 Arrived at Hospital</span>}
                {donorStatus?.status === "Donated" && <span className="text-red-600">🩸 Donated & in Cooldown</span>}
                {donorStatus?.status === "Unavailable" && <span className="text-slate-500">Temporarily Unavailable</span>}
              </h2>
            </div>
          </div>

          {/* If Pending, show countdown box */}
          {donorStatus?.status === "Pending" && donorStatus.activeRequest?.pendingUntil && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-600 animate-spin" style={{ animationDuration: "5s" }} />
              <div>
                <p className="text-[11px] font-bold text-amber-900 uppercase">2-Hour Arrival Window</p>
                <p className="text-sm">{formatCountdown(donorStatus.activeRequest.pendingUntil)}</p>
              </div>
            </div>
          )}

          {/* If Donated/Cooldown */}
          {donorStatus?.status === "Donated" && donorStatus.cooldownEndsAt && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-[11px] font-bold text-red-900 uppercase">Next Eligible Date</p>
                <p className="text-sm font-bold text-red-700">
                  {new Date(donorStatus.cooldownEndsAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stepper Graphic */}
        <div className="grid grid-cols-4 gap-2 sm:gap-4 relative pt-4 border-t border-slate-100">
          {/* Step 1: Available */}
          <div className={`text-center ${currentStep >= 1 ? "text-emerald-700" : "text-slate-400"}`}>
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 shadow-sm transition-all ${
                currentStep >= 1
                  ? "bg-emerald-600 text-white shadow-emerald-600/30"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              1
            </div>
            <p className="text-xs font-bold">Available</p>
            <p className="text-[10px] text-slate-500 hidden sm:block">Eligible to donate</p>
          </div>

          {/* Step 2: Pending */}
          <div className={`text-center ${currentStep >= 2 ? "text-amber-700" : "text-slate-400"}`}>
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 shadow-sm transition-all ${
                currentStep >= 2
                  ? "bg-amber-500 text-white shadow-amber-500/30 ring-4 ring-amber-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              2
            </div>
            <p className="text-xs font-bold">Pending (2h)</p>
            <p className="text-[10px] text-slate-500 hidden sm:block">Request active</p>
          </div>

          {/* Step 3: Arrived */}
          <div className={`text-center ${currentStep >= 3 ? "text-sky-700" : "text-slate-400"}`}>
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 shadow-sm transition-all ${
                currentStep >= 3
                  ? "bg-sky-600 text-white shadow-sky-600/30 ring-4 ring-sky-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              3
            </div>
            <p className="text-xs font-bold">Arrived</p>
            <p className="text-[10px] text-slate-500 hidden sm:block">At hospital clinic</p>
          </div>

          {/* Step 4: Donated */}
          <div className={`text-center ${currentStep >= 4 ? "text-red-700" : "text-slate-400"}`}>
            <div
              className={`w-9 h-9 sm:w-11 sm:h-11 rounded-full mx-auto flex items-center justify-center font-bold text-sm mb-2 shadow-sm transition-all ${
                currentStep >= 4
                  ? "bg-red-600 text-white shadow-red-600/30 ring-4 ring-red-100"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              4
            </div>
            <p className="text-xs font-bold">Donated</p>
            <p className="text-[10px] text-slate-500 hidden sm:block">Cooldown recorded</p>
          </div>
        </div>
      </div>

      {/* 2. Incoming Requests List */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Droplet className="w-5 h-5 text-red-600" />
          <span>Hospital Requests ({requests.length})</span>
        </h2>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
        >
          <option value="">All Requests</option>
          <option value="Pending">Pending</option>
          <option value="Accepted">Accepted</option>
          <option value="Arrived">Arrived</option>
          <option value="Completed">Completed</option>
          <option value="Expired">Expired</option>
          <option value="Declined">Declined</option>
        </select>
      </div>

      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Requests at this time</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Hospitals will send emergency or routine blood requests directly to your account when matching your blood type.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isPending = request.status === "Pending";
            const isAccepted = request.status === "Accepted";
            const isArrived = request.status === "Arrived";

            return (
              <div
                key={request._id}
                className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all border ${
                  isPending
                    ? "border-amber-300 bg-gradient-to-r from-white to-amber-50/20"
                    : isArrived
                    ? "border-sky-300"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">{request.hospitalId?.name || "Hospital Clinic"}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>{request.hospitalId?.location || "Mogadishu"}</span>
                        <span>•</span>
                        <span>{request.hospitalId?.phone || "No phone"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-200">
                      Need: {request.bloodType}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        request.urgency === "Emergency"
                          ? "bg-red-600 text-white"
                          : request.urgency === "Urgent"
                          ? "bg-amber-500 text-white"
                          : "bg-sky-600 text-white"
                      }`}
                    >
                      {request.urgency}
                    </span>
                  </div>
                </div>

                {/* 2-Hour Timer Indicator */}
                {isPending && request.pendingUntil && (
                  <div className="bg-amber-50 rounded-xl p-3.5 mb-4 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600 animate-spin" style={{ animationDuration: "5s" }} />
                      <span>Arrival Timer: {formatCountdown(request.pendingUntil)}</span>
                    </div>
                    <span className="text-[11px] text-amber-700">Please respond promptly</span>
                  </div>
                )}

                {/* Patient Information Section */}
                {request.patientInfo && request.patientInfo.name && (
                  <div className="bg-rose-50/70 rounded-xl p-3.5 mb-4 text-xs border border-rose-200">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1.5">
                      <Users className="w-4 h-4 text-rose-600" />
                      <span>Patient Details: {request.patientInfo.name}</span>
                      {request.patientInfo.age && (
                        <span className="text-[11px] font-normal text-rose-600">({request.patientInfo.age} yrs)</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700 pl-5">
                      {request.patientInfo.diagnosis && (
                        <p><strong className="text-slate-900">Condition/Injury:</strong> {request.patientInfo.diagnosis}</p>
                      )}
                      {request.patientInfo.causeOfInjury && (
                        <p><strong className="text-slate-900">Cause:</strong> {request.patientInfo.causeOfInjury}</p>
                      )}
                      {request.patientInfo.notes && (
                        <p className="col-span-full"><strong className="text-slate-900">Notes:</strong> {request.patientInfo.notes}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Hospital Message Note */}
                {request.message && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-700 border border-slate-100">
                    <strong className="text-slate-800">Hospital Message: </strong>
                    <span>{request.message}</span>
                  </div>
                )}

                {/* Status response info */}
                {isAccepted && request.availabilityTime && (
                  <div className="bg-emerald-50 rounded-xl p-3 mb-4 text-xs text-emerald-800 border border-emerald-200">
                    <strong>✓ You accepted this request:</strong> {request.availabilityTime}
                  </div>
                )}

                {request.status === "Completed" && (
                  <div className="bg-green-50 rounded-xl p-3 mb-4 text-xs text-green-800 border border-green-200 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Donation completed on {new Date(request.completionDate).toLocaleDateString()}. Thank you for saving lives!</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                  {isPending && (
                    <>
                      <button
                        onClick={() => openModal(request, "accept")}
                        className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-md transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept & Notify
                      </button>

                      <button
                        onClick={() => openModal(request, "decline")}
                        className="py-2.5 px-4 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <XCircle className="w-4 h-4 text-red-500" />
                        Decline
                      </button>
                    </>
                  )}

                  {/* Hospital WhatsApp link */}
                  {request.hospitalWhatsApp?.whatsappUrl && (
                    <a
                      href={request.hospitalWhatsApp.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      WhatsApp Hospital
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">
                  {responseType === "accept" ? "Accept Donation Request" : "Decline Request"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">From {selectedRequest.hospitalId?.name}</p>
              </div>
              <button onClick={() => setShowResponseModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleResponseSubmit} className="space-y-4">
              {responseType === "accept" ? (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    When can you arrive at the hospital? *
                  </label>
                  <input
                    type="text"
                    value={availabilityTime}
                    onChange={(e) => setAvailabilityTime(e.target.value)}
                    placeholder="e.g. In 20 minutes, Leaving right now..."
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    The hospital staff will prepare the donation bed for your arrival.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Reason for declining (Optional)
                  </label>
                  <textarea
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    rows="3"
                    placeholder="e.g. Currently traveling outside the city..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResponseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md ${
                    responseType === "accept"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {responseType === "accept" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {submitting ? "Sending..." : responseType === "accept" ? "Confirm & Accept" : "Confirm Decline"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DonorRequests;
