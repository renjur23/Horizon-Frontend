import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import {
  MDBCard,
  MDBCardBody,
  MDBCardHeader,
  MDBBtn,
  MDBTextArea,
} from 'mdb-react-ui-kit';

const AddInverterForm = () => {
  const [formData, setFormData] = useState({
    unit_id: '',
    model: '',
    given_name: '',
    given_start_name: '',
    serial_no: '',
    inverter_status: '',
    remarks: '',
    link_to_installation: '',
  });

  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const response = await axiosInstance.get('/inverter-statuses/');
        setStatuses(response.data.results || []);
      } catch (error) {
        console.error('Failed to fetch inverter statuses', error);
      }
    };
    fetchStatuses();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const postData = {
        ...formData,
        inverter_status_input: formData.inverter_status,
      };
      delete postData.inverter_status;

      await axiosInstance.post('/inverters/', postData);
      alert('Inverter added successfully!');
      setFormData({
        unit_id: '',
        model: '',
        given_name: '',
        given_start_name: '',
        serial_no: '',
        inverter_status: '',
        remarks: '',
        link_to_installation: '',
      });
    } catch (error) {
      console.error(
        'Failed to add inverter:',
        error.response?.data || error.message
      );
      alert('Failed to add inverter. Please try again.');
    }
  };

  return (
    <MDBCard className="my-5 mx-auto" style={{ maxWidth: '600px' }}>
      <MDBCardHeader className="bg-primary text-white text-center">
        <h4 className="fw-bold mb-0">Add Battery</h4>
      </MDBCardHeader>
      <MDBCardBody>
        <form onSubmit={handleSubmit}>
          {[
            { name: 'unit_id', label: 'Unit ID' },
            { name: 'model', label: 'Model' },
            { name: 'given_name', label: 'Given Name' },
            { name: 'given_start_name', label: 'Given Start Name' },
            { name: 'serial_no', label: 'Serial Number' },
            { name: 'link_to_installation', label: 'Link to Installation' },
          ].map(({ name, label }) => (
            <div className="mb-3" key={name}>
              <label htmlFor={name} className="form-label">
                {label}
              </label>
              <input
                id={name}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                className="form-control"
                required={name !== 'link_to_installation'} // optional for this field
              />
            </div>
          ))}

          {/* Inverter Status */}
          <div className="mb-3">
            <label htmlFor="inverter_status" className="form-label">
              Inverter Status
            </label>
            <select
              id="inverter_status"
              name="inverter_status"
              value={formData.inverter_status}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select Inverter Status</option>
              {statuses.map((status, index) => (
                <option
                  key={`${status.inverter_status_name}-${index}`}
                  value={status.inverter_status_name}
                >
                  {status.inverter_status_name}
                </option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="mb-4">
            <label htmlFor="remarks" className="form-label">
              Remarks
            </label>
            <MDBTextArea
              id="remarks"
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows={3}
              className="form-control"
            />
          </div>

          <MDBBtn type="submit" color="success" block>
            Submit
          </MDBBtn>
        </form>
      </MDBCardBody>
    </MDBCard>
  );
};

export default AddInverterForm;
