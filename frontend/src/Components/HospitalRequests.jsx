import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Clock,
  User,
  Droplet,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  MessageSquare,
  Building2,
  Phone,
  CheckCircle2,
  RotateCcw,
  MessageCircle,
  Users,
  Timer,
  Award,
} from "lucide-react";

function HospitalRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("");

  // Complete Donation Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingRequest, setCompletingRequest] = useState(null);
  const [volume, setVolume] = useState(450);
  const [donationNotes, setDonationNotes] = useState("");
  const [autoReleaseBatch, setAutoReleaseBatch] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Live timer tick every second
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found");
        setLoading(false);
        return;
      }

      const url = filterStatus
        ? `/api/requests/hospital?status=${filterStatus}`
        : "/api/requests/hospital";

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

  // Mark Arrived
  const markAsArrived = async (requestId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `/api/requests/${requestId}/arrived`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as arrived");
    }
  };

  // Open Complete Modal
  const openCompleteModal = (req) => {
    setCompletingRequest(req);
    setVolume(450);
    setDonationNotes("Donation completed successfully");
    setAutoReleaseBatch(true);
    setShowCompleteModal(true);
  };

  // Submit Completed Donation
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completingRequest) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `/api/requests/${completingRequest._id}/complete`,
        {
          volume: Number(volume),
          notes: donationNotes,
          releaseBatch: autoReleaseBatch,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(res.data.message || "Donation marked as completed successfully!");
      setShowCompleteModal(false);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to mark as completed");
    } finally {
      setSubmitting(false);
    }
  };

  // Cancel Request
  const cancelRequest = async (requestId) => {
    if (!window.confirm("Are you sure you want to cancel this request? The donor will immediately become available.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel request");
    }
  };

  // Cancel Entire Batch
  const cancelBatch = async (batchId) => {
    if (!window.confirm(`Cancel all pending requests in batch ${batchId}?`)) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`/api/requests/batch/${batchId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert(res.data.message);
      fetchRequests();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel batch");
    }
  };

  // Helper to format remaining time
  const formatCountdown = (pendingUntil) => {
    if (!pendingUntil) return null;
    const diff = Math.floor((new Date(pendingUntil).getTime() - now) / 1000);
    if (diff <= 0) {
      return <span className="text-red-600 font-bold">Expired (2h limit reached)</span>;
    }
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return (
      <span className="text-amber-700 font-mono font-bold">
        {hours > 0 ? `${hours}h ` : ""}{minutes}m {seconds < 10 ? `0${seconds}` : seconds}s remaining
      </span>
    );
  };

  const getStatusBadge = (status, pendingUntil) => {
    switch (status) {
      case "Pending":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1.5 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" style={{ animationDuration: "4s" }} />
            Pending Request
          </span>
        );
      case "Arrived":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1.5 shadow-sm">
            <Building2 className="w-3.5 h-3.5 text-sky-600" />
            Donor Arrived
          </span>
        );
      case "Accepted":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Donor En Route / Accepted
          </span>
        );
      case "Completed":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Donated / Fulfilled
          </span>
        );
      case "Declined":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-300 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Declined by Donor
          </span>
        );
      case "Expired":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5 text-slate-500" />
            Expired (2h Limit)
          </span>
        );
      case "Cancelled":
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-300">
            Cancelled
          </span>
        );
      default:
        return <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const getUrgencyBadge = (urgency) => {
    const colors = {
      Emergency: "bg-red-600 text-white shadow-sm",
      Urgent: "bg-amber-500 text-white shadow-sm",
      Routine: "bg-sky-600 text-white shadow-sm",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${colors[urgency] || colors.Routine}`}>
        {urgency}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-red-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading active requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-slate-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="p-2 rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
              <Clock className="w-6 h-6" />
            </span>
            Active Requests & Tracking
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Real-time tracking of pending donor requests with 2-hour arrival window
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          Refresh
        </button>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <label className="text-xs font-bold text-slate-700 uppercase">Filter Status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Requests</option>
            <option value="Pending">Pending (Active 2h Timer)</option>
            <option value="Arrived">Arrived at Clinic</option>
            <option value="Accepted">Accepted / En Route</option>
            <option value="Completed">Completed / Donated</option>
            <option value="Expired">Expired</option>
            <option value="Declined">Declined</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <p className="text-xs text-slate-500">
          Showing <strong>{requests.length}</strong> request{requests.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Requests Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            {filterStatus
              ? `No requests match status '${filterStatus}'.`
              : "You have not dispatched any blood requests yet. Go to 'Available Donors' to find and request donors."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const isPending = request.status === "Pending" || request.status === "Accepted";
            const isArrived = request.status === "Arrived";

            return (
              <div
                key={request._id}
                className={`bg-white rounded-2xl p-5 sm:p-6 shadow-sm hover:shadow-md transition-all border ${
                  isPending
                    ? "border-amber-200 bg-gradient-to-r from-white to-amber-50/20"
                    : isArrived
                    ? "border-sky-300 bg-gradient-to-r from-white to-sky-50/30"
                    : "border-slate-200"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 text-white flex items-center justify-center font-black text-base shadow-md flex-shrink-0">
                      {request.bloodType}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-slate-800">{request.donorId?.name || "Donor"}</h3>
                        {request.donorId?.nationalId && (
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                            ID: {request.donorId.nationalId}
                          </span>
                        )}
                        {request.batchId && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold border border-purple-200">
                            Batch: {request.batchId.substring(0, 14)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{request.donorId?.phone}</span>
                        <span>•</span>
                        <span>{request.donorId?.location}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 sm:self-start">
                    {getStatusBadge(request.status, request.pendingUntil)}
                    {getUrgencyBadge(request.urgency)}
                  </div>
                </div>

                {/* 2-Hour Timer Indicator (For Pending requests) */}
                {isPending && request.pendingUntil && (
                  <div className="bg-amber-50 rounded-xl p-3.5 mb-4 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="font-semibold text-amber-900">2-Hour Arrival Window:</span>
                      {formatCountdown(request.pendingUntil)}
                    </div>
                    <p className="text-[11px] text-amber-700">
                      Requested: {new Date(request.requestDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                )}

                {/* Arrived Indicator */}
                {isArrived && (
                  <div className="bg-sky-50 rounded-xl p-3.5 mb-4 border border-sky-200 flex items-center gap-2 text-xs text-sky-900 font-semibold">
                    <Building2 className="w-4 h-4 text-sky-600" />
                    <span>Donor arrived at clinic at {new Date(request.arrivedAt || Date.now()).toLocaleTimeString()}! Ready for blood collection.</span>
                  </div>
                )}

                {/* Patient Information Section */}
                {request.patientInfo && request.patientInfo.name && (
                  <div className="bg-rose-50/70 rounded-xl p-3.5 mb-4 text-xs border border-rose-200">
                    <div className="flex items-center gap-1.5 font-bold text-rose-800 mb-1.5">
                      <Users className="w-4 h-4 text-rose-600" />
                      <span>Patient: {request.patientInfo.name}</span>
                      {request.patientInfo.age && (
                        <span className="text-[11px] font-normal text-rose-600">({request.patientInfo.age} yrs)</span>
                      )}
                      {request.patientInfo.phone && (
                        <span className="text-[11px] font-normal text-slate-500">• Tel: {request.patientInfo.phone}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-700 pl-5">
                      {request.patientInfo.diagnosis && (
                        <p><strong className="text-slate-900">Diagnosis/Injury:</strong> {request.patientInfo.diagnosis}</p>
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

                {/* Message notes */}
                {request.message && (
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 text-xs text-slate-700 border border-slate-100 flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-slate-800">Hospital Note: </strong>
                      <span>{request.message}</span>
                    </div>
                  </div>
                )}

                {/* Donor Response Message */}
                {request.availabilityTime && (
                  <div className="bg-emerald-50 rounded-xl p-3 mb-4 text-xs text-emerald-800 border border-emerald-200">
                    <strong>✓ Donor Availability: </strong> {request.availabilityTime}
                  </div>
                )}

                {request.declineReason && (
                  <div className="bg-red-50 rounded-xl p-3 mb-4 text-xs text-red-800 border border-red-200">
                    <strong>Decline Reason: </strong> {request.declineReason}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100">
                  {/* Mark Arrived */}
                  {isPending && (
                    <button
                      onClick={() => markAsArrived(request._id)}
                      className="py-2 px-4 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Mark Arrived
                    </button>
                  )}

                  {/* Mark Completed (Donated) */}
                  {(isArrived || isPending) && (
                    <button
                      onClick={() => openCompleteModal(request)}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Mark Donated
                    </button>
                  )}

                  {/* WhatsApp Donor */}
                  {request.whatsapp?.whatsappUrl && (
                    <a
                      href={request.whatsapp.whatsappUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp Donor
                    </a>
                  )}

                  {/* Cancel Request */}
                  {(isPending || isArrived) && (
                    <button
                      onClick={() => cancelRequest(request._id)}
                      className="py-2 px-3.5 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ml-auto"
                    >
                      <XCircle className="w-3.5 h-3.5 text-red-500" />
                      Cancel Request
                    </button>
                  )}

                  {/* Release Sibling Batch */}
                  {isPending && request.batchId && (
                    <button
                      onClick={() => cancelBatch(request.batchId)}
                      className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-xs flex items-center gap-1 transition-colors"
                      title="Cancel all remaining pending requests in this batch"
                    >
                      <Users className="w-3.5 h-3.5" />
                      Release Batch
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Complete Donation Modal */}
      {showCompleteModal && completingRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-800">Record Completed Donation</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm blood collection from <strong>{completingRequest.donorId?.name}</strong>
                </p>
              </div>
              <button onClick={() => setShowCompleteModal(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="bg-emerald-50 rounded-xl p-3.5 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                  {completingRequest.bloodType}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{completingRequest.donorId?.name}</p>
                  <p className="text-[11px] text-slate-600">Donor will automatically enter medical cooldown</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Collected Volume (ml) *
                </label>
                <input
                  type="number"
                  value={volume}
                  onChange={(e) => setVolume(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Collection Notes / Lab Bag ID
                </label>
                <textarea
                  value={donationNotes}
                  onChange={(e) => setDonationNotes(e.target.value)}
                  rows="2"
                  placeholder="e.g. Bag #SOM-8891, screened and verified..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              {completingRequest.batchId && (
                <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-200">
                  <input
                    type="checkbox"
                    id="autoRelease"
                    checked={autoReleaseBatch}
                    onChange={(e) => setAutoReleaseBatch(e.target.checked)}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <label htmlFor="autoRelease" className="text-xs text-purple-900 font-semibold cursor-pointer">
                    Auto-release and cancel remaining pending requests in this batch
                  </label>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Award className="w-3.5 h-3.5" />
                  {submitting ? "Recording..." : "Confirm & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalRequests;
