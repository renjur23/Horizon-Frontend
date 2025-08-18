// GuestSummaryPage.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const GuestSummaryPage = () => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    axiosInstance.get("/guest/summary/")
      .then((res) => setSummary(res.data))
      .catch((err) => console.error("Error fetching summary:", err));
  }, []);

  if (!summary) return <p>Loading summary...</p>;

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded-lg space-y-4">
      <h2 className="text-xl font-semibold text-center">Guest Dashboard Summary</h2>
      <p>Total Orders: <strong>{summary.total_orders}</strong></p>
      <p>Total Inverters Utilized: <strong>{summary.total_inverters_utilized}</strong></p>
      <p>Total Services Done: <strong>{summary.total_services_done}</strong></p>
    </div>
  );
};

export default GuestSummaryPage;
