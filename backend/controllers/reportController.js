import User from "../models/usermodel.js";
import DonorRequest from "../models/donorRequestModel.js";
import Donation from "../models/donationModel.js";

// Donor status is not stored on the user: it is derived (90-day cooldown, open request, manual availability),
// the same way the donors list derives it. Reports must use this, or every donor looks status-less.
const withDonorStatus = async (donors) => {
  const now = new Date();
  const ids = donors.map((d) => d._id);
  const open = await DonorRequest.find({ donorId: { $in: ids }, status: { $in: ["Pending", "Arrived", "Accepted"] } })
    .select("donorId status")
    .lean();
  const openByDonor = new Map();
  open.forEach((r) => {
    const key = String(r.donorId);
    if (!openByDonor.has(key) || r.status === "Arrived") openByDonor.set(key, r.status);
  });
  return donors.map((d) => {
    let status = "Available";
    if (d.lastDonationDate) {
      const end = new Date(d.lastDonationDate);
      end.setDate(end.getDate() + 90);
      if (end > now) status = "Donated";
    }
    if (status === "Available" && openByDonor.has(String(d._id))) {
      status = openByDonor.get(String(d._id)) === "Arrived" ? "Arrived" : "Pending";
    }
    if (status === "Available" && d.isAvailable === false) status = "Unavailable";
    return { ...d, status };
  });
};

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

/**
 * 1. Main Report Overview Dashboard
 * Returns complete aggregated system statistics (Donors, Hospitals, Requests, Donations).
 * STRICTLY ZERO INVENTORY / ZERO WAREHOUSE CONCEPT.
 */
