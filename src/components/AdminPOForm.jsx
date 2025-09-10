import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MDBBtn,
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBCardText,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
} from 'mdb-react-ui-kit';

const AdminPOForm = () => {
  const [poNumber, setPoNumber] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [location, setLocation] = useState('');
  const [inverter, setInverter] = useState('');
  const [inverter_id, setInverterId] = useState('');
  const [generator_no, setGeneratorNo] = useState('');
  const [generator_size, setGeneratorSize] = useState('');
  const [fuel_consumption, setFuel] = useState('');
  const [siteContact_name, setSiteContactName] = useState('');
  const [siteContact_email, setSiteContactEmail] = useState('');
  const [siteContact_number, setSiteContactNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  // Inside your add-po component
  const locationHook = useLocation();

  useEffect(() => {
    const searchParams = new URLSearchParams(locationHook.search);
    const inverterFromQuery = searchParams.get('inverter');
    const inverterIdFromQuery = searchParams.get('inverter_id');
    if (inverterFromQuery) {
      setInverter(inverterFromQuery);
    }
    if (inverterIdFromQuery) {
      setInverterId(inverterIdFromQuery);
    }
  }, [locationHook.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    if (!contractNumber) {
      setErrorMsg('Contract number is required.');
      return;
    }
    if (!poNumber) {
      setErrorMsg('PO number is required.');
      return;
    }
    if (!clientName) {
      setErrorMsg('Client name is required.');
      return;
    }

    if (!startDate) {
      setErrorMsg('Start date is required.');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');

      // Step 1: Create or find the client
      const clientResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/clients/`,
        {
          client_name: clientName,
          client_contact: clientContact || "",
          client_email: clientEmail || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const clientId = clientResponse.data.id;
      const formattedEndDate = endDate
        ? new Date(endDate).toISOString().split('T')[0] // ensures YYYY-MM-DD
        : null;

      // Step 2: Create Order using Client ID
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/orders/`,
        {
          po_number: poNumber,
          contract_no: contractNumber,
          issued_to: clientId,
          location: location || null,
          inverter_id: inverter_id || null,
          generator_no: generator_no || null,
          generator_size: generator_size || null,
          fuel_consumption: fuel_consumption || null,
          start_date: startDate,
          end_date: endDate ? formattedEndDate : null,
          remarks: remarks || null,
          site_contact_name: siteContact_name || null,
          site_contact_email: siteContact_email || null,
          site_contact_number: siteContact_number || null,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

 

      setSuccessMsg('PO and client details added successfully!');

      setTimeout(() => {
        window.location.href = `${
          import.meta.env.VITE_BASE_URL
        }/admin-dashboard`;
      }, 1500);

      // Reset form

      setPoNumber('');

      setContractNumber('');

      setClientName('');

      setClientContact('');

      setClientEmail('');

      setLocation('');

      setInverter('');

      setGeneratorSize('');

      setGeneratorNo('');

      setFuel('');

      setSiteContactName('');

      setSiteContactEmail('');

      setSiteContactNumber('');

      setStartDate('');
      setEndDate('');

      setRemarks('');
    } catch (error) {
      if (error.response) {
        console.error('Order creation failed:', error.response.data);

        setErrorMsg(JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Unexpected error:', error.message);

        setErrorMsg('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <MDBCard className="p-4 shadow-sm bg-white">
      <MDBCardBody>
        <MDBCardTitle className="mb-4 text-primary fw-bold">
          Add PO & Client Details
        </MDBCardTitle>

        {successMsg && <div className="alert alert-success">{successMsg}</div>}
        {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}

        <form onSubmit={handleSubmit}>
          {/* Basic Info */}
          <div className="mb-3">
            <label htmlFor="poNumber" className="form-label">
              PO Number<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="poNumber"
              className="form-control"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="contractNumber" className="form-label">
              Contract Number<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="contractNumber"
              className="form-control"
              value={contractNumber}
              onChange={(e) => setContractNumber(e.target.value)}
              required
            />
          </div>

          {/* Client Info */}
          <h5 className="mt-4 mb-2 text-dark">Client Info</h5>
          <div className="mb-3">
            <label htmlFor="clientName" className="form-label">
              Name<span className="text-danger">*</span>
            </label>
            <input
              type="text"
              id="clientName"
              className="form-control"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="clientContact" className="form-label">
              Contact
            </label>
            <input
              type="text"
              id="clientContact"
              className="form-control"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="clientEmail" className="form-label">
              Email
            </label>
            <input
              type="email"
              id="clientEmail"
              className="form-control"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
            />
          </div>

          {/* System Info */}
          <div className="mb-3">
            <label htmlFor="location" className="form-label">
              Location
            </label>
            <input
              type="text"
              id="location"
              className="form-control"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="inverter" className="form-label">
              Inverter
            </label>
            <input
              type="text"
              id="inverter"
              className="form-control"
              value={inverter}
              onChange={(e) => setInverter(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="generator" className="form-label">
              Generator No
            </label>
            <input
              type="text"
              id="generator_no"
              className="form-control"
              value={generator_no}
              onChange={(e) => setGeneratorNo(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="generator" className="form-label">
              Generator Size
            </label>
            <input
              type="text"
              id="generator_size"
              className="form-control"
              value={generator_size}
              onChange={(e) => setGeneratorSize(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="generator" className="form-label">
              Fuel Consumption
            </label>
            <input
              type="text"
              id="generator_fuel"
              className="form-control"
              value={fuel_consumption}
              onChange={(e) => setFuel(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="siteContact" className="form-label">
              Site Contact Name
            </label>
            <input
              type="text"
              id="siteContact_name"
              className="form-control"
              value={siteContact_name}
              onChange={(e) => setSiteContactName(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="siteContact" className="form-label">
              Site Contact Email
            </label>
            <input
              type="text"
              id="siteContact_email"
              className="form-control"
              value={siteContact_email}
              onChange={(e) => setSiteContactEmail(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="siteContact" className="form-label">
              Site Contact Number
            </label>
            <input
              type="text"
              id="siteContact_number"
              className="form-control"
              value={siteContact_number}
              onChange={(e) => setSiteContactNumber(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label htmlFor="startDate" className="form-label">
              Start Date <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              id="startDate"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="mb-3">
            <label htmlFor="startDate" className="form-label">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="remarks" className="form-label">
              Remarks
            </label>
            <textarea
              id="remarks"
              className="form-control"
              rows="3"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>

          <MDBBtn
            type="submit"
            style={{ backgroundColor: '#28a745', borderColor: '#28a745' }}
          >
            Hire
          </MDBBtn>
        </form>
      </MDBCardBody>
    </MDBCard>
  );
};

export default AdminPOForm;
