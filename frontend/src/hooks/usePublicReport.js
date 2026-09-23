import { useEffect, useState } from "react";
import axios from "axios";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const emptyReport = {
  bloodTypeStats: Object.fromEntries(BLOOD_TYPES.map((t) => [t, { count: 0, percentage: "0.0" }])),
  monthlyStats: { totalDonationsThisMonth: 0, newDonorsThisMonth: 0, percentageChange: 0 },
  activityStats: { totalDonors: 0, totalHospitals: 0, totalUsers: 0, regionsCovered: 0 },
};

// Real, public platform statistics used by the Home and About pages.
export default function usePublicReport() {
  const [report, setReport] = useState(emptyReport);
  const [doctorsCount, setDoctorsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get("/api/users/public-report")
      .then((res) => {
        if (res.data && res.data.bloodTypeStats) setReport(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    axios
      .get("/api/doctors")
      .then((res) => setDoctorsCount((res.data || []).length))
      .catch(() => {});
  }, []);

  return { report, doctorsCount, loading, BLOOD_TYPES };
}
