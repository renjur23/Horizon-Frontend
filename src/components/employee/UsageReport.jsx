
// src/components/reports/UsageReport.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  MDBIcon
} from "mdb-react-ui-kit";

// 🔹 Logos
import logo from "../../assets/images/logo.png";
import factoryIcon from "../../assets/images/factory.png";
import co2Icon from "../../assets/images/co2.png";

const itemsPerPage = 100;

// ⚡ Constants
const FUEL_CONS_PER_HR = 6.8;   // litres/hr
const FUEL_PRICE = 1.25;        // €/litre
const CO2_FACTOR = 2.68;        // kg/L

const UsageReport = ({ token }) => {
  const [usages, setUsages] = useState([]);
  const [inverters, setInverters] = useState([]);
  const [orders, setOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [generators, setGenerators] = useState([]);

  const [selectedInverter, setSelectedInverter] = useState("");
  const [filter, setFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);

  const [logoBase64, setLogoBase64] = useState("");
  const [factoryBase64, setFactoryBase64] = useState("");
  const [co2Base64, setCo2Base64] = useState("");

  useEffect(() => {
    fetchAll();
    convertImageToBase64(logo, setLogoBase64);
    convertImageToBase64(factoryIcon, setFactoryBase64);
    convertImageToBase64(co2Icon, setCo2Base64);
  }, []);

  // 🔹 Fetch all pages
  const fetchAllPages = async (url) => {
    let results = [];
    let nextUrl = url;
    while (nextUrl) {
      const res = await axiosInstance.get(nextUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      results = [...results, ...(res.data.results || res.data)];
      nextUrl = res.data.next;
    }
    return results;
  };

  const fetchAll = async () => {
    try {
      const [invRes, ordRes, usageRes, locRes, genRes] = await Promise.all([
        fetchAllPages("/inverters/"),
        fetchAllPages("/orders/"),
        fetchAllPages("/usages/"),
        fetchAllPages("/locations/"),
        fetchAllPages("/generators/"),
      ]);

      setInverters(invRes);
      setOrders(ordRes);
      setUsages(usageRes);
      setLocations(locRes);
      setGenerators(genRes);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  const clearFilters = () => {
    setFilter("");
    setSelectedInverter("");
    setFromDate("");
    setToDate("");
    setSearch("");
    setCurrentPage(1);
  };

  const convertImageToBase64 = (imagePath, setter) => {
    fetch(imagePath)
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onloadend = () => setter(reader.result);
        reader.readAsDataURL(blob);
      })
      .catch((err) => console.error("Image load error:", err));
  };

  // Filtering
  const filteredUsages = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const minusHours = (h) => new Date(now.getTime() - h * 60 * 60 * 1000);

    return (usages || []).filter((u) => {
      const usageDate = new Date(u.date);
      let ok = true;

      // 🔹 Date filters
      switch (filter) {
        case "today":
          ok = usageDate >= startOfToday;
          break;
        case "24h":
          ok = usageDate >= minusHours(24);
          break;
        case "48h":
          ok = usageDate >= minusHours(48);
          break;
        case "week":
          ok = usageDate >= minusHours(24 * 7);
          break;
        case "month":
          ok = usageDate >= minusHours(24 * 30);
          break;
        default:
          ok = true;
      }
      if (!ok) return false;

     

      if (fromDate) {
        const from = new Date(fromDate);
        if (usageDate < from) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (usageDate > to) return false;
      }

      
// 🔹 Search (strict PO only)
if (search) {
  const order = orders.find((o) => o.id === u.order_id);
  const poNumber = order?.po_number?.toLowerCase() || "";

  if (poNumber !== search.toLowerCase()) return false;
}



      return true;
    });
  }, [usages, filter, selectedInverter, fromDate, toDate, search, inverters, orders, generators]);

  // Pagination
  const totalPages = Math.ceil(filteredUsages.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsages = filteredUsages.slice(indexOfFirstItem, indexOfLastItem);
// ----------------- PDF export -----------------


const downloadPDF = () => {
  if (!filteredUsages.length) return;

  const doc = new jsPDF("p", "mm", "a4");

  // 🔹 Group usages by PO number
  const groupedByPO = filteredUsages.reduce((acc, u) => {
    const po = orders.find(o => o.id === u.order_id)?.po_number || "Unknown PO";
    if (!acc[po]) acc[po] = [];
    acc[po].push(u);
    return acc;
  }, {});

  // 🔹 For each PO, create a section (new page for each PO)
  Object.entries(groupedByPO).forEach(([poNumber, usages], idx) => {
    if (idx > 0) doc.addPage();

    const first = usages[0];
    const inverter = inverters.find(inv => inv.id === first.inverter_id);

    // --- Header ---
    if (logoBase64) doc.addImage(logoBase64, 14, 8, 25, 12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(
      `Battery Usage Report - ${inverter?.unit_id || "Unknown Inverter"}`,
      doc.internal.pageSize.getWidth() / 2,
      15,
      { align: "center" }
    );

    doc.setFontSize(10);
    doc.text(`PO Number: ${poNumber}`, 14, 28);
    doc.text(
      `Location: ${
        first.location_name ||
        orders.find(o => o.id === first.order_id)?.location_name ||
        "-"
      }`,
      14,
      34
    );
    doc.text(`Inverter No: ${inverter?.unit_id || "-"}`, 100, 28);
    doc.text(`Given Name: ${inverter?.given_name || "-"}`, 100, 34);
    doc.text(`Generator No: ${first.generator_no || "-"}`, 14, 40);

    // --- 🔹 Calculations ---
    const totalKW = usages.reduce((s, u) => s + (u.kw_consumed || 0), 0);
    const totalGenHr = usages.reduce((s, u) => s + (u.generator_run_hour || 0), 0);
    const totalGenHrSaved = usages.reduce((s, u) => s + (u.generator_run_hour_save || 0), 0);
    const totalSiteHours = usages.reduce((s, u) => s + (u.site_run_hour || 0), 0);

    const fuelSaved = totalGenHrSaved * FUEL_CONS_PER_HR;
    const savingsEuro = fuelSaved * FUEL_PRICE;
    const co2Reduction = fuelSaved * CO2_FACTOR;
    const batteryUsage = totalSiteHours
      ? ((totalGenHrSaved / totalSiteHours) * 100).toFixed(2)
      : 0;

    // ✅ numberOfDays based on employee filter
    let numberOfDays;
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      numberOfDays = new Set(
        usages.map(u => new Date(u.date).toDateString())
      ).size;
    }

    // --- Section: Reduction in Run-Hours (LEFT TABLE) ---
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

    // --- Section: Reduction in Fuel Consumed (RIGHT TABLE) ---
    autoTable(doc, {
      startY: 50,
      margin: { left: 110, right: 14 },
      tableWidth: 85,
      head: [["Metric", "Run-time (hrs)", "Cost (€)"]],
      body: [
        [
          "Conventional Generator",
          `${totalSiteHours.toFixed(1)} h`,
          `€${(totalSiteHours * FUEL_CONS_PER_HR * FUEL_PRICE).toFixed(2)}`
        ],
        [
          "Hybrid Generator",
          `${totalGenHr.toFixed(1)} h`,
          `€${(totalGenHr * FUEL_CONS_PER_HR * FUEL_PRICE).toFixed(2)}`
        ],
        ["Fuel Saved", `${fuelSaved.toFixed(1)} L`, `€${savingsEuro.toFixed(2)}`],
      ],
      styles: { fontSize: 8 },
      theme: "grid",
    });

    // --- Daily Usage Table ---
    const tableData = usages.map(u => {
      const rowFuelSaved = (u.generator_run_hour_save || 0) * FUEL_CONS_PER_HR;
      const rowSavingsEuro = rowFuelSaved * FUEL_PRICE;
      const rowCo2Reduction = rowFuelSaved * CO2_FACTOR;

      return [
        new Date(u.date).toLocaleDateString("en-GB"),
        u.kw_consumed,
        u.generator_run_hour,
        u.site_run_hour,
        u.generator_run_hour_save,
        u.inverter_usage_calculated,
        rowFuelSaved.toFixed(1),
        `€${rowSavingsEuro.toFixed(2)}`,
        rowCo2Reduction.toFixed(1),
      ];
    });

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 15,
      head: [
        [
          "Date",
          "kW",
          "Gen Hr",
          "Site Hr",
          "Saved Hr",
          "Usage %",
          "Fuel Saved (L)",
          "Savings (€)",
          "CO₂ Reduced (kg)"
        ]
      ],
      body: tableData,
      styles: { fontSize: 9 },
      theme: "grid",
      margin: { left: 14, right: 14 },
    });

    // --- Section: Overall Performance ---
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

    // --- Footer with page numbers ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(new Date().toLocaleDateString("en-GB"), 14, 290);
      doc.text(`Page ${i} of ${pageCount}`, 200 - 14, 290, { align: "right" });
    }

    // 🔹 Save using inverter unit_id and order's location
    const firstUsage = filteredUsages[0];
    const firstInverter = inverters.find(inv => inv.id === firstUsage.inverter_id);
    const order = orders.find(o => o.id === firstUsage.order_id);
    const location = locations.find(loc => loc.id === order?.location_id);

    doc.save(
      `${inverter?.unit_id || "UnknownInverter"}_${location?.location_name || "UnknownLocation"}.pdf`
    );
  });
};


  // Excel upload handler
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
      fetchAll();
    } catch (err) {
      console.error("Excel upload failed:", err);
      alert("❌ Failed to upload Excel file. Please try again.");
    }
  };

  return (
    <MDBContainer className="py-4">
      {/* Upload */}
      <MDBCard className="mb-4">
        <MDBCardBody className="d-flex flex-wrap gap-3 align-items-end">
          <div>
            <label className="form-label">📎 Upload Usage Excel</label>
            <input
              type="file"
              className="form-control"
              accept=".xlsx,.xls,.xlsm"
              onChange={handleExcelUpload}
            />
          </div>
        </MDBCardBody>
      </MDBCard>

      {/* Filters */}
      <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
        {/* 🔹 Search box */}
        <div>
          <label className="form-label">Search</label>
          <input
            type="text"
            className="form-control"
            placeholder="Search po number"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div>
          <label className="form-label">Filter</label>
          <select
            className="form-select"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="">All</option>
            <option value="today">Today</option>
            <option value="24h">Last 24 Hours</option>
            <option value="48h">Last 48 Hours</option>
            <option value="week">Last 1 Week</option>
            <option value="month">Last 1 Month</option>
          </select>
        </div>

        

        {/* Date range */}
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

      {/* Table */}
      <MDBTable responsive striped small bordered>
        <MDBTableHead>
         <tr>
                    <th>No</th>
                    <th>Date</th>
                    <th>Inverter</th>
                    <th>PO</th>
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
            {currentUsages.map((u, i) => {
              const fuelSaved = (u.generator_run_hour_save || 0) * FUEL_CONS_PER_HR;
              const savingsEuro = fuelSaved * FUEL_PRICE;
              const co2Reduction = fuelSaved * CO2_FACTOR;

              return (
                <tr key={u.id}>
                  <td>{indexOfFirstItem + i + 1}</td>
                  <td>{new Date(u.date).toLocaleDateString("en-GB")}</td>
                  <td>{inverters.find((inv) => inv.id === u.inverter_id)?.unit_id || "-"}</td>
                  <td>{orders.find((o) => o.id === u.order_id)?.po_number || "-"}</td>
                  <td>{u.kw_consumed}</td>
                  <td>{u.generator_run_hour}</td>
                  <td>{u.site_run_hour}</td>
                  <td>{u.inverter_usage_calculated}</td>
                  <td>{u.generator_run_hour_save}</td>
                  <td>{fuelSaved.toFixed(1)}</td>
                  <td>€{savingsEuro.toFixed(2)}</td>
                  <td>{co2Reduction.toFixed(1)}</td>
                </tr>
              );
            })}
</MDBTableBody>

      </MDBTable>

      {/* Pagination */}
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
