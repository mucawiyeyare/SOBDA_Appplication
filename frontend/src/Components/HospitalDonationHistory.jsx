import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  History,
  Droplet,
  Calendar,
  User,
  Search,
  Download,
  AlertCircle,
  CheckCircle2,
  Phone,
  MapPin,
  Building2,
  FileSpreadsheet,
} from "lucide-react";

function HospitalDonationHistory() {
  const [donations, setDonations] = useState([]);
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [bloodTypeFilter, setBloodTypeFilter] = useState("");

  useEffect(() => {
    fetchDonations();
  }, []);

  useEffect(() => {
    let list = [...donations];
    if (bloodTypeFilter) {
      list = list.filter((d) => d.bloodType === bloodTypeFilter);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      list = list.filter(
        (d) =>
          d.donorId?.name?.toLowerCase().includes(term) ||
          d.donorId?.phone?.includes(term) ||
          d.donorId?.location?.toLowerCase().includes(term) ||
          (d.donorId?.nationalId && d.donorId.nationalId.toLowerCase().includes(term))
      );
    }
    setFilteredDonations(list);
  }, [donations, bloodTypeFilter, searchTerm]);

  const fetchDonations = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/api/requests/hospital-donations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(res.data);
      setFilteredDonations(res.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching hospital donations:", err);
      setError(err.response?.data?.message || "Failed to load donation records");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (filteredDonations.length === 0) return;

    const headers = ["Donation Date", "Donor Name", "Government ID", "Blood Type", "Phone", "Location", "Volume (ml)", "Notes"];
    const rows = filteredDonations.map((d) => [
      new Date(d.donationDate).toLocaleDateString(),
      `"${d.donorId?.name || "N/A"}"`,
      `"${d.donorId?.nationalId || "N/A"}"`,
      d.bloodType || "N/A",
      `"${d.donorId?.phone || "N/A"}"`,
      `"${d.donorId?.location || "N/A"}"`,
      d.volume || 450,
      `"${d.notes || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hospital_Donations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading donation history...</p>
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
            <span className="p-2 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/30">
              <History className="w-6 h-6" />
            </span>
            Hospital Donation History
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Complete records of donors who completed blood donations at your hospital
          </p>
        </div>

        {filteredDonations.length > 0 && (
          <button
            onClick={exportCSV}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search donor name, ID, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <select
          value={bloodTypeFilter}
          onChange={(e) => setBloodTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">All Blood Types</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>

        <div className="flex items-center justify-end text-xs text-slate-500 sm:col-span-2 md:col-span-1">
          Total Donated Records: <strong className="ml-1 text-slate-900">{filteredDonations.length}</strong>
        </div>
      </div>

      {/* Donations Table / Cards */}
      {filteredDonations.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-700">No Donation Records Found</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            When donors complete blood donations at your facility, records will appear here permanently.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Donor Name</th>
                  <th className="py-3.5 px-4">Government ID</th>
                  <th className="py-3.5 px-4">Blood Type</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Volume</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDonations.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-slate-800 whitespace-nowrap">
                      {new Date(item.donationDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {item.donorId?.name || "Anonymous Donor"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600">
                      {item.donorId?.nationalId || "N/A"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-lg bg-red-100 text-red-700 font-black text-xs">
                        {item.bloodType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.donorId?.phone || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {item.donorId?.location || "N/A"}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {item.volume || 450} ml
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Completed
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default HospitalDonationHistory;
