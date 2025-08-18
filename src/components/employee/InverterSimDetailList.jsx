import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Pencil } from 'lucide-react';
import {
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
  MDBBtn,
} from 'mdb-react-ui-kit';

const InverterSimDetailList = () => {
  const [simDetails, setSimDetails] = useState([]);
  const [formData, setFormData] = useState({
    inverter_id: '',
    phone_number: '',
    serial_no: '',
    user_no: '',
    installation_date: '',
    remarks: '',
  });
  const [editData, setEditData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [inverters, setInverters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);
  const [pageSize] = useState(5);

  const fetchSimDetails = async (page = 1) => {
    try {
      const response = await axiosInstance.get(
        `/inverter-sim-details/?page=${page}`
      );
      setSimDetails(response.data.results || []);
      setCount(response.data.count || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error(
        'Error fetching SIM details:',
        error.response?.data || error.message
      );
    }
  };

  const fetchInverters = async () => {
    try {
      const response = await axiosInstance.get('/inverters/');
      setInverters(response.data.results || response.data);
    } catch (error) {
      console.error(
        'Error fetching inverters:',
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    fetchSimDetails(currentPage);
    fetchInverters();
  }, [currentPage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/inverter-sim-details/', formData);
      fetchSimDetails(currentPage);
      setFormData({
        inverter_id: '',
        phone_number: '',
        serial_no: '',
        user_no: '',
        installation_date: '',
        remarks: '',
      });
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
    }
  };

  const handleSaveEdit = async () => {
    try {
      await axiosInstance.put(`/inverter-sim-details/${editingId}/`, editData);
      setEditingId(null);
      setEditData({});
      fetchSimDetails(currentPage);
    } catch (error) {
      console.error(
        'Error updating SIM detail:',
        error.response?.data || error.message
      );
    }
  };
  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this SIM detail?'
    );
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/inverter-sim-details/${id}/`);
      fetchSimDetails(currentPage); // Refresh list after deletion
    } catch (error) {
      console.error(
        'Error deleting SIM detail:',
        error.response?.data || error.message
      );
    }
  };

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <MDBCard className="mb-4 shadow-sm">
        <MDBCardBody>
          <MDBCardTitle className="text-primary fw-bold fs-5 mb-1">
            ➕ Add New Inverter SIM Detail
          </MDBCardTitle>
          <h6 className="text-muted mb-3">
            Fill out the form below to add a new SIM detail
          </h6>

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-4">
              <label htmlFor="inverter_id" className="form-label fw-semibold">
                Select Inverter
              </label>
              <select
                id="inverter_id"
                name="inverter_id"
                value={formData.inverter_id}
                onChange={handleChange}
                required
                className="form-select"
              >
                <option value="">-- Select Inverter --</option>
                {inverters.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.given_name} ({inv.serial_no})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-2">
              <label htmlFor="phone_number" className="form-label fw-semibold">
                Phone Number
              </label>
              <input
                type="text"
                id="phone_number"
                name="phone_number"
                placeholder="Phone Number"
                value={formData.phone_number}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-2">
              <label htmlFor="serial_no" className="form-label fw-semibold">
                SIM Serial No
              </label>
              <input
                type="text"
                id="serial_no"
                name="serial_no"
                placeholder="SIM Serial No"
                value={formData.serial_no}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-2">
              <label htmlFor="user_no" className="form-label fw-semibold">
                User No
              </label>
              <input
                type="text"
                id="user_no"
                name="user_no"
                placeholder="User No"
                value={formData.user_no}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>

            <div className="col-md-2">
              <label
                htmlFor="installation_date"
                className="form-label fw-semibold"
              >
                Installation Date
              </label>
              <div className="position-relative">
                <input
                  type="date"
                  id="installation_date"
                  name="installation_date"
                  value={formData.installation_date}
                  onChange={(e) => {
                    handleChange(e);
                    
                  }}
                  required
                  className="form-control pe-5"
                />
                <span
                  onClick={() =>
                    document.getElementById('installation_date')?.showPicker?.()
                  }
                  className="position-absolute top-50 end-0 translate-middle-y me-3"
                  style={{ cursor: 'pointer', color: '#999' }}
                >
                  📅
                </span>
              </div>
            </div>

            <div className="col-md-6">
              <label htmlFor="remarks" className="form-label fw-semibold">
                Remarks
              </label>
              <input
                type="text"
                id="remarks"
                name="remarks"
                placeholder="Remarks"
                value={formData.remarks}
                onChange={handleChange}
                className="form-control"
              />
            </div>

            <div className="col-md-2 align-self-end">
              <button type="submit" className="btn btn-primary w-100">
                Add
              </button>
            </div>
          </form>
        </MDBCardBody>
      </MDBCard>

      <MDBCard>
        <MDBCardBody>
          <MDBCardTitle className="text-secondary fs-5 mb-3">
            📋 SIM Details Listing
          </MDBCardTitle>
          <MDBTable hover bordered responsive align="middle">
            <MDBTableHead light>
              <tr>
                <th>SI No</th>
                <th>Inverter</th>
                <th>Phone Number</th>
                <th>SIM Serial No</th>
                <th>User No</th>
                <th>Installation Date</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </MDBTableHead>
            <MDBTableBody>
              {simDetails.length > 0 ? (
                simDetails.map((sim, index) => {
                  const inverterName =
                    inverters.find((i) => i.id === sim.inverter_id)
                      ?.given_name || 'N/A';

                  return (
                    <tr key={sim.id}>
                      <td>{(currentPage - 1) * pageSize + index + 1}</td>
                      <td>
                        {editingId === sim.id ? (
                          <select
                            name="inverter_id"
                            value={editData.inverter_id}
                            onChange={handleEditChange}
                            className="form-select"
                          >
                            <option value="">-- Select Inverter --</option>
                            {inverters.map((inv) => (
                              <option key={inv.id} value={inv.id}>
                                {inv.given_name} ({inv.serial_no})
                              </option>
                            ))}
                          </select>
                        ) : (
                          inverterName
                        )}
                      </td>

                      <td>
                        {editingId === sim.id ? (
                          <input
                            name="phone_number"
                            value={editData.phone_number}
                            onChange={handleEditChange}
                            className="form-control"
                          />
                        ) : (
                          sim.phone_number
                        )}
                      </td>

                      <td>
                        {editingId === sim.id ? (
                          <input
                            name="serial_no"
                            value={editData.serial_no}
                            onChange={handleEditChange}
                            className="form-control"
                          />
                        ) : (
                          sim.serial_no
                        )}
                      </td>
                      <td>
                        {editingId === sim.id ? (
                          <input
                            name="user_no"
                            value={editData.user_no}
                            onChange={handleEditChange}
                            className="form-control"
                          />
                        ) : (
                          sim.user_no
                        )}
                      </td>
                      <td>
                        {editingId === sim.id ? (
                          <div className="position-relative">
                            <input
                              type="date"
                              id={`edit_installation_${sim.id}`}
                              name="installation_date"
                              value={editData.installation_date}
                              onChange={(e) => {
                                handleEditChange(e);
                               
                              }}
                              className="form-control pe-5"
                            />
                            <span
                              onClick={() =>
                                document
                                  .getElementById(`edit_installation_${sim.id}`)
                                  ?.showPicker?.()
                              }
                              className="position-absolute top-50 end-0 translate-middle-y me-3"
                              style={{ cursor: 'pointer', color: '#999' }}
                            >
                              📅
                            </span>
                          </div>
                        ) : (
                          sim.installation_date.slice(0, 10)
                        )}
                      </td>
                      <td>
                        {editingId === sim.id ? (
                          <input
                            name="remarks"
                            value={editData.remarks}
                            onChange={handleEditChange}
                            className="form-control"
                          />
                        ) : (
                          sim.remarks || 'N/A'
                        )}
                      </td>
                      <td className="text-center d-flex gap-2 justify-content-center">
                        {editingId === sim.id ? (
                          <MDBBtn
                            size="sm"
                            color="success"
                            onClick={handleSaveEdit}
                          >
                            Save
                          </MDBBtn>
                        ) : (
                          <>
                            <MDBBtn
                              size="sm"
                              color="info"
                              className="text-white"
                              onClick={() => {
                                setEditingId(sim.id);
                                setEditData({
                                  inverter_id: sim.inverter_id,
                                  phone_number: sim.phone_number,
                                  serial_no: sim.serial_no,
                                  user_no: sim.user_no,
                                  installation_date: sim.installation_date.slice(0, 10),
                                  remarks: sim.remarks,
                                });
                              }}
                            >
                              <Pencil size={16} />
                            </MDBBtn>
                            <MDBBtn
                              size="sm"
                              color="danger"
                              onClick={() => handleDelete(sim.id)}
                            >
                              🗑
                            </MDBBtn>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-3">
                    No SIM details found.
                  </td>
                </tr>
              )}
            </MDBTableBody>
          </MDBTable>
        </MDBCardBody>
      </MDBCard>

      <div className="d-flex justify-between align-items-center mb-5 px-2">
        <MDBBtn
          size="sm"
          color="light"
          onClick={() => fetchSimDetails(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ⬅️ Previous
        </MDBBtn>
        <span className="text-muted">
          Page {currentPage} of {totalPages}
        </span>
        <MDBBtn
          size="sm"
          color="light"
          onClick={() => fetchSimDetails(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next ➡️
        </MDBBtn>
      </div>
    </div>
  );
};

export default InverterSimDetailList;