export const getReportOverview = async (req, res) => {
  try {
    const [
      allDonors,
      allHospitals,
      allRequests,
      allDonations
    ] = await Promise.all([
      User.find({ role: "donor" }).select("-password").lean().then(withDonorStatus),
      User.find({ role: "hospital" }).select("-password").lean(),
      DonorRequest.find().populate("hospitalId", "name location phone").populate("donorId", "name bloodType phone location").lean(),
      Donation.find().populate("donorId", "name bloodType location").populate("hospitalId", "name location").lean(),
    ]);

    const totalDonors = allDonors.length;
    const availableDonors = allDonors.filter(d => d.status === "Available").length;
    const cooldownDonors = allDonors.filter(d => d.status === "Donated").length;
    const activeDonors = availableDonors + cooldownDonors;
    const totalHospitals = allHospitals.length;

    const totalRequests = allRequests.length;
    const pendingRequests = allRequests.filter(r => r.status === "Pending").length;
    const arrivedRequests = allRequests.filter(r => r.status === "Arrived" || r.status === "Accepted").length;
    const completedRequests = allRequests.filter(r => r.status === "Completed").length;
    const cancelledRequests = allRequests.filter(r => r.status === "Cancelled" || r.status === "Expired" || r.status === "Declined").length;

    const totalDonations = allDonations.length > 0 ? allDonations.length : completedRequests;

    // Blood group matrix breakdown
    const bloodGroupMatrix = BLOOD_GROUPS.map(bt => {
      const donorsOfGroup = allDonors.filter(d => d.bloodType === bt);
      const activeOfGroup = donorsOfGroup.filter(d => d.status === "Available" || d.status === "Donated");
      const availableOfGroup = donorsOfGroup.filter(d => d.status === "Available");
      const requestsOfGroup = allRequests.filter(r => r.bloodType === bt);
      const donationsOfGroup = allDonations.filter(dn => dn.bloodType === bt || dn.donorId?.bloodType === bt);
      
      // Unique hospitals that requested this blood group
      const uniqueHospitals = new Set(
        requestsOfGroup.map(r => (r.hospitalId?._id || r.hospitalId)?.toString()).filter(Boolean)
      );

      return {
        bloodType: bt,
        totalDonors: donorsOfGroup.length,
        activeDonors: activeOfGroup.length,
        availableDonors: availableOfGroup.length,
        totalDonations: donationsOfGroup.length || requestsOfGroup.filter(r => r.status === "Completed").length,
        requestingHospitalsCount: uniqueHospitals.size,
        totalRequests: requestsOfGroup.length,
      };
    });

    // Urgency breakdown
    const urgencyCounts = {
      Emergency: allRequests.filter(r => r.urgency === "Emergency").length,
      Urgent: allRequests.filter(r => r.urgency === "Urgent").length,
      Routine: allRequests.filter(r => r.urgency === "Routine" || !r.urgency).length,
    };

    // Monthly donation history (past 6 months)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const now = new Date();
    const monthlyDonations = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mYear = d.getFullYear();
      const mIdx = d.getMonth();
      const mLabel = `${monthNames[mIdx]} ${mYear}`;
      
      const count = allDonations.filter(dn => {
        const dDate = new Date(dn.donationDate || dn.createdAt);
        return dDate.getFullYear() === mYear && dDate.getMonth() === mIdx;
      }).length || allRequests.filter(r => {
        if (r.status !== "Completed") return false;
        const rDate = new Date(r.requestDate || r.createdAt);
        return rDate.getFullYear() === mYear && rDate.getMonth() === mIdx;
      }).length;

      monthlyDonations.push({
        month: mLabel,
        donations: count,
      });
    }

    // Recent activity feed
    const recentActivities = [];
    
    // Recent registrations
    allDonors.slice(-5).reverse().forEach(d => {
      recentActivities.push({
        type: "donor_registered",
        title: `New voluntary donor registered: ${d.name} (${d.bloodType})`,
        party: d.name,
        bloodType: d.bloodType,
        location: d.location,
        timestamp: d.createdAt || new Date(),
        status: "Registered",
      });
    });

    // Recent requests
    allRequests.slice(-8).reverse().forEach(r => {
      const hName = r.hospitalId?.name || "Hospital";
      recentActivities.push({
        type: "hospital_request",
        title: `${hName} requested ${r.bloodType} blood for ${r.patientInfo?.name || "Emergency Patient"}`,
        party: hName,
        bloodType: r.bloodType,
        urgency: r.urgency,
        status: r.status,
        timestamp: r.requestDate || r.createdAt || new Date(),
      });
    });

    // Patients saved: one entry per patient whose request was completed (several donors for one patient count once)
    const savedMap = new Map();
    allRequests
      .filter((r) => r.status === "Completed")
      .forEach((r) => {
        const name = (r.patientInfo?.name || "").trim();
        const hospital = r.hospitalId?.name || "Hospital";
        const key = name ? `${name.toLowerCase()}|${hospital}` : `anon|${r._id}`;
        const when = r.completedAt || r.updatedAt || r.requestDate || r.createdAt;
        const entry = savedMap.get(key) || {
          name: name || "Unnamed patient",
          age: r.patientInfo?.age || "",
          diagnosis: r.patientInfo?.diagnosis || "",
          hospital,
          bloodType: r.bloodType,
          donors: 0,
          date: when,
        };
        entry.donors += 1;
        if (when && (!entry.date || new Date(when) > new Date(entry.date))) entry.date = when;
        savedMap.set(key, entry);
      });
    const patientsSaved = Array.from(savedMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));

    recentActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      summary: {
        totalDonors,
        activeDonors,
        availableDonors,
        cooldownDonors,
        totalHospitals,
        totalRequests,
        pendingRequests,
        arrivedRequests,
        completedRequests,
        cancelledRequests,
        totalDonations,
        patientsSaved: patientsSaved.length,
      },
      patientsSaved,
      bloodGroupMatrix,
      urgencyCounts,
      monthlyDonations,
      recentActivities: recentActivities.slice(0, 10),
    });
  } catch (error) {
    console.error("Error in getReportOverview:", error);
    res.status(500).json({ message: "Failed to generate report overview", error: error.message });
  }
};

/**
 * 2. All Blood Groups Summary Cards
 */
