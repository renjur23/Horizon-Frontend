// src/components/reports/UsageReport.jsx
import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  MDBContainer,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
} from "mdb-react-ui-kit";

import logo from "../../assets/images/logo.png";
import factoryIcon from "../../assets/images/factory.png";
import co2Icon from "../../assets/images/co2.png";

const itemsPerPage = 100;

const UsageReport = ({ token }) => {
  const [usages, setUsages] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inverters, setInverters] = useState([]);
  const [locations, setLocations] = useState([]);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [logoBase64, setLogoBase64] = useState("");

  useEffect(() => {
    fetchData();
    convertImageToBase64(logo, setLogoBase64);
  }, [currentPage, search, fromDate, toDate]);

  const convertImageToBase64 = (imagePath, setter) => {
    fetch(imagePath)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result);
        reader.readAsDataURL(blob);
      });
  };

  const fetchData = async () => {
    try {
      let url = `/usages/?page=${currentPage}`;
      if (search) url += `&po_number=${search}`;
      if (fromDate) url += `&from_date=${fromDate}`;
      if (toDate) url += `&to_date=${toDate}`;

      const [usageRes, orderRes, inverterRes, locationRes] = await Promise.all([
        axiosInstance.get(url, { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/orders/", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/inverters/", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/locations/", { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setUsages(usageRes.data.results || []);
      setTotalPages(Math.ceil(usageRes.data.count / itemsPerPage));
      setOrders(orderRes.data.results || orderRes.data || []);
      setInverters(inverterRes.data.results || inverterRes.data || []);
      setLocations(locationRes.data.results || locationRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setCurrentPage(1);
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await axiosInstance.post("/usages-upload/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("✅ Excel file uploaded successfully!");
      setCurrentPage(1);
      fetchData();
    } catch (err) {
      console.error("Excel upload failed:", err);
      alert("❌ Failed to upload Excel file. Please try again.");
    }
  };

  const formatInverter = (raw) => {
    if (!raw) return "-";
    const match = raw.match(/HZE-[0-9/()-]+/i);
    return match ? match[0] : raw;
  };

  const formatPO = (raw) => {
    if (!raw) return "-";
    const match = raw.match(/\d+\/\d+/);
    return match ? match[0] : raw;
  };

const downloadPDF = () => {
  if (!usages.length) return;

  const doc = new jsPDF("p", "mm", "a4");
  const FUEL_CONS_PER_HR = 6.8;
  const FUEL_PRICE = 1.25;

  // Group usages by PO number
  const groupedByPO = usages.reduce((acc, u) => {
    const po = u.po_number || "Unknown PO";
    if (!acc[po]) acc[po] = [];
    acc[po].push(u);
    return acc;
  }, {});

  Object.entries(groupedByPO).forEach(([poNumber, usagesGroup], idx) => {
    if (idx > 0) doc.addPage();

    const first = usagesGroup[0];

    // ✅ get details directly from UsageSerializer fields
    const location = first.location_name || "Unknown Location";
    const generatorNo = first.generator_no || "-";
    const inverterNo = first.inverter_given_start_name || "-";
    const givenName = first.inverter_given_name || "-";

    // HEADER
    if (logoBase64) doc.addImage(logoBase64, 14, 8, 25, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      `Battery Usage Report - ${inverterNo}`,
      doc.internal.pageSize.getWidth() / 2,
      15,
      { align: "center" }
    );

    doc.setFontSize(10);

    // LEFT
    doc.text(`PO Number: ${poNumber}`, 14, 28);
    doc.text(`Location: ${location}`, 14, 34);
    doc.text(`Generator No: ${generatorNo}`, 14, 40);

    // RIGHT
doc.text(`Inverter No: ${inverterNo}`, 120, 28);
const inverterDetails = `${first.inverter_given_start_name || ""} ${first.inverter_model || ""} ${first.location_name || ""}`;
doc.text(`Inverter: ${inverterDetails.trim() || "-"}`, 120, 34);


      // TOTALS
      const numberOfDays = usagesGroup.length;
      const totalKW = usagesGroup.reduce((s, u) => s + (u.kw_consumed || 0), 0);
      const totalGenHr = usagesGroup.reduce((s, u) => s + (u.generator_run_hour || 0), 0);
      const totalSiteHours = usagesGroup.reduce((s, u) => s + (u.site_run_hour || 0), 0);
      const totalGenHrSaved = usagesGroup.reduce((s, u) => s + (u.generator_run_hour_save || 0), 0);
      const fuelSaved = usagesGroup.reduce((s, u) => s + (u.fuel_saved || 0), 0);
      const savingsEuro = usagesGroup.reduce((s, u) => s + (u.fuel_cost_saved || 0), 0);
      const co2Reduction = usagesGroup.reduce((s, u) => s + (u.co2_saved || 0), 0);
      const batteryUsage = totalSiteHours > 0 ? ((totalGenHrSaved / totalSiteHours) * 100).toFixed(2) : 0;

      // LEFT TABLE
      autoTable(doc, {
        startY: 50,
        margin: { left: 14, right: 110 },
        tableWidth: 80,
        head: [["Metric", "Value"]],
        body: [
          ["Number of Days", numberOfDays],
          ["Fuel consumption per hour", `${FUEL_CONS_PER_HR} L/hr`],
          ["Cost of Fuel per Litre", `€${FUEL_PRICE}`],
          ["Normal Run-Hours (Site)", `${totalSiteHours.toFixed(1)} h`],
          ["Actual Run-Hours (Gen)", `${totalGenHr.toFixed(1)} h`],
          ["Reduction in Run-Hours", `${totalGenHrSaved.toFixed(1)} h`],
        ],
        styles: { fontSize: 8 },
        theme: "grid",
      });

      // RIGHT TABLE
      autoTable(doc, {
        startY: 50,
        margin: { left: 110, right: 14 },
        tableWidth: 85,
        head: [["Metric", "Run-time (hrs)", "Cost (€)"]],
        body: [
          ["Conventional Generator", `${totalSiteHours.toFixed(1)} h`, `€${(totalSiteHours * FUEL_CONS_PER_HR * FUEL_PRICE).toFixed(2)}`],
          ["Hybrid Generator", `${totalGenHr.toFixed(1)} h`, `€${(totalGenHr * FUEL_CONS_PER_HR * FUEL_PRICE).toFixed(2)}`],
          ["Fuel Saved", `${fuelSaved.toFixed(1)} L`, `€${savingsEuro.toFixed(2)}`],
        ],
        styles: { fontSize: 8 },
        theme: "grid",
      });

      // MAIN TABLE
      const tableData = usagesGroup.map((u) => [
        new Date(u.date).toLocaleDateString("en-GB"),
        u.kw_consumed,
        u.generator_run_hour,
        u.site_run_hour,
        u.generator_run_hour_save,
        u.inverter_usage_calculated,
        u.fuel_saved,
        `€${u.fuel_cost_saved}`,
        u.co2_saved,
      ]);
      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Date","kW","Gen Hr","Site Hr","Saved Hr","Usage %","Fuel Saved (L)","Savings (€)","CO₂ Reduced (kg)"]],
        body: tableData,
        styles: { fontSize: 9 },
        theme: "grid",
        margin: { left: 14, right: 14 },
      });

      // OVERALL PERFORMANCE
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0, 128, 0);
      doc.text("Overall Performance", 14, doc.lastAutoTable.finalY + 15);

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Metric", "Value"]],
        body: [
          ["Power Consumed", `${totalKW.toFixed(1)} kW`],
          ["Generator Running Hours Saved", `${totalGenHrSaved.toFixed(1)} h`],
          ["Fuel Saved", `${fuelSaved.toFixed(1)} L`],
          ["Savings on Fuel", `€${savingsEuro.toFixed(2)}`],
          ["Reduced CO₂ Emissions", `${co2Reduction.toFixed(1)} kg`],
          ["Battery Usage %", `${batteryUsage}%`],
        ],
        styles: { fontSize: 9 },
        theme: "grid",
      });
    });

    // FOOTER
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text(new Date().toLocaleDateString("en-GB"), 14, 290);
    doc.text(`Page ${i} of ${pageCount}`, 200 - 14, 290, { align: "right" });
  }

  // ✅ save using first usage record’s inverter + location
  const firstUsage = usages[0];
  const filename = `${firstUsage.inverter_given_start_name || "Inverter"}_${(firstUsage.location_name || "Location").replace(/\s+/g, "_")}.pdf`;
  doc.save(filename);
};


  return (
    <MDBContainer className="py-4">
      <MDBCard className="mb-4">
        <MDBCardBody>
          <label className="form-label">📎 Upload Usage Excel</label>
          <input
            type="file"
            className="form-control"
            accept=".xlsx,.xls,.xlsm"
            onChange={handleExcelUpload}
          />
        </MDBCardBody>
      </MDBCard>

      <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
        <div>
          <label className="form-label">Search PO</label>
          <input
            type="text"
            className="form-control"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div>
          <label className="form-label">From Date</label>
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <div>
          <label className="form-label">To Date</label>
          <input
            type="date"
            className="form-control"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
        <MDBBtn color="secondary" onClick={clearFilters}>
          Clear
        </MDBBtn>
        <MDBBtn color="danger" onClick={downloadPDF}>
          Download PDF
        </MDBBtn>
      </div>

      <MDBTable responsive striped small bordered>
        <MDBTableHead>
          <tr>
            <th>No</th>
            <th>Date</th>
            <th>Inverter</th>
            <th>PO Number</th>
            <th>kW</th>
            <th>Gen Hr</th>
            <th>Site Hr</th>
            <th>Usage %</th>
            <th>Saved Hr</th>
            <th>Fuel Saved (L)</th>
            <th>Savings (€)</th>
            <th>CO2 Reduced (kg)</th>
          </tr>
        </MDBTableHead>
        <MDBTableBody>
          {usages.map((u, i) => (
            <tr key={u.id}>
              <td>{(currentPage - 1) * itemsPerPage + i + 1}</td>
              <td>{new Date(u.date).toLocaleDateString("en-GB")}</td>
              <td>{formatInverter(u.inverter_display)}</td>
              <td>{u.po_number || "-"}</td>
              <td>{u.kw_consumed}</td>
              <td>{u.generator_run_hour}</td>
              <td>{u.site_run_hour}</td>
              <td>{u.inverter_usage_calculated}</td>
              <td>{u.generator_run_hour_save}</td>
              <td>{u.fuel_saved}</td>
              <td>€{u.fuel_cost_saved}</td>
              <td>{u.co2_saved}</td>
            </tr>
          ))}
        </MDBTableBody>
      </MDBTable>

      <div className="d-flex justify-content-between align-items-center mt-3">
        <p className="mb-0">
          Page {currentPage} of {totalPages}
        </p>
        <div>
          <MDBBtn
            size="sm"
            color="primary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            ⬅ Previous
          </MDBBtn>{" "}
          <MDBBtn
            size="sm"
            color="primary"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Next ➡
          </MDBBtn>
        </div>
      </div>
    </MDBContainer>
  );
};

export default UsageReport;
