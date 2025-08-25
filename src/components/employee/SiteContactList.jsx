import React, { useEffect, useState } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Pencil } from 'lucide-react';
import {
  MDBCard,
  MDBCardBody,
  MDBBtn,
  MDBTable,
  MDBTableHead,
  MDBTableBody,
} from 'mdb-react-ui-kit';

const SiteContactList = () => {
  const [contacts, setContacts] = useState([]);
  const [formData, setFormData] = useState({
    site_contact_name: '',
    site_contact_email: '',
    site_contact_number: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [count, setCount] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    site_contact_name: '',
    site_contact_email: '',
    site_contact_number: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const fetchContacts = async (page = 1) => {
    try {
      const res = await axiosInstance.get(`/site-contacts/?page=${page}`);
      setContacts(res.data.results);
      setCount(res.data.count);
    } catch (err) {
      console.error('Failed to fetch site contacts', err);
    }
  };

  useEffect(() => {
    fetchContacts(currentPage);
  }, [currentPage]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('/site-contacts/', formData);
      setFormData({
        site_contact_name: '',
        site_contact_email: '',
        site_contact_number: '',
      });
      fetchContacts(currentPage);
      setSuccessMessage('✅ Site contact details added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error adding contact', err);
    }
  };

  const handleEditClick = (contact) => {
    setEditingId(contact.id);
    setEditData({
      site_contact_name: contact.site_contact_name,
      site_contact_email: contact.site_contact_email,
      site_contact_number: contact.site_contact_number,
    });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSaveEdit = async (id) => {
    try {
      await axiosInstance.put(`/site-contacts/${id}/`, editData);
      setEditingId(null);
      fetchContacts(currentPage);
    } catch (err) {
      console.error('Error updating contact', err);
    }
  };

  const handleDeleteContact = async (id) => {
    try {
      await axiosInstance.delete(`/site-contacts/${id}/`);
      fetchContacts(currentPage); // refresh list
    } catch (err) {
      console.error('Error deleting contact', err);
    }
  };

  const totalPages = Math.ceil(count / 10);

  return (
    <div className="p-4">
      <MDBCard className="mb-4 shadow-sm">
        <MDBCardBody>
          {/* Updated Heading Above Form */}
          <h4 className="text-primary fw-bold mb-2">Add Site Contact</h4>
          <h6 className="text-muted mb-4">
            Fill out the form below to add a new site contact
          </h6>

          <form onSubmit={handleAddContact}>
            <div className="mb-3">
              <label htmlFor="site_contact_name" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="site_contact_name"
                name="site_contact_name"
                value={formData.site_contact_name}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="mb-3">
              <label htmlFor="site_contact_email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="site_contact_email"
                name="site_contact_email"
                value={formData.site_contact_email}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="site_contact_number" className="form-label">
                Contact Number
              </label>
              <input
                type="text"
                id="site_contact_number"
                name="site_contact_number"
                value={formData.site_contact_number}
                onChange={handleChange}
                required
                className="form-control"
              />
            </div>
            <MDBBtn type="submit" color="primary" className="w-100">
              Add Contact
            </MDBBtn>
          </form>

          {successMessage && (
            <div className="alert alert-success mt-3" role="alert">
              {successMessage}
            </div>
          )}
        </MDBCardBody>
      </MDBCard>

      <MDBCard className="shadow-sm">
        <MDBCardBody>
          <h5 className="text-secondary fw-bold mb-3">Site Contacts</h5>
          <div className="table-responsive">
            <MDBTable bordered hover align="middle">
              <MDBTableHead>
                <tr>
                  <th>SI</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Number</th>
                  <th>Actions</th>
                </tr>
              </MDBTableHead>
              <MDBTableBody>
                {contacts.map((contact, index) => (
                  <tr key={contact.id}>
                    <td>{(currentPage - 1) * 10 + index + 1}</td>
                    <td>
                      {editingId === contact.id ? (
                        <input
                          name="site_contact_name"
                          value={editData.site_contact_name}
                          onChange={handleEditChange}
                          className="form-control"
                        />
                      ) : (
                        contact.site_contact_name
                      )}
                    </td>
                    <td>
                      {editingId === contact.id ? (
                        <input
                          name="site_contact_email"
                          type="email"
                          value={editData.site_contact_email}
                          onChange={handleEditChange}
                          className="form-control"
                        />
                      ) : (
                        contact.site_contact_email
                      )}
                    </td>
                    <td>
                      {editingId === contact.id ? (
                        <input
                          name="site_contact_number"
                          value={editData.site_contact_number}
                          onChange={handleEditChange}
                          className="form-control"
                        />
                      ) : (
                        contact.site_contact_number
                      )}
                    </td>
                    <td className="d-flex gap-2">
                      {editingId === contact.id ? (
                        <MDBBtn
                          size="sm"
                          color="success"
                          onClick={() => handleSaveEdit(contact.id)}
                        >
                          Save
                        </MDBBtn>
                      ) : (
                        <MDBBtn
                          size="sm"
                          color="warning"
                          onClick={() => handleEditClick(contact)}
                          className="text-white"
                        >
                          <i className="fas fa-pen"></i>

                        </MDBBtn>
                      )}
                      <MDBBtn
                        size="sm"
                        color="danger"
                        onClick={() => handleDeleteContact(contact.id)}
                      >
                        <i className="fas fa-trash"></i>
                      </MDBBtn>
                    </td>
                  </tr>
                ))}
              </MDBTableBody>
            </MDBTable>
          </div>
        </MDBCardBody>
      </MDBCard>

      {/* Pagination */}
      <div className="mt-4 d-flex justify-content-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <MDBBtn
            key={i}
            size="sm"
            color={currentPage === i + 1 ? 'primary' : 'light'}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </MDBBtn>
        ))}
      </div>
    </div>
  );
};

export default SiteContactList;
