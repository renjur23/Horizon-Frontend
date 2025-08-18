import React, { useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import {
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardTitle
} from "mdb-react-ui-kit";

const GeneratorForm = ({ onGeneratorAdded = null }) => {
  const [formData, setFormData] = useState({
    generator_no: "",
    generator_size: "",
    fuel_consumption: "",
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosInstance.post("/generators/", formData);

      if (onGeneratorAdded && typeof onGeneratorAdded === "function") {
        onGeneratorAdded(response.data);
      }

      setFormData({
        generator_no: "",
        generator_size: "",
        fuel_consumption: "",
      });

      setSuccessMessage("✅ Generator details added successfully!");
      setErrorMessage("");

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error submitting generator form:", error.response?.data || error.message);
      setErrorMessage("❌ Failed to add generator details.");
      setSuccessMessage("");
    }
  };

  return (
    <MDBCard className="p-4 shadow-sm bg-white">
      <MDBCardBody>
        <MDBCardTitle className="mb-4 text-primary fw-bold text-center">
          Add Generator
        </MDBCardTitle>

        {successMessage && <div className="alert alert-success">{successMessage}</div>}
        {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="generator_no" className="form-label">Generator No</label>
            <input
              type="text"
              id="generator_no"
              name="generator_no"
              value={formData.generator_no}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="mb-3">
            <label htmlFor="generator_size" className="form-label">Generator Size</label>
            <input
              type="text"
              id="generator_size"
              name="generator_size"
              value={formData.generator_size}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="fuel_consumption" className="form-label">Fuel Consumption</label>
            <input
              type="text"
              id="fuel_consumption"
              name="fuel_consumption"
              value={formData.fuel_consumption}
              onChange={handleChange}
              required
              className="form-control"
            />
          </div>

          <MDBBtn type="submit" color="primary" className="w-100">
            Submit
          </MDBBtn>
        </form>
      </MDBCardBody>
    </MDBCard>
  );
};

export default GeneratorForm;
