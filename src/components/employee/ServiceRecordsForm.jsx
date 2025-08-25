import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Pencil, Trash } from 'lucide-react';
import { MDBIcon } from 'mdb-react-ui-kit';

const ServiceRecordsForm = ({ token }) => {
  const [formData, setFormData] = useState({
    service_token_number: '',
    inverter_id: '',
    date_of_service: '',
    problem: '',
    repair_done: '',
    status: '',
    distance_travelled: '',
    hours_spent_on_travel: '',
    warranty_claim: '',
    hours_spent_on_site: '',
    base: '',
    service_location: '',
  });

  const [inverters, setInverters] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [records, setRecords] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);
  const pageSize = 20;

  // const handleDelete = (id) => {
  //   // Optionally, confirm with the user:
  //   if (window.confirm('Are you sure you want to delete this record?')) {
  //     setRecords((prevRecords) =>
  //       prevRecords.filter((record) => record.id !== id)
  //     );
  //   }
  // };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this service record?'
    );
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/service-records/${id}/`);
      alert('Service record deleted successfully.');
      // Refresh the records list - replace with your actual fetch function
      fetchRecords(); // or fetchServiceRecords() or whatever your fetch function is called
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed.');
    }
  };

  const naturalSortToken = (a, b) =>
    (a.service_token_number || '').localeCompare(
      b.service_token_number || '',
      undefined,
      { numeric: true, sensitivity: 'base' }
    );

  useEffect(() => {
    axiosInstance
      .get('inverters/', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setInverters(res.data.results || []));
    axiosInstance
      .get('service-statuses/', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setStatuses(res.data.results || []));
    fetchRecords(currentPage);
  }, [token, currentPage]);

  // const fetchRecords = (page) => {
  //   axiosInstance
  //     .get(`service-records/?page=${page}`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     })
  //     .then((res) => {
  //       setRecords(res.data.results || []);
  //       setCount(res.data.count || 0);
  //     });
  // };

  const fetchRecords = (page) => {
    axiosInstance
      .get(`service-records/?page=${page}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const sortedResults = [...(res.data.results || [])].sort(
          naturalSortToken
        );
        setRecords(sortedResults);
        setCount(res.data.count || 0);
      });
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editingId
      ? axiosInstance.put(`service-records/${editingId}/`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        })
      : axiosInstance.post('service-records/', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });

    request
      .then(() => {
        alert('Service record saved successfully');
        setFormData({
          service_token_number: '',
          inverter_id: '',
          date_of_service: '',
          problem: '',
          repair_done: '',
          status: '',
          distance_travelled: '',
          hours_spent_on_travel: '',
          warranty_claim: '',
          hours_spent_on_site: '',
          base: '',
          service_location: '',
        });
        setEditingId(null);
        fetchRecords(currentPage);
      })
      .catch((err) => console.error('Error:', err));
  };

  const handleEdit = (record) => {
    setFormData({
      ...record,
      inverter_id: record.inverter_id,
      status: record.status,
      date_of_service: record.date_of_service ? record.date_of_service.split('T')[0] : '',
    });
    setEditingId(record.id);
  };

  return (
    <div className="container my-4">
      <h2 className="h4 mb-4">🔧 Add or Update Service Record</h2>

      <form onSubmit={handleSubmit} className="card p-4 mb-4">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td>
                <label>Service Token Number</label>
              </td>
              <td>
                <input
                  name="service_token_number"
                  value={formData.service_token_number}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
              <td>
                <label>Inverter</label>
              </td>
              <td>
                <select
                  name="inverter_id"
                  value={formData.inverter_id}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">-- Select Inverter --</option>
                  {inverters.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.unit_id}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>
                <label>Date of Service</label>
              </td>
              <td>
                <div className="position-relative">
                  <input
                    type="date"
                    id="date_of_service"
                    name="date_of_service"
                    value={formData.date_of_service}
                    onChange={(e) => {
                      handleChange(e);
                     
                    }}
                    className="form-control pe-5"
                  />
                  <span
                    onClick={() =>
                      document.getElementById('date_of_service')?.showPicker?.()
                    }
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ cursor: 'pointer', color: '#999' }}
                  >
                    📅
                  </span>
                </div>
              </td>
              <td>
                <label>Status</label>
              </td>
              <td>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">-- Select Status --</option>
                  {statuses.map((stat) => (
                    <option key={stat.id} value={stat.id}>
                      {stat.service_status_name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
            <tr>
              <td>
                <label>Active Issue</label>
              </td>
              <td>
                <textarea
                  name="problem"
                  value={formData.problem}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
              <td>
                <label>Rectified Issue</label>
              </td>
              <td>
                <input
                  name="repair_done"
                  value={formData.repair_done}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Distance Travelled</label>
              </td>
              <td>
                <input
                  name="distance_travelled"
                  value={formData.distance_travelled}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
              <td>
                <label>Hours on Travel</label>
              </td>
              <td>
                <input
                  name="hours_spent_on_travel"
                  value={formData.hours_spent_on_travel}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Warranty Claim</label>
              </td>
              <td>
                <select
                  name="warranty_claim"
                  value={formData.warranty_claim}
                  onChange={handleChange}
                  className="form-select"
                >
                  <option value="">-- Select --</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </td>
              <td>
                <label>Hours on Site</label>
              </td>
              <td>
                <input
                  name="hours_spent_on_site"
                  value={formData.hours_spent_on_site}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
            </tr>
            <tr>
              <td>
                <label>Base</label>
              </td>
              <td>
                <input
                  name="base"
                  value={formData.base}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
              <td>
                <label>Service Location</label>
              </td>
              <td>
                <input
                  name="service_location"
                  value={formData.service_location}
                  onChange={handleChange}
                  className="form-control"
                />
              </td>
            </tr>
          </tbody>
        </table>

        <div className="text-end mt-3">
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Add'} Service Record
          </button>
        </div>
      </form>

      <h3 className="h5 mb-3">📋 Service Records List</h3>

      <div className="table-responsive">
        <table className="table table-striped table-bordered text-center">
          <thead className="table-light">
            <tr>
              <th>Token</th>
              <th>Inverter</th>
              <th>Service Date</th>
              <th>Problem</th>
              <th>Repair</th>
              <th>Status</th>
              <th>Distance Travelled</th>
              <th>Hours on Travel</th>
              <th>Warranty Claim</th>
              <th>Hours on Site</th>
              <th>Base</th>
              <th>Service Location</th>
              <th>Edit</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr key={record.id}>
                <td>{record.service_token_number}</td>
                <td>{record.inverter_name}</td>
                <td>{new Date(record.date_of_service).toLocaleDateString()}</td>
                <td>{record.problem}</td>
                <td>{record.repair_done}</td>
                <td>{record.status_name}</td>
                <td>{record.distance_travelled || '-'}</td>
                <td>{record.hours_spent_on_travel || '-'}</td>
                <td>{record.warranty_claim || '-'}</td>
                <td>{record.hours_spent_on_site || '-'}</td>
                <td>{record.base || '-'}</td>
                <td>{record.service_location || '-'}</td>
                <td>
                  <button
                    onClick={() => handleEdit(record)}
                    className="btn btn-sm btn-outline-primary"
                  >
                    <i className="fas fa-pen"></i>

                  </button>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="btn btn-sm btn-outline-danger"
                  >
                     <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-center gap-2 mt-4">
        {Array.from({ length: Math.ceil(count / pageSize) }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`btn btn-sm ${
              currentPage === i + 1 ? 'btn-primary' : 'btn-outline-primary'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServiceRecordsForm;
