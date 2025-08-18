import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../api/axiosInstance';
import { MDBBtn } from 'mdb-react-ui-kit';

const sections = [
  {
    title: 'Physical Checks',
    items: [
      'Check The History & Service records',
      'Inspect external enclosure for damage (dents, cracks, or corrosion).',
      'Ensure all input/output sockets are intact',
      'Confirm no loose or exposed wiring.',
      'Verify lifting points and transport fittings are secure',
    ],
  },
  {
    title: 'Battery System',
    items: [
      'Check battery charge level',
      'Inspect battery terminals for corrosion or loose connections',
      'Confirm battery management system (BMS) is operational',
      'Ensure no signs of leakage',
    ],
  },
  {
    title: 'Electrical and Control Systems',
    items: [
      'Test inverter functionality for AC power conversion',
      'Check GSM remote monitoring system connectivity.',
      'Test automatic generator start signal and bypass functionality.',
      'Test short circuit, overload, overtemperature, and low battery protections.',
      'Finder Timer is disconnected - FL 8',
    ],
  },
  {
    title: 'Load Test',
    items: [
      'Test Time Start',
      'Test Time End',
      'Load',
      'Battery Voltage at Start',
      'Battery Voltage at End',
      'Lowest Battery Voltage Dip',
    ],
  },
];

const statusOptions = ['OK', 'NOT OK', 'NA'];

const calculateTestTime = (start, end) => {
  try {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    let startDate = new Date(0, 0, 0, sh, sm);
    let endDate = new Date(0, 0, 0, eh, em);
    if (endDate < startDate) endDate.setDate(endDate.getDate() + 1);
    const diffMin = Math.floor((endDate - startDate) / 60000);
    const hours = String(Math.floor(diffMin / 60)).padStart(2, '0');
    const minutes = String(diffMin % 60).padStart(2, '0');
    return `${hours}:${minutes}:00`;
  } catch {
    return '';
  }
};