export const getBloodGroupReports = async (req, res) => {
  try {
    const [donors, requests, donations] = await Promise.all([
      User.find({ role: "donor" }).select("-password").lean().then(withDonorStatus),
      DonorRequest.find().populate("hospitalId", "name").lean(),
      Donation.find().populate("donorId", "name bloodType").lean(),
    ]);

    const reports = BLOOD_GROUPS.map(bt => {
      const groupDonors = donors.filter(d => d.bloodType === bt);
      const activeDonors = groupDonors.filter(d => d.status === "Available" || d.status === "Donated");
      const availableDonors = groupDonors.filter(d => d.status === "Available");
      const groupRequests = requests.filter(r => r.bloodType === bt);
      const groupDonations = donations.filter(dn => dn.bloodType === bt || dn.donorId?.bloodType === bt);

      const uniqueHospitals = new Set(
        groupRequests.map(r => (r.hospitalId?._id || r.hospitalId)?.toString()).filter(Boolean)
      );

      return {
        bloodType: bt,
        totalDonors: groupDonors.length,
        activeDonors: activeDonors.length,
        availableDonors: availableDonors.length,
        totalDonations: groupDonations.length || groupRequests.filter(r => r.status === "Completed").length,
        requestingHospitalsCount: uniqueHospitals.size,
        totalRequests: groupRequests.length,
        pendingRequests: groupRequests.filter(r => r.status === "Pending").length,
        completedRequests: groupRequests.filter(r => r.status === "Completed").length,
        recentDonors: groupDonors.slice(0, 3).map(d => ({
          _id: d._id,
          name: d.name,
          location: d.location,
          status: d.status,
          phone: d.phone,
        })),
      };
    });

    res.json(reports);
  } catch (error) {
    console.error("Error in getBloodGroupReports:", error);
    res.status(500).json({ message: "Failed to generate blood group reports", error: error.message });
  }
};

/**
 * 3. Specific Blood Group Detail Report (Donors, Requests, Donations)
 */
export const getBloodGroupDetails = async (req, res) => {
  try {
    const { bloodType } = req.params;
    const { status, location, search } = req.query;

    let donorQuery = { role: "donor", bloodType };
    if (location && location !== "All") {
      donorQuery.location = { $regex: location, $options: "i" };
    }
    if (search) {
      donorQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { nationalId: { $regex: search, $options: "i" } },
      ];
    }

    const [derivedDonors, requests, donations] = await Promise.all([
      User.find(donorQuery).select("-password").sort({ createdAt: -1 }).lean().then(withDonorStatus),
      DonorRequest.find({ bloodType }).populate("hospitalId", "name location phone").populate("donorId", "name phone").sort({ requestDate: -1 }).lean(),
      Donation.find({ $or: [{ bloodType }, { "donorId.bloodType": bloodType }] }).populate("donorId", "name bloodType location").populate("hospitalId", "name location").sort({ donationDate: -1 }).lean(),
    ]);

    const donors = status && status !== "All" ? derivedDonors.filter((d) => d.status === status) : derivedDonors;
    const allGroupDonors = await withDonorStatus(await User.find({ role: "donor", bloodType }).select("-password").lean());
    const availableCount = allGroupDonors.filter(d => d.status === "Available").length;
    const activeCount = allGroupDonors.filter(d => d.status === "Available" || d.status === "Donated").length;

    const uniqueHospitals = Array.from(new Set(requests.map(r => r.hospitalId?.name).filter(Boolean)));

    res.json({
      bloodType,
      summary: {
        totalDonors: allGroupDonors.length,
        activeDonors: activeCount,
        availableDonors: availableCount,
        totalDonations: donations.length || requests.filter(r => r.status === "Completed").length,
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === "Pending").length,
        completedRequests: requests.filter(r => r.status === "Completed").length,
        requestingHospitalsCount: uniqueHospitals.length,
      },
      donors,
      requests,
      donations,
      hospitals: uniqueHospitals,
    });
  } catch (error) {
    console.error("Error in getBloodGroupDetails:", error);
    res.status(500).json({ message: "Failed to get blood group details", error: error.message });
  }
};

/**
 * 4. Hospital-Specific Reports Summary
 */
