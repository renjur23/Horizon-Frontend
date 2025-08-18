// src/components/employee/AddLocationForm.jsx
import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const AddLocationForm = () => {
  const [locationName, setLocationName] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const handleAddLocation = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setError("");

    try {
      const token = localStorage.getItem("access_token");

      const response = await axiosInstance.post(
        "locations/",
        {
          location_name: locationName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccessMessage("✅ Location added successfully!");
      setLocationName("");
    } catch (err) {
      setError("❌ Failed to add location. Please try again.");
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleAddLocation} className="text-start mx-auto" style={{ maxWidth: "400px" }}>
      {successMessage && <p className="text-success">{successMessage}</p>}
      {error && <p className="text-danger">{error}</p>}

      <div className="mb-3">
        <label className="form-label fw-semibold">Location Name</label>
        <input
          type="text"
          className="form-control"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn btn-primary">
        Add Location
      </button>
    </form>
  );
};

export default AddLocationForm;
