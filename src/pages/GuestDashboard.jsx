import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axiosInstance";
import {
  MDBNavbar,
  MDBNavbarBrand,
  MDBNavbarToggler,
  MDBIcon,
  MDBContainer,
  MDBBtn,
} from "mdb-react-ui-kit";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  breakdown: "#dc3545",
  operational: "#007bff",
  ready_to_hire: "#28a745",
};

const GuestDashboard = () => {
  const [summary, setSummary] = useState({
    breakdown: 0,
    operational: 0,
    ready_to_hire: 0,
  });

  const [showSidebar, setShowSidebar] = useState(true);
  const navigate = useNavigate();
  const userName = localStorage.getItem("user_name") || "Guest";

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_name");
    navigate("/login");
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axiosInstance.get("/guest/summary/");
        setSummary(res.data);
      } catch (err) {
        console.error("Error fetching summary:", err);
      }
    };
    fetchSummary();
  }, []);

  const data = [
    { name: "Breakdown", value: summary.breakdown, color: COLORS.breakdown },
    { name: "Operational", value: summary.operational, color: COLORS.operational },
    { name: "Ready to Hire", value: summary.ready_to_hire, color: COLORS.ready_to_hire },
  ];

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        className={`bg-primary text-white pt-5 d-flex flex-column ${showSidebar ? "" : "d-none"}`}
        style={{
          width: "200px",
          minHeight: "100vh",
          position: "fixed",
          top: 0,
          left: 0,
          paddingTop: "70px",
        }}
      >
        <div className="flex-grow-1">
          <ul className="list-unstyled p-3">
            <li className="mb-3 fw-bold">
              <MDBIcon icon="chart-pie" className="me-2" />
              Guest Summary
            </li>
          </ul>
        </div>
        <div className="p-3">
          <MDBBtn color="danger" size="sm" onClick={handleLogout} className="w-100">
            Logout
          </MDBBtn>
        </div>
      </div>

      {/* Top Navbar */}
      <MDBNavbar dark bgColor="dark" className="px-3 fixed-top d-flex justify-content-between">
        <MDBContainer fluid className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <MDBNavbarToggler onClick={() => setShowSidebar(!showSidebar)}>
              <MDBIcon icon="bars" />
            </MDBNavbarToggler>
            <MDBNavbarBrand className="ms-3">VRM Guest Panel</MDBNavbarBrand>
          </div>
          <div className="text-white me-3">
            Welcome, <strong>{userName}</strong>!
          </div>
        </MDBContainer>
      </MDBNavbar>

      {/* Main Content */}
      <div
        style={{
          marginLeft: showSidebar ? "200px" : "0",
          paddingTop: "70px",
          paddingBottom: "30px",
          width: "100%",
          backgroundColor: "#f8f9fa",
          overflowY: "auto",
          transition: "margin-left 0.3s ease",
        }}
      >
        <div className="container py-4">
          <h2 className="fw-bold text-center mb-4">Guest Dashboard - Summary</h2>

          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={0}
                outerRadius={130}
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default GuestDashboard;