function naturalSort(a, b) {
  // Convert to string just in case
  const unitA = a.unit_no.toString();
  const unitB = b.unit_no.toString();

  // Use localeCompare with numeric option for natural ordering
  return unitA.localeCompare(unitB, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

const ChecklistForm = () => {
  const [formData, setFormData] = useState({});
  const [batteryVoltages, setBatteryVoltages] = useState({});
  const [testTime, setTestTime] = useState('');
  const [submittedChecklists, setSubmittedChecklists] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedChecklistId, setExpandedChecklistId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    const start = formData['Load Test-0']?.status || '';
    const end = formData['Load Test-1']?.status || '';
    setTestTime(calculateTestTime(start, end));
  }, [formData]);

  useEffect(() => {
    fetchChecklists(currentPage);
  }, [currentPage]);

  // const fetchChecklists = async (page = 1) => {
  //   try {
  //     const response = await axiosInstance.get(`/checklists/?page=${page}`);
  //     setSubmittedChecklists(response.data.results);
  //     setTotalPages(Math.ceil(response.data.count / 10));
  //   } catch (error) {
  //     console.error('Failed to fetch checklists:', error);
  //   }
  // };

  const fetchChecklists = async (page = 1) => {
    try {
      const response = await axiosInstance.get(`/checklists/?page=${page}`);
      const sortedResults = [...response.data.results].sort(naturalSort);
      setSubmittedChecklists(sortedResults);
      setTotalPages(Math.ceil(response.data.count / 10));
    } catch (error) {
      console.error('Failed to fetch checklists:', error);
    }
  };

  const handleChange = (section, index, field, value) => {
    const key = `${section}-${index}`;
    setFormData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }));
  };

  const handleBatteryChange = (index, value) => {
    setBatteryVoltages((prev) => ({ ...prev, [index]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const items = [];

      Object.entries(formData).forEach(([key, value]) => {
        if (key.startsWith('footer') || key.startsWith('unit')) return;
        const [section, index] = key.split('-');
        const description =
          sections.find((s) => s.title === section)?.items[index] || '';

        if (
          section !== 'Load Test' ||
          ![
            'Test Time Start',
            'Test Time End',
            'Load',
            'Battery Voltage at Start',
            'Battery Voltage at End',
            'Lowest Battery Voltage Dip',
          ].includes(description)
        ) {
          items.push({
            section,
            description,
            status: value.status || '',
            remarks: value.remarks || '',
          });
        }
      });

      const formatToFullTime = (t) => (t.length === 5 ? `${t}:00` : t);

      const checklistData = {
        unit_no: formData['unit-0']?.unit_no || '',
        unit_model: formData['unit-1']?.unit_model || '',
        test_time_start: formatToFullTime(
          formData['Load Test-0']?.status || ''
        ),
        test_time_end: formatToFullTime(formData['Load Test-1']?.status || ''),
        load: formData['Load Test-2']?.status || '',
        battery_voltage_start: formData['Load Test-3']?.status || '',
        battery_voltage_end: formData['Load Test-4']?.status || '',
        voltage_dip: formData['Load Test-5']?.status || '',
        unit_status: formData['footer-3']?.unit_status || '',
        tested_by: formData['footer-0']?.tested_by || '',
        date:
          formData['footer-1']?.date || new Date().toISOString().split('T')[0],
        items,
        batteries: Object.entries(batteryVoltages).map(
          ([battery_number, voltage]) => ({
            battery_number: parseInt(battery_number),
            voltage: parseFloat(voltage),
          })
        ),
      };

      await axiosInstance.post('/checklists/', checklistData);

      alert('Checklist submitted successfully!');

      setFormData({});
      setBatteryVoltages({});
      setTestTime('');
      fetchChecklists(currentPage);
    } catch (error) {
      console.error('Error submitting checklist:', error);
      alert('Submission failed. Please try again.');
    }
  };

  const toggleChecklistDetails = (id) => {
    setExpandedChecklistId((prevId) => (prevId === id ? null : id));
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <form onSubmit={handleSubmit}>
        <h2 className="text-center text-2xl font-bold mb-6 bg-green-500 text-white py-2">
          Pre Hire Checklist
        </h2>

        <table className="w-full table-auto border border-gray-400 bg-white">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left">Question</th>
              <th className="border px-4 py-2 text-left">Status</th>
              <th className="border px-4 py-2 text-left">Remarks</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-4 py-2 font-semibold">Unit No</td>
              <td colSpan={2}>
                <input
                  className="w-full px-2 py-1 border"
                  value={formData['unit-0']?.unit_no || ''}
                  onChange={(e) =>
                    handleChange('unit', 0, 'unit_no', e.target.value)
                  }
                />
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-semibold">Unit Model</td>
              <td colSpan={2}>
                <input
                  className="w-full px-2 py-1 border"
                  value={formData['unit-1']?.unit_model || ''}
                  onChange={(e) =>
                    handleChange('unit', 1, 'unit_model', e.target.value)
                  }
                />
              </td>
            </tr>

            {sections.map((section, sIdx) => (
              <React.Fragment key={sIdx}>
                {/* <tr className="bg-yellow-200 font-semibold">
                  <td colSpan={3} className="px-4 py-2">
                    {section.title}
                  </td>
                </tr> */}
                <tr className="bg-light">
                  <td colSpan={3} className="fw-bold px-3 py-2 text-dark">
                    {section.title}
                  </td>
                </tr>

                {section.items.map((item, iIdx) => (
                  <tr key={iIdx}>
                    <td className="border px-4 py-2">{item}</td>
                    <td className="border px-4 py-2">
                      {section.title === 'Load Test' ? (
                        <input
                          type={
                            item.toLowerCase().includes('time')
                              ? 'time'
                              : 'text'
                          }
                          className="w-full px-2 py-1 border"
                          value={
                            formData[`${section.title}-${iIdx}`]?.status || ''
                          }
                          onChange={(e) =>
                            handleChange(
                              section.title,
                              iIdx,
                              'status',
                              e.target.value
                            )
                          }
                        />
                      ) : (
                        <select
                          className="w-full px-2 py-1 border"
                          value={
                            formData[`${section.title}-${iIdx}`]?.status || ''
                          }
                          onChange={(e) =>
                            handleChange(
                              section.title,
                              iIdx,
                              'status',
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select</option>
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      <input
                        className="w-full px-2 py-1 border"
                        placeholder="Remarks"
                        value={
                          formData[`${section.title}-${iIdx}`]?.remarks || ''
                        }
                        onChange={(e) =>
                          handleChange(
                            section.title,
                            iIdx,
                            'remarks',
                            e.target.value
                          )
                        }
                      />
                    </td>
                  </tr>
                ))}

                {section.title === 'Battery System' && (
                  <>
                    {/* <tr className="bg-blue-100 font-semibold">
                      <td colSpan={3}>Battery Voltages</td>
                    </tr> */}
                    <tr className="bg-light">
                      <td colSpan={3} className="fw-bold px-3 py-2 text-dark">
                        Battery Voltages
                      </td>
                    </tr>
                    {Array.from({ length: 25 }, (_, i) => (
                      <tr key={`battery-${i + 1}`}>
                        <td className="border px-4 py-2">{`Battery ${
                          i + 1
                        }`}</td>
                        <td colSpan={2} className="border px-4 py-2">
                          <input
                            type="text"
                            className="w-full px-2 py-1 border"
                            placeholder="Enter Voltage"
                            value={batteryVoltages[i + 1] || ''}
                            onChange={(e) =>
                              handleBatteryChange(i + 1, e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}

            {/* Footer Section */}
            <tr>
              <td className="border px-4 py-2 font-semibold">Tested By</td>
              <td colSpan={2}>
                <input
                  className="w-full px-2 py-1 border"
                  value={formData['footer-0']?.tested_by || ''}
                  onChange={(e) =>
                    handleChange('footer', 0, 'tested_by', e.target.value)
                  }
                />
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-semibold">Date</td>
              <td colSpan={2}>
                <input
                  type="date"
                  className="w-full px-2 py-1 border"
                  value={formData['footer-1']?.date || ''}
                  onChange={(e) =>
                    handleChange('footer', 1, 'date', e.target.value)
                  }
                />
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-semibold">Test Time</td>
              <td colSpan={2} className="border px-4 py-2 text-gray-800">
                {testTime || '—'}
              </td>
            </tr>
            <tr>
              <td className="border px-4 py-2 font-semibold">Unit Status</td>
              <td colSpan={2}>
                <select
                  className="w-full px-2 py-1 border"
                  value={formData['footer-3']?.unit_status || ''}
                  onChange={(e) =>
                    handleChange('footer', 3, 'unit_status', e.target.value)
                  }
                >
                  <option value="">Select Status</option>
                  <option value="Ready for Hire">Ready for Hire</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>

        {/* <div className="mt-6 text-right">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Submit
          </button>
        </div> */}

        <div className="mt-6">
          <MDBBtn
            type="submit"
            className="mt-3"
            style={{
              backgroundColor: 'rgb(13, 110, 253)',
              color: '#ffffff',
            }}
          >
            Submit
          </MDBBtn>
        </div>
      </form>

      {/* ✅ Submitted Checklists Table */}
      <div className="mt-5 bg-white shadow-md rounded">
        <h3 className="text-lg font-semibold mb-4">Submitted Checklists</h3>

        <table className="w-full border table-auto">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-2 py-1">Unit No</th>
              <th className="border px-2 py-1">Tested By</th>
              <th className="border px-2 py-1">Date</th>
              <th className="border px-2 py-1">Status</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {submittedChecklists.map((checklist) => (
              <React.Fragment key={checklist.id}>
                <tr>
                  <td className="border px-2 py-1">{checklist.unit_no}</td>
                  <td className="border px-2 py-1">{checklist.tested_by}</td>
                  <td className="border px-2 py-1">{checklist.date}</td>
                  <td className="border px-2 py-1">{checklist.unit_status}</td>
                  <td className="border px-2 py-1 text-center">
                    {/* <button
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                      onClick={() => toggleChecklistDetails(checklist.id)}
                    >
                      {expandedChecklistId === checklist.id ? 'Hide' : 'View'}
                    </button> */}
                    <MDBBtn
                      size="sm"
                      style={{
                        backgroundColor: 'rgb(13, 110, 253)',
                        color: '#ffffff',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.375rem',
                      }}
                      onClick={() => toggleChecklistDetails(checklist.id)}
                    >
                      {expandedChecklistId === checklist.id ? 'Hide' : 'View'}
                    </MDBBtn>
                  </td>
                </tr>

                {expandedChecklistId === checklist.id && (
                  <tr>
                    <td colSpan={5} className="border px-4 py-2 bg-gray-50">
                      <div className="text-left text-sm space-y-2">
                        <p>
                          <strong>Model:</strong> {checklist.unit_model}
                        </p>
                        <p>
                          <strong>Load:</strong> {checklist.load}
                        </p>
                        <p>
                          <strong>Battery Start:</strong>{' '}
                          {checklist.battery_voltage_start}
                        </p>
                        <p>
                          <strong>Battery End:</strong>{' '}
                          {checklist.battery_voltage_end}
                        </p>
                        <p>
                          <strong>Voltage Dip:</strong> {checklist.voltage_dip}
                        </p>
                        <p>
                          <strong>Test Time Start:</strong>{' '}
                          {checklist.test_time_start}
                        </p>
                        <p>
                          <strong>Test Time End:</strong>{' '}
                          {checklist.test_time_end}
                        </p>
                        <p>
                          <strong>Calculated Test Time:</strong>{' '}
                          {calculateTestTime(
                            checklist.test_time_start?.slice(0, 5) || '',

                            checklist.test_time_end?.slice(0, 5) || ''
                          )}
                        </p>

                        {checklist.items?.length > 0 && (
                          <div>
                            <strong>Checklist Items:</strong>
                            <ul className="list-disc ml-6">
                              {checklist.items.map((item, index) => (
                                <li key={index}>
                                  <span className="font-medium">
                                    {item.section}:
                                  </span>{' '}
                                  {item.description} – <em>{item.status}</em>{' '}
                                  {item.remarks && `(${item.remarks})`}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {checklist.batteries?.length > 0 && (
                          <div className="mt-4">
                            <strong>Battery Voltages:</strong>

                            <table className="table-auto border border-gray-300 mt-2 w-full text-center text-sm">
                              <thead>
                                <tr className="bg-gray-200">
                                  <th className="border px-2 py-1">
                                    Battery No
                                  </th>

                                  <th className="border px-2 py-1">Voltage</th>
                                </tr>
                              </thead>

                              <tbody>
                                {checklist.batteries

                                  .sort(
                                    (a, b) =>
                                      a.battery_number - b.battery_number
                                  )

                                  .map((battery, index) => (
                                    <tr key={index}>
                                      <td className="border px-2 py-1">
                                        Battery {battery.battery_number}
                                      </td>

                                      <td className="border px-2 py-1">
                                        {battery.voltage}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 rounded ${
                currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChecklistForm;
