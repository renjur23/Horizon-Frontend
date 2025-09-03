import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Pencil } from 'lucide-react';
import {
  MDBCard,
  MDBCardBody,
  MDBCardTitle,
  MDBBtn,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
} from 'mdb-react-ui-kit';

const InverterList = () => {
  const [inverters, setInverters] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [count, setCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 20;

  useEffect(() => {
    fetchInverters();
    fetchStatuses();
  }, []);

  const fetchInverters = async (page = 1, query = '') => {
    try {
      const response = await axiosInstance.get(`/inverters/?page=${page || 1}&search=${query}`);
      setInverters(response.data.results || []);
      setNextPage(response.data.next);
      setPrevPage(response.data.previous);
      setCount(response.data.count || 0);
      setCurrentPage(Number(page));
    } catch (error) {
      console.error('Failed to fetch inverters:', error);
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await axiosInstance.get('/inverter-statuses/');
      setStatuses(res.data.results || res.data);
    } catch (error) {
      console.error('Failed to fetch statuses', error);
    }
  };

  const handleEdit = (inverter) => {
    setEditingId(inverter.id);
    setEditData({
      ...inverter,
      inverter_status_input: inverter.inverter_status,
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload = {
        unit_id: editData.unit_id,
        model: editData.model,
        given_name: editData.given_name,
        serial_no: editData.serial_no,
        inverter_status_input: editData.inverter_status_input,
        remarks: editData.remarks,
      };

      await axiosInstance.patch(`/inverters/${editingId}/`, payload);
      alert('Inverter updated successfully');
      setEditingId(null);
      fetchInverters(currentPage);
    } catch (error) {
      console.error('Update failed', error);
      alert('Update failed');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this inverter?'
    );
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/inverters/${id}/`);
      alert('Inverter deleted successfully');
      fetchInverters(currentPage);
    } catch (error) {
      console.error('Delete failed', error);
      alert('Delete failed');
    }
  };

const goToNextPage = () => {
  const totalPages = Math.ceil(count / pageSize); 
  if (currentPage < totalPages) {
    fetchInverters(currentPage + 1);
  }
};

const goToPrevPage = () => {
  if (currentPage > 1) {
    fetchInverters(currentPage - 1);
  }
};



  const getSortableUnitId = (unit_id) => {
    const match = unit_id?.match(/(\d+\/\d+|\d+)/); // Match formats like "10/46" or "176"
    return match ? match[0] : unit_id;
  };

 const sortedInverters = [...inverters].sort((a, b) =>
  getSortableUnitId(a.unit_id).localeCompare(
    getSortableUnitId(b.unit_id),
    undefined,
    { numeric: true }
  )
);

    // .filter((inv) => {
    //   const query = searchQuery.toLowerCase();
    //   return (
    //     String(inv.unit_id || '')
    //       .toLowerCase()
    //       .includes(query) ||
    //     String(inv.model || '')
    //       .toLowerCase()
    //       .includes(query) ||
    //     String(inv.given_name || '')
    //       .toLowerCase()
    //       .includes(query) ||
    //     String(inv.serial_no || '')
    //       .toLowerCase()
    //       .includes(query) ||
    //     String(inv.inverter_status || '')
    //       .toLowerCase()
    //       .includes(query)
    //   );
    // });

  return (
    <div className="max-w-7xl mx-auto px-4 mt-8">
      <MDBCard className="shadow-sm mb-4">
        <MDBCardBody>
          <MDBCardTitle className="text-primary fw-bold fs-4 mb-3">
            🛠️ Battery List
          </MDBCardTitle>

          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search by Unit ID, Model, Given Name, Serial No or Status"
            className="form-control mb-3"
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value);
            fetchInverters(1, e.target.value); 
            }}
          />

          {sortedInverters.length === 0 ? (
            <p className="text-muted text-center">No inverters found.</p>
          ) : (
            <div className="table-responsive">
              <MDBTable hover bordered align="middle">
                <MDBTableHead light>
                  <tr>
                    <th>Si. No</th>
                    <th>Unit ID</th>
                    <th>Model</th>
                    <th>Given Name</th>
                    <th>Serial No</th>
                    <th>Status</th>
                    <th>Remarks</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </MDBTableHead>
                <MDBTableBody>
                  {sortedInverters.map((inv, index) => {
 
                    const serialNumber =
                      (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={inv.id}>
                        {editingId === inv.id ? (
                          <>
                            <td>{serialNumber}</td>
                            <td>
                              <input
                                name="unit_id"
                                value={editData.unit_id}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td>
                              <input
                                name="model"
                                value={editData.model}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td>
                              <input
                                name="given_name"
                                value={editData.given_name}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td>
                              <input
                                name="serial_no"
                                value={editData.serial_no}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td>
                              <select
                                name="inverter_status_input"
                                value={editData.inverter_status_input}
                                onChange={handleChange}
                                className="form-select"
                              >
                                <option value="">Select Status</option>
                                {statuses.map((status) => (
                                  <option
                                    key={status.id}
                                    value={status.inverter_status_name}
                                  >
                                    {status.inverter_status_name}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td>
                              <input
                                name="remarks"
                                value={editData.remarks}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td className="text-center">
                              <MDBBtn
                                size="sm"
                                color="success"
                                onClick={handleSave}
                              >
                                Save
                              </MDBBtn>
                            </td>
                          </>
                        ) : (
                          <>
                            <td>{serialNumber}</td>
                            <td>{inv.unit_id}</td>
                            <td>{inv.model}</td>
                            <td>{inv.given_name}</td>
                            <td>{inv.serial_no}</td>
                            <td>{inv.inverter_status?.inverter_status_name}</td>

                            <td>{inv.remarks}</td>
                            <td className="text-center">
                              <MDBBtn
                                size="sm"
                                color="info"
                                className="text-white"
                                onClick={() => handleEdit(inv)}
                              >
                                <i className="fas fa-pen"></i>

                              </MDBBtn>
                            </td>
                            <td className="text-center">
                              <MDBBtn
                                size="sm"
                                color="danger"
                                onClick={() => handleDelete(inv.id)}
                              >
                               <i className="fas fa-trash"></i>
                              </MDBBtn>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </MDBTableBody>
              </MDBTable>
            </div>
          )}
        </MDBCardBody>
      </MDBCard>

      {/* Pagination */}
      <div className="d-flex justify-content-between items-center px-2 mb-5">
        <p className="text-muted">
            Page {currentPage} of {Math.ceil(count / pageSize)}
        </p>
        <div className="d-flex gap-2">
          <MDBBtn
            size="sm"
            color="light"
            disabled={!prevPage}
            onClick={goToPrevPage}
          >
            ⬅️ Prev
          </MDBBtn>
          <MDBBtn
            size="sm"
            color="light"
            disabled={!nextPage}
            onClick={goToNextPage}
          >
            Next ➡️
          </MDBBtn>
        </div>
      </div>
    </div>
  );
};

export default InverterList;