export const getHospitalReports = async (req, res) => {
  try {
    const [hospitals, requests, donations] = await Promise.all([
      User.find({ role: "hospital" }).select("-password").lean(),
      DonorRequest.find().populate("donorId", "name bloodType phone location").lean(),
      Donation.find().populate("donorId", "name bloodType").populate("hospitalId", "name").lean(),
    ]);

    const hospitalStats = hospitals.map(h => {
      const hRequests = requests.filter(r => (r.hospitalId?._id || r.hospitalId)?.toString() === h._id.toString());
      const pendingReqs = hRequests.filter(r => r.status === "Pending").length;
      const arrivedReqs = hRequests.filter(r => r.status === "Arrived" || r.status === "Accepted").length;
      const completedReqs = hRequests.filter(r => r.status === "Completed").length;
      const cancelledReqs = hRequests.filter(r => r.status === "Cancelled" || r.status === "Expired" || r.status === "Declined").length;

      // Blood groups requested
      const requestedBloodTypes = Array.from(new Set(hRequests.map(r => r.bloodType).filter(Boolean)));

      // Matched donors
      const matchedDonors = hRequests.map(r => r.donorId).filter(Boolean);
      const uniqueMatchedDonors = Array.from(new Set(matchedDonors.map(d => d._id?.toString()))).length;

      return {
        hospitalId: h._id,
        name: h.name,
        email: h.email,
        phone: h.phone,
        location: h.location,
        totalRequests: hRequests.length,
        pendingRequests: pendingReqs,
        arrivedRequests: arrivedReqs,
        completedRequests: completedReqs,
        cancelledRequests: cancelledReqs,
        requestedBloodTypes,
        matchedDonorsCount: uniqueMatchedDonors,
        successfulDonationsCount: completedReqs,
      };
    });

    res.json(hospitalStats);
  } catch (error) {
    console.error("Error in getHospitalReports:", error);
    res.status(500).json({ message: "Failed to get hospital reports", error: error.message });
  }
};

/**
 * 5. Single Hospital Detail Report
 */
export const getHospitalDetailReport = async (req, res) => {
  try {
    const { hospitalId } = req.params;
    const hospital = await User.findById(hospitalId).select("-password").lean();
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const requests = await DonorRequest.find({ hospitalId })
      .populate("donorId", "name bloodType phone location status")
      .sort({ requestDate: -1 })
      .lean();

    const bloodGroupCounts = {};
    BLOOD_GROUPS.forEach(bt => {
      bloodGroupCounts[bt] = requests.filter(r => r.bloodType === bt).length;
    });

    res.json({
      hospital,
      summary: {
        totalRequests: requests.length,
        pendingRequests: requests.filter(r => r.status === "Pending").length,
        arrivedRequests: requests.filter(r => r.status === "Arrived" || r.status === "Accepted").length,
        completedRequests: requests.filter(r => r.status === "Completed").length,
        cancelledRequests: requests.filter(r => r.status === "Cancelled" || r.status === "Expired").length,
      },
      bloodGroupCounts,
      requests,
    });
  } catch (error) {
    console.error("Error in getHospitalDetailReport:", error);
    res.status(500).json({ message: "Failed to get hospital detail report", error: error.message });
  }
};

/**
 * 6. Donors Matched to Hospitals Report
 */
export const getDonorMatchingReport = async (req, res) => {
  try {
    const requests = await DonorRequest.find()
      .populate("hospitalId", "name location phone email")
      .populate("donorId", "name bloodType phone location nationalId status")
      .sort({ requestDate: -1 })
      .lean();

    const matches = requests.map(r => ({
      matchId: r._id,
      donorName: r.donorId?.name || "Unknown Donor",
      donorId: r.donorId?._id,
      donorBloodType: r.bloodType || r.donorId?.bloodType,
      donorPhone: r.donorId?.phone,
      donorLocation: r.donorId?.location,
      hospitalName: r.hospitalId?.name || "Hospital",
      hospitalLocation: r.hospitalId?.location,
      requestId: r._id,
      patientName: r.patientInfo?.name || "Emergency Patient",
      urgency: r.urgency || "Urgent",
      matchDate: r.requestDate || r.createdAt,
      matchStatus: r.status,
      arrivedAt: r.arrivedAt,
      isDonated: r.status === "Completed",
    }));

    res.json(matches);
  } catch (error) {
    console.error("Error in getDonorMatchingReport:", error);
    res.status(500).json({ message: "Failed to get donor matching report", error: error.message });
  }
};

/**
 * 7. Donation History Report
 */
