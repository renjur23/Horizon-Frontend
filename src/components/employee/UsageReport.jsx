import React, { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  MDBContainer,
  MDBInput,
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
} from "mdb-react-ui-kit";

const UsageReport = ({ token }) => {
  const [usages, setUsages] = useState([]);
  const [inverters, setInverters] = useState([]);
  const [orders, setOrders] = useState([]);
  const [locations, setLocations] = useState([]);
  const [generators, setGenerators] = useState([]);
  const [selectedInverter, setSelectedInverter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filter, setFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
     const [invRes, ordRes, usageRes, locRes, genRes] = await Promise.all([

        axiosInstance.get("/inverters/", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/orders/", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/usages/", { headers: { Authorization: `Bearer ${token}` } }),
        axiosInstance.get("/locations/", { headers: { Authorization: `Bearer ${token}` } }),    // ✅ NEW
        axiosInstance.get("/generators/", { headers: { Authorization: `Bearer ${token}` } }),   // ✅ NEW
      ]);
      setInverters(invRes.data.results || invRes.data);
      setOrders(ordRes.data.results || ordRes.data);
      setUsages(usageRes.data.results || usageRes.data);
      setLocations(locRes.data.results || locRes.data);     // ✅ NEW
      setGenerators(genRes.data.results || genRes.data);    // ✅ NEW
    } catch (err) { console.error("Fetch error:", err); }
  };

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append("file", file);

    try {
      await axiosInstance.post("/usages-upload/", uploadData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      fetchAll();
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };

  const filteredUsages = usages.filter((u) => {
    const usageDate = new Date(u.date);
    const now = new Date();
    let match = true;

    if (filter) {
      let threshold;
      switch (filter) {
        case "today": match = usageDate.toDateString() === now.toDateString(); break;
        case "week": threshold = new Date(); threshold.setDate(now.getDate() - 7); match = usageDate >= threshold; break;
        case "month": threshold = new Date(); threshold.setMonth(now.getMonth() - 1); match = usageDate >= threshold; break;
        default: match = true;
      }
    }

    if (selectedInverter && u.inverter_id !== selectedInverter) match = false;
    if (fromDate && usageDate < new Date(fromDate)) match = false;
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59);
      if (usageDate > to) match = false;
    }
    return match;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsages = filteredUsages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsages.length / itemsPerPage);

  const downloadPDF = () => {
    if (!filteredUsages.length) return;
    
 
    const FUEL_CONSUMPTION_PER_HOUR = 12;
    const CO2_PER_LITRE = 2.678;
    const doc = new jsPDF("p", "mm", "a4");
    const first = filteredUsages[0];
    const fuelPrice = first?.order_id?.fuel_price || 1.25;

    const inverter = first?.inverter_given_name || first?.inverter_id;
    const fileName = `${(inverter || "report").replace(/\s+/g, "_")}.pdf`;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Battery Usage Report", doc.internal.pageSize.getWidth() / 2, 20, { align: "center" });
    doc.setFontSize(10);
    let y = 28;
    doc.text(`PO Number   : ${first?.po_number || "-"}`, 14, y);
    doc.text(`Unit ID     : ${first?.inverter_unit_id || "-"}`, 100, y); y += 6;
    doc.text(`Location    : ${first?.location_name || "-"}`, 14, y);
    doc.text(`Given Name  : ${first?.inverter_given_name || "-"}`, 100, y); y += 6;
    doc.text(`Generator No: ${first?.generator_no || "-"}`, 14, y);

    

    let totalKW = 0, totalSavedHrs = 0, totalFuelSaved = 0, totalFuelCost = 0, totalCO2 = 0, totalSiteHrs = 0;
    const tableData = filteredUsages.map((u) => {
      const kw = +u.kw_consumed;
      const genHr = +u.generator_run_hour;
      const siteHr = +u.site_run_hour;
      const savedHr = siteHr - genHr;
      const batteryUsage = (savedHr / siteHr) * 100;
      const fuelSaved = savedHr * FUEL_CONSUMPTION_PER_HOUR;
      const fuelCost = fuelSaved * fuelPrice;
      const co2 = fuelSaved * CO2_PER_LITRE;

      totalKW += kw;
      totalSavedHrs += savedHr;
      totalFuelSaved += fuelSaved;
      totalFuelCost += fuelCost;
      totalCO2 += co2;
      totalSiteHrs += siteHr;

      return [new Date(u.date).toLocaleDateString(), kw.toFixed(2), genHr.toFixed(2), savedHr.toFixed(2), `${batteryUsage.toFixed(2)}%`, fuelSaved.toFixed(2), `€${fuelCost.toFixed(2)}`, co2.toFixed(2)];
    });

    autoTable(doc, {
      startY: 48,
      head: [["Date", "KW", "Gen Hr", "Saved Hr", "Battery Usage %", "Fuel Saved", "Fuel €", "CO₂"]],
      body: tableData,
      margin: { bottom: 30 },
    });

    const avgBatteryUsage = totalSiteHrs > 0 ? (totalSavedHrs / totalSiteHrs) * 100 : 0;
    const numberOfDays = new Set(filteredUsages.map(u => new Date(u.date).toDateString())).size;
    const reductionPercent = totalSiteHrs > 0 ? (totalSavedHrs / totalSiteHrs) * 100 : 0;

    let finalY = doc.lastAutoTable.finalY + 80;
    doc.setFillColor(193, 245, 193);
    doc.rect(14, finalY, 182, 30, 'F');
    doc.setTextColor(60);
    doc.setFontSize(11);

    const leftX = 16, midX = 80;
    const rightLabelX = 120;  // 👈 Shifted right to give enough space
    const rightValueX = 170;
    let line = finalY + 7;
    doc.text("Power Consumed :", leftX, line);
    doc.text(`${totalKW.toFixed(0)}`, leftX + 65, line);
    doc.text("Fuel Saved :", rightLabelX, line);
    doc.text(`${totalFuelSaved.toFixed(0)}`, rightValueX, line);

    line += 7;
    doc.text("Generator Running Hours Saved :", leftX, line);
    doc.text(`${totalSavedHrs.toFixed(0)}`, leftX + 65, line);
    doc.text("Savings On Fuel :", rightLabelX, line);
    doc.text(`€${totalFuelCost.toFixed(2)}`, rightValueX, line);

    line += 7;
    doc.text("Reduced CO2 Emissions :", leftX, line);
    doc.text(`${totalCO2.toFixed(1)}`, leftX + 65, line);
    doc.text("Battery Usage %:",  rightLabelX, line);
    doc.text(`${avgBatteryUsage.toFixed(2)}%`,rightValueX, line);






const actualRunHrs = totalSiteHrs - totalSavedHrs;
const normalFuel = totalSiteHrs * FUEL_CONSUMPTION_PER_HOUR;
const hybridFuel = totalSavedHrs * FUEL_CONSUMPTION_PER_HOUR;
const conventionalCost = normalFuel * fuelPrice;
const hybridCost = hybridFuel * fuelPrice;
const fuelReduction = normalFuel - hybridFuel;
const costReduction = conventionalCost - hybridCost;

const waveColor = [200, 255, 200];
const boxWidth = 88;

let boxY = line + 15;

// --- LEFT BOX CONTENT ---
doc.setFontSize(12);
doc.setTextColor(0);
doc.text("Reduction in run-hours", 14 + boxWidth / 2, boxY + 7, { align: "center" });
doc.setFontSize(16);
doc.setTextColor(0, 150, 0);
doc.text(`${reductionPercent.toFixed(2)}%`, 14 + boxWidth / 2, boxY + 15, { align: "center" });

let tableYLeft = boxY + 20;

// draw table first (to get height)
autoTable(doc, {
  startY: tableYLeft,
  margin: { left: 14 },
  body: [
    ['Number of days', `${numberOfDays}`],
    ['Fuel consumption per hour', `${FUEL_CONSUMPTION_PER_HOUR} L`],
    ['Cost of fuel per litre', `€${fuelPrice.toFixed(2)}`],
    ['Normal run-hours for this period', `${totalSiteHrs.toFixed(0)}`],
    ['Actual run-hours for this period', `${actualRunHrs.toFixed(0)}`],
    ['Reduction in run-hours for this period', `${totalSavedHrs.toFixed(0)}`],
  ],
  styles: { fontSize: 8, halign: 'left', cellPadding: 0.5 },
  head: [],
  theme: 'grid',
  tableWidth: 80,
  tableLineWidth: 0,
});

// get height of left table
const leftTableHeight = doc.lastAutoTable.finalY - boxY;

// draw green box behind it
doc.setFillColor(...waveColor);
doc.roundedRect(14, boxY, boxWidth, leftTableHeight + 10, 8, 8, 'F');

// redraw text over the box
doc.setTextColor(0);
doc.setFontSize(12);
doc.text("Reduction in run-hours", 14 + boxWidth / 2, boxY + 7, { align: "center" });
doc.setFontSize(16);
doc.setTextColor(0, 150, 0);
doc.text(`${reductionPercent.toFixed(2)}%`, 14 + boxWidth / 2, boxY + 15, { align: "center" });

// redraw table
autoTable(doc, {
  startY: tableYLeft,
  margin: { left: 14 },
  body: [
    ['Number of days', `${numberOfDays}`],
    ['Fuel consumption per hour', `${FUEL_CONSUMPTION_PER_HOUR} L`],
    ['Cost of fuel per litre', `€${fuelPrice.toFixed(2)}`],
    ['Normal run-hours for this period', `${totalSiteHrs.toFixed(0)}`],
    ['Actual run-hours for this period', `${actualRunHrs.toFixed(0)}`],
    ['Reduction in run-hours for this period', `${totalSavedHrs.toFixed(0)}`],
  ],
  styles: { fontSize: 8, halign: 'left', cellPadding: 0.5 },
  head: [],
  theme: 'grid',
  tableWidth: 80,
  tableLineWidth: 0,
});

// --- RIGHT BOX CONTENT ---
doc.setTextColor(0);
doc.setFontSize(12);
doc.text("Reduction in fuel consumed", 112 + boxWidth / 2, boxY + 7, { align: "center" });
doc.setFontSize(16);
doc.setTextColor(0, 150, 0);
doc.text(`${reductionPercent.toFixed(2)}%`, 112 + boxWidth / 2, boxY + 15, { align: "center" });

let tableYRight = boxY + 20;

// draw right table first
autoTable(doc, {
  startY: tableYRight,
  margin: { left: 112 },
  head: [['', 'Run-time (hrs)', 'Cost (€)']],
  body: [
    ['Conventional generator', `${normalFuel.toFixed(0)}`, `€${conventionalCost.toFixed(2)}`],
    ['Hybrid generator', `${hybridFuel.toFixed(0)}`, `€${hybridCost.toFixed(2)}`],
    ['Fuel saved', `${fuelReduction.toFixed(0)}`, `€${costReduction.toFixed(2)}`],
  ],
  styles: { fontSize: 8, halign: 'center', cellPadding: 0.5 },
  headStyles: { fillColor: [230, 230, 230] },
  theme: 'grid',
  tableWidth: 80,
});

// get right table height
const rightTableHeight = doc.lastAutoTable.finalY - boxY;

// draw green box behind it
doc.setFillColor(...waveColor);
doc.roundedRect(112, boxY, boxWidth, rightTableHeight + 10, 8, 8, 'F');

// redraw text over the box
doc.setTextColor(0);
doc.setFontSize(12);
doc.text("Reduction in fuel consumed", 112 + boxWidth / 2, boxY + 7, { align: "center" });
doc.setFontSize(16);
doc.setTextColor(0, 150, 0);
doc.text(`${reductionPercent.toFixed(2)}%`, 112 + boxWidth / 2, boxY + 15, { align: "center" });

// redraw table
autoTable(doc, {
  startY: tableYRight,
  margin: { left: 112 },
  head: [['', 'Run-time (hrs)', 'Cost (€)']],
  body: [
    ['Conventional generator', `${normalFuel.toFixed(0)}`, `€${conventionalCost.toFixed(2)}`],
    ['Hybrid generator', `${hybridFuel.toFixed(0)}`, `€${hybridCost.toFixed(2)}`],
    ['Fuel saved', `${fuelReduction.toFixed(0)}`, `€${costReduction.toFixed(2)}`],
  ],
  styles: { fontSize: 8, halign: 'center', cellPadding: 0.5 },
  headStyles: { fillColor: [230, 230, 230] },
  theme: 'grid',
  tableWidth: 80,
});



    doc.save(fileName);
  };

  return (
    <MDBContainer className="py-4">
      <MDBCard className="mb-4">
        <MDBCardBody>
          <h5 className="mb-3">📅 Upload Usage Excel</h5>
          <input type="file" className="form-control mb-3" accept=".xlsx,.xls,.xlsm" onChange={handleExcelUpload} />
        </MDBCardBody>
      </MDBCard>

      <div className="d-flex flex-wrap gap-3 mb-3 align-items-end">
        <div>
          <label className="form-label">Filter</label>
          <select className="form-select" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All</option>
            <option value="today">Today</option>
            <option value="week">Last 1 Week</option>
            <option value="month">Last 1 Month</option>
          </select>
        </div>
        <div>
          <label className="form-label">Inverter</label>
          <select className="form-select" value={selectedInverter} onChange={(e) => setSelectedInverter(e.target.value)}>
            <option value="">All Inverters</option>
            {inverters.map((inv) => <option key={inv.id} value={inv.id}>{inv.unit_id}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">From Date</label>
          <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div>
          <label className="form-label">To Date</label>
          <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <MDBBtn color="secondary" onClick={() => { setFilter(""); setSelectedInverter(""); setFromDate(""); setToDate(""); setCurrentPage(1); }}>Clear</MDBBtn>
        <MDBBtn color="danger" onClick={downloadPDF}>Download PDF</MDBBtn>
      </div>

      <MDBTable responsive striped small bordered>
        <MDBTableHead>
          <tr><th>#</th><th>Date</th><th>Inverter</th><th>PO</th><th>kW</th><th>Gen Hr</th><th>Site Hr</th><th>Usage %</th><th>Saved Hr</th></tr>
        </MDBTableHead>
        <MDBTableBody>
          {currentUsages.map((u, i) => (
            <tr key={u.id}>
              <td>{indexOfFirstItem + i + 1}</td>
              <td>{new Date(u.date).toLocaleDateString()}</td>
              <td>{inverters.find((inv) => inv.id === u.inverter_id)?.unit_id}</td>
              <td>{orders.find((o) => o.id === u.order_id)?.po_number}</td>
              <td>{u.kw_consumed}</td>
              <td>{u.generator_run_hour}</td>
              <td>{u.site_run_hour}</td>
              <td>{u.inverter_usage_calculated}</td>
              <td>{u.generator_run_hour_save}</td>
            </tr>
          ))}
        
      </MDBTableBody>
    </MDBTable>

    <div className="d-flex justify-content-between align-items-center mt-3">
      <p className="mb-0">Page {currentPage} of {totalPages}</p>
      <div>
        <MDBBtn size="sm" color="primary" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>⬅ Previous</MDBBtn>{" "}
        <MDBBtn size="sm" color="primary" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>Next ➡</MDBBtn>
      </div>
    </div>
    </MDBContainer>
);

}

export default UsageReport;
