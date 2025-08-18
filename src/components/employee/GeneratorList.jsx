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

const GeneratorList = () => {
  const [generators, setGenerators] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [nextPage, setNextPage] = useState(null);
  const [prevPage, setPrevPage] = useState(null);
  const [count, setCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // ✅ Added search state
  const pageSize = 10;

  const fetchGenerators = async (page = 1) => {
    try {
      const res = await axiosInstance.get(`/generators/?page=${page}`);
      setGenerators(res.data.results || []);
      setNextPage(res.data.next);
      setPrevPage(res.data.previous);
      setCurrentPage(page);
      setCount(res.data.count || 0);
    } catch (error) {
      console.error(
        'Error fetching generators:',
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    fetchGenerators();
  }, []);

  const handleEdit = (generator) => {
    setEditingId(generator.id);
    setEditData({ ...generator });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      await axiosInstance.patch(`/generators/${editingId}/`, editData);
      alert('Generator updated successfully');
      setEditingId(null);
      fetchGenerators(currentPage);
    } catch (error) {
      console.error('Update failed', error);
      alert('Update failed');
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this generator?'
    );
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/generators/${id}/`);
      alert('Generator deleted successfully.');
      fetchGenerators(currentPage); // refresh list
    } catch (error) {
      console.error('Delete failed:', error);
      alert('Delete failed.');
    }
  };

  const goToNextPage = () => {
    if (nextPage) {
      const nextPageNum = new URL(nextPage).searchParams.get('page');
      fetchGenerators(nextPageNum);
    }
  };

  const goToPrevPage = () => {
    if (prevPage) {
      const prevPageNum = new URL(prevPage).searchParams.get('page');
      fetchGenerators(prevPageNum);
    }
  };

  // ✅ Filtered generator list
  const filteredGenerators = generators.filter((gen) => {
    const query = searchQuery.toLowerCase();
    return (
      gen.generator_no?.toLowerCase().includes(query) ||
      gen.generator_size?.toString().toLowerCase().includes(query) ||
      gen.fuel_consumption?.toString().toLowerCase().includes(query)
    );
  });

  return (
    <div className="max-w-7xl mx-auto mt-10 px-4">
      <MDBCard className="shadow-sm mb-4">
        <MDBCardBody>
          <MDBCardTitle className="text-primary fw-bold fs-4 mb-3">
            🔌 Generator List
          </MDBCardTitle>

          {/* ✅ Search Input */}
          <input
            type="text"
            placeholder="Search by Generator No, Size or Fuel Consumption"
            className="form-control mb-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {filteredGenerators.length === 0 ? (
            <p className="text-muted text-center">No generators found.</p>
          ) : (
            <div className="table-responsive">
              <MDBTable hover bordered align="middle">
                <MDBTableHead light>
                  <tr>
                    <th>Si. No</th>
                    <th>Generator No</th>
                    <th>Size</th>
                    <th>Fuel Consumption</th>
                    <th>Edit</th>
                    <th>Delete</th>
                  </tr>
                </MDBTableHead>
                <MDBTableBody>
                  {filteredGenerators.map((gen, index) => {
                    const serialNumber =
                      (currentPage - 1) * pageSize + index + 1;
                    return (
                      <tr key={gen.id}>
                        {editingId === gen.id ? (
                          <>
                            <td>{serialNumber}</td>
                            <td>
                              <input
                                name="generator_no"
                                value={editData.generator_no}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td>
                              <input
                                name="generator_size"
                                value={editData.generator_size}
                                onChange={handleChange}
                                className="form-control"
                              />
                            </td>
                            <td>
                              <input
                                name="fuel_consumption"
                                value={editData.fuel_consumption}
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
                            <td>{gen.generator_no}</td>
                            <td>{gen.generator_size}</td>
                            <td>{gen.fuel_consumption}</td>
                            <td className="text-center">
                              <MDBBtn
                                size="sm"
                                color="info"
                                className="text-white"
                                onClick={() => handleEdit(gen)}
                              >
                                <Pencil size={16} />
                              </MDBBtn>
                            </td>
                            <td className="text-center">
                              <MDBBtn
                                size="sm"
                                color="danger"
                                onClick={() => handleDelete(gen.id)}
                              >
                                Delete
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
      <div className="d-flex justify-between items-center px-2 mb-5">
        <p className="text-muted">
          Showing {(currentPage - 1) * pageSize + 1} -{' '}
          {Math.min(currentPage * pageSize, count)} of {count}
        </p>
        <div className="d-flex gap-2">
          <MDBBtn
            size="sm"
            color="light"
            disabled={!prevPage}
            onClick={goToPrevPage}
          >
            ⬅ Prev
          </MDBBtn>
          <MDBBtn
            size="sm"
            color="light"
            disabled={!nextPage}
            onClick={goToNextPage}
          >
            Next ➡
          </MDBBtn>
        </div>
      </div>
    </div>
  );
};

export default GeneratorList;