export const getDonationHistoryReport = async (req, res) => {
  try {
    const { bloodType, dateRange, startDate, endDate, hospitalId, search } = req.query;

    let dateFilter = {};
    const now = new Date();

    if (dateRange === "today") {
      const start = new Date(now.setHours(0, 0, 0, 0));
      const end = new Date(now.setHours(23, 59, 59, 999));
      dateFilter = { requestDate: { $gte: start, $lte: end } };
    } else if (dateRange === "this_week") {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0, 0, 0, 0);
      dateFilter = { requestDate: { $gte: firstDay } };
    } else if (dateRange === "this_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { requestDate: { $gte: firstDay } };
    } else if (dateRange === "last_month") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      dateFilter = { requestDate: { $gte: firstDay, $lte: lastDay } };
    } else if (dateRange === "this_year") {
      const firstDay = new Date(now.getFullYear(), 0, 1);
      dateFilter = { requestDate: { $gte: firstDay } };
    } else if (startDate && endDate) {
      dateFilter = { requestDate: { $gte: new Date(startDate), $lte: new Date(endDate) } };
    }

    let query = {
      status: "Completed",
      ...dateFilter,
    };

    if (bloodType && bloodType !== "All") {
      query.bloodType = bloodType;
    }
    if (hospitalId) {
      query.hospitalId = hospitalId;
    }

    const completedRequests = await DonorRequest.find(query)
      .populate("hospitalId", "name location phone")
      .populate("donorId", "name bloodType phone location nationalId")
      .sort({ requestDate: -1 })
      .lean();

    let filtered = completedRequests;
    if (search) {
      const s = search.toLowerCase();
      filtered = completedRequests.filter(r =>
        r.donorId?.name?.toLowerCase().includes(s) ||
        r.hospitalId?.name?.toLowerCase().includes(s) ||
        r.patientInfo?.name?.toLowerCase().includes(s)
      );
    }

    res.json({
      totalCompleted: filtered.length,
      donations: filtered.map(r => ({
        donationId: r._id,
        donorId: r.donorId?._id,
        donorName: r.donorId?.name || "Anonymous Donor",
        bloodGroup: r.bloodType,
        hospital: r.hospitalId?.name || "Hospital",
        hospitalLocation: r.hospitalId?.location,
        donationDate: r.requestDate || r.createdAt,
        patientName: r.patientInfo?.name || "N/A",
        status: "Completed",
      })),
    });
  } catch (error) {
    console.error("Error in getDonationHistoryReport:", error);
    res.status(500).json({ message: "Failed to get donation history report", error: error.message });
  }
};

/**
 * 8. Individual Donor Detail Report
 */
export const getIndividualDonorReport = async (req, res) => {
  try {
    const { donorId } = req.params;
    const donor = await User.findById(donorId).select("-password").lean();
    if (!donor) {
      return res.status(404).json({ message: "Donor not found" });
    }

    const [requests, donations] = await Promise.all([
      DonorRequest.find({ donorId }).populate("hospitalId", "name location phone").sort({ requestDate: -1 }).lean(),
      Donation.find({ donorId }).populate("hospitalId", "name location").sort({ donationDate: -1 }).lean(),
    ]);

    const completed = requests.filter(r => r.status === "Completed");
    const uniqueHospitals = Array.from(new Set(
      requests.map(r => r.hospitalId?.name).filter(Boolean)
    ));

    res.json({
      donor,
      summary: {
        totalDonations: completed.length || donations.length || donor.donationsCount || 0,
        lastDonationDate: donor.lastDonationDate || (completed[0]?.requestDate || null),
        totalRequestsReceived: requests.length,
        hospitalsConnectedCount: uniqueHospitals.length,
        hospitalsConnected: uniqueHospitals,
      },
      donationHistory: completed.map(r => ({
        donationId: r._id,
        hospital: r.hospitalId?.name || "Hospital",
        hospitalLocation: r.hospitalId?.location,
        donationDate: r.requestDate || r.createdAt,
        bloodGroup: r.bloodType,
        status: "Completed",
      })),
      allRequests: requests,
    });
  } catch (error) {
    console.error("Error in getIndividualDonorReport:", error);
    res.status(500).json({ message: "Failed to get donor report", error: error.message });
  }
};
