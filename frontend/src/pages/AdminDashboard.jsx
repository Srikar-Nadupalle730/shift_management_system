import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import ShiftCalendar from '../components/ShiftCalendar';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [isEmployeeModalOpen, setEmployeeModalOpen] = useState(false);
  const [isAssignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [isAssignmentEditMode, setAssignmentEditMode] = useState(false);
  const [assignmentEditTargetId, setAssignmentEditTargetId] = useState(null);
  const [isCredentialModalOpen, setCredentialModalOpen] = useState(false);
  const [credentialTarget, setCredentialTarget] = useState(null);
  const [credentialData, setCredentialData] = useState({ new_password: '' });
  const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', password: '', department: '', role: '' });
  const [editMode, setEditMode] = useState(false);
  const [editTargetId, setEditTargetId] = useState(null);
  const [assignmentData, setAssignmentData] = useState({ employee: '', shift: 'General', start_date: '', end_date: '', follow_rotation: 0, initial_shift: 'General' });
  const [assignmentType, setAssignmentType] = useState('General');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState({ totalEmployees: 0, dayShift: 0, nightShift: 0, rotational: 0 });
  const [isRotating, setIsRotating] = useState(false);
  const [rotationStatus, setRotationStatus] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      // Automatically synchronize shift rotations in the background on load
      try {
        await api.post('/method/shift_management.api.rotate_shifts');
      } catch (err) {
        console.error('Error auto-rotating shifts:', err);
      }

      const empRes = await api.get('/resource/Shift Employee?fields=["name","employee_id","first_name","last_name","email","department","role"]&limit_page_length=100&order_by=department asc');
      setEmployees(empRes.data.data || []);
      
      const shiftRes = await api.get('/resource/Work Shift?fields=["name","shift_name","start_time","end_time","is_rotational"]');
      setShifts(shiftRes.data.data || []);
      
      const assRes = await api.get('/resource/Shift Assignment?fields=["name","employee","shift","start_date","end_date","follow_rotation","initial_shift"]&limit_page_length=100');
      // Enriched assignments with employee names for calendar
      const enrichedAssignments = (assRes.data.data || []).map(ass => {
        const emp = (empRes.data.data || []).find(e => e.employee_id === ass.employee);
        return {
          ...ass,
          employee_name: emp ? `${emp.first_name} ${emp.last_name}` : ass.employee
        };
      });
      setAssignments(enrichedAssignments);
      
      // Calculate Stats
      const statsObj = {
        totalEmployees: empRes.data.data?.length || 0,
        dayShift: enrichedAssignments.filter(a => a.shift === 'General').length,
        nightShift: enrichedAssignments.filter(a => a.shift === 'Night').length,
        rotational: enrichedAssignments.filter(a => a.follow_rotation).length
      };
      setStats(statsObj);

      const rotRes = await api.get('/method/shift_management.api.get_rotation_status');
      setRotationStatus(rotRes.data.message || []);
    } catch (err) {
      console.error(err);
    }
  };



  const openAddEmployeeModal = () => {
    setEditMode(false);
    setEditTargetId(null);
    setFormData({ first_name: '', last_name: '', email: '', password: '', department: '', role: '' });
    setError('');
    setEmployeeModalOpen(true);
  };

  const openEditEmployeeModal = (emp) => {
    setEditMode(true);
    setEditTargetId(emp.name);
    setFormData({ 
      first_name: emp.first_name || '', 
      last_name: emp.last_name || '', 
      email: emp.email || '', 
      password: '*****', // Placeholder
      department: emp.department || '', 
      role: emp.role || '' 
    });
    setError('');
    setEmployeeModalOpen(true);
  };

  const handleSaveEmployee = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editMode) {
        await api.post('/method/shift_management.api.update_employee', {
          employee_id: editTargetId,
          ...formData
        });
      } else {
        await api.post('/method/shift_management.api.create_employee', formData);
      }
      setEmployeeModalOpen(false);
      fetchData();
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) {
        try {
          const parsed = JSON.parse(msg);
          const inner = JSON.parse(parsed[0]);
          setError(inner.message);
        } catch { setError('Error saving employee.'); }
      } else {
        setError('Error saving employee.');
      }
      console.error(err.response?.data || err);
    }
  };

  const openAddAssignmentModal = () => {
    setAssignmentEditMode(false);
    setAssignmentEditTargetId(null);
    setAssignmentData({ employee: '', shift: 'General', start_date: '', end_date: '', follow_rotation: 0, initial_shift: 'General' });
    setAssignmentType('General');
    setError('');
    setAssignmentModalOpen(true);
  };

  const openEditAssignmentModal = (ass) => {
    setAssignmentEditMode(true);
    setAssignmentEditTargetId(ass.name);
    setAssignmentData({
      employee: ass.employee,
      shift: ass.shift,
      start_date: ass.start_date,
      end_date: ass.end_date || '',
      follow_rotation: ass.follow_rotation || 0,
      initial_shift: ass.initial_shift || 'General'
    });
    if (ass.follow_rotation) {
      setAssignmentType('Rotational');
    } else {
      setAssignmentType(ass.shift || 'General');
    }
    setError('');
    setAssignmentModalOpen(true);
  };

  const handleSaveAssignment = async (e) => {
    e.preventDefault();
    try {
      // Clean up empty end_date to send null to Frappe
      const payload = { ...assignmentData };
      if (!payload.end_date) payload.end_date = null;
      
      if (assignmentType === 'Rotational') {
        payload.follow_rotation = 1;
        if (!payload.initial_shift) {
          payload.initial_shift = 'General';
        }
        // Force the initial active shift to be the selected starting shift when creating
        if (!isAssignmentEditMode) {
          payload.shift = payload.initial_shift;
        }
      } else {
        payload.follow_rotation = 0;
        payload.initial_shift = null;
        payload.shift = assignmentType; // 'General' or 'Night'
      }
      
      if (isAssignmentEditMode) {
        await api.put(`/resource/Shift Assignment/${assignmentEditTargetId}`, payload);
      } else {
        await api.post('/resource/Shift Assignment', payload);
      }
      
      setAssignmentModalOpen(false);
      fetchData();
      setAssignmentData({ employee: '', shift: 'General', start_date: '', end_date: '', follow_rotation: 0, initial_shift: 'General' });
      setError('');
    } catch (err) {
      const msg = err.response?.data?._server_messages;
      if (msg) {
        try {
          const parsed = JSON.parse(msg);
          const inner = JSON.parse(parsed[0]);
          setError(inner.message);
        } catch { setError('Error saving assignment'); }
      } else {
        setError('Error saving assignment');
      }
    }
  };

  const executeDeleteAssignment = async (name) => {
    try {
      await api.delete(`/resource/Shift Assignment/${name}`);
      fetchData();
      showToast('Shift assignment deleted successfully!', 'success');
    } catch (err) {
      showToast('Error deleting assignment', 'error');
      console.error(err.response?.data || err);
    }
  };

  const handleDeleteAssignment = (name) => {
    setConfirmConfig({
      message: 'Are you sure you want to delete this shift assignment?',
      onConfirm: () => executeDeleteAssignment(name)
    });
  };

  const executeDeleteEmployee = async (name) => {
    try {
      await api.post('/method/shift_management.api.delete_employee', { name });
      fetchData();
      showToast('Employee deleted successfully!', 'success');
    } catch (err) {
      showToast('Error deleting employee', 'error');
      console.error(err.response?.data || err);
    }
  };

  const handleDeleteEmployee = (name) => {
    setConfirmConfig({
      message: 'Are you sure you want to delete this employee and all their shift assignments?',
      onConfirm: () => executeDeleteEmployee(name)
    });
  };

  const openCredentialModal = (emp) => {
    setCredentialTarget(emp);
    setCredentialData({ new_password: '' });
    setSuccessMsg('');
    setCredentialModalOpen(true);
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    try {
      await api.post('/method/shift_management.api.update_employee_credentials', {
        employee_id: credentialTarget.employee_id,
        new_password: credentialData.new_password
      });
      setSuccessMsg('Password updated successfully!');
      setCredentialData({ new_password: '' });
      showToast('Password updated successfully!', 'success');
    } catch (err) {
      showToast('Error updating credentials', 'error');
      console.error(err.response?.data || err);
    }
  };

  // Group employees by department
  const groupedByDept = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(emp);
    return acc;
  }, {});

  // Group assignments by department
  const assignmentsByDept = assignments.reduce((acc, ass) => {
    const emp = employees.find(e => e.employee_id === ass.employee);
    const dept = emp ? (emp.department || 'Unassigned') : 'Unassigned';
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push({ ...ass, dept, emp_details: emp });
    return acc;
  }, {});

  const departments = Object.keys(groupedByDept).sort();
  const assignmentDepts = Object.keys(assignmentsByDept).sort();

  return (
    <div className="dashboard-grid animate-fade-in">
      <div className="sidebar">
        <ul className="sidebar-menu">
          <li>
            <a href="#" className={activeTab === 'employees' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('employees'); }}>
              👥 Employees
            </a>
          </li>
          <li>
            <a href="#" className={activeTab === 'shifts' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('shifts'); }}>
              🕐 Shifts
            </a>
          </li>
          <li>
            <a href="#" className={activeTab === 'assignments' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('assignments'); }}>
              📋 Assignments
            </a>
          </li>
          <li>
            <a href="#" className={activeTab === 'calendar' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('calendar'); }}>
              📅 Calendar
            </a>
          </li>
          <li>
            <a href="#" className={activeTab === 'rotation' ? 'active' : ''} onClick={(e) => { e.preventDefault(); setActiveTab('rotation'); }}>
              🔄 Rotation Status
            </a>
          </li>
        </ul>
      </div>
      <div className="dashboard-content">
        <div className="flex justify-between items-center mb-8 bg-surface p-4 rounded-lg border border-border">
          <div>
            <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
            <p className="text-muted" style={{ margin: 0 }}>Manage your workforce and schedules</p>
          </div>
          <div className="text-right">
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)' }}>
              {currentTime.toLocaleTimeString()}
            </div>
            <div className="text-muted">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card" style={{ borderTop: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.1 }}>👥</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Employees</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.totalEmployees}</div>
          </div>
          <div className="card" style={{ borderTop: '4px solid #818cf8', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.1 }}>☀️</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Day Shift (General)</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.dayShift}</div>
          </div>
          <div className="card" style={{ borderTop: '4px solid #fbbf24', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.1 }}>🌙</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Night Shift</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.nightShift}</div>
          </div>
          <div className="card" style={{ borderTop: '4px solid #34d399', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '4rem', opacity: 0.1 }}>⚙️</div>
            <div className="text-muted" style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>Rotational Cycle</div>
            <div style={{ fontSize: '2rem', fontWeight: 800 }}>{stats.rotational}</div>
          </div>
        </div>

        {activeTab === 'employees' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2>Employees</h2>
              <div className="flex gap-4">
                <button className="btn btn-primary" onClick={openAddEmployeeModal}>+ Add Employee</button>
              </div>
            </div>

            {departments.map(dept => (
              <div key={dept} className="mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{dept}</h3>
                  <span className="badge badge-general">{groupedByDept[dept].length} employee{groupedByDept[dept].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {groupedByDept[dept].map(emp => (
                        <tr key={emp.name}>
                          <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{emp.employee_id}</span></td>
                          <td>{emp.first_name} {emp.last_name}</td>
                          <td>{emp.email}</td>
                          <td><span className="badge badge-night">{emp.role || '—'}</span></td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openEditEmployeeModal(emp)}>Edit</button>
                              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem', backgroundColor: 'var(--surface-hover)' }} onClick={() => openCredentialModal(emp)}>🔑 Pwd</button>
                              <button className="btn btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleDeleteEmployee(emp.name)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {employees.length === 0 && (
              <div className="card text-center">
                <p className="text-muted">No employees yet. Click "Add Employee" to create one.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shifts' && (
          <div>
            <h2 className="mb-8">Work Shifts</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Shift Name</th>
                    <th>Start Time</th>
                    <th>End Time</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.map(shift => (
                    <tr key={shift.name}>
                      <td>{shift.shift_name}</td>
                      <td>{shift.start_time}</td>
                      <td>{shift.end_time}</td>
                      <td>
                        <span className={`badge badge-${shift.shift_name.toLowerCase()}`}>
                          {shift.is_rotational ? 'Rotational' : 'Fixed'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'assignments' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2>Shift Assignments</h2>
              <button className="btn btn-primary" onClick={openAddAssignmentModal}>+ Assign Shift</button>
            </div>

            {assignmentDepts.map(dept => (
              <div key={dept} className="mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0 }}>{dept}</h3>
                  <span className="badge badge-general">{assignmentsByDept[dept].length} assignment{assignmentsByDept[dept].length !== 1 ? 's' : ''}</span>
                </div>
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Employee Name</th>
                        <th>Current Active Shift</th>
                        <th>Shift Type</th>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Role</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignmentsByDept[dept].map(ass => (
                        <tr key={ass.name}>
                          <td><span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{ass.employee}</span></td>
                          <td>{ass.emp_details ? `${ass.emp_details.first_name} ${ass.emp_details.last_name}` : ass.employee}</td>
                          <td>
                            <span className={`badge badge-${ass.shift.toLowerCase()}`}>
                              {ass.shift}
                            </span>
                          </td>
                          <td>
                            {ass.follow_rotation ? (
                              <span className="badge badge-rotational" style={{ fontSize: '0.7rem' }}>⚙️ Weekly Rotation (Starts: {ass.initial_shift || 'General'})</span>
                            ) : (
                              <span className="text-muted" style={{ fontSize: '0.8rem' }}>Fixed Schedule</span>
                            )}
                          </td>
                          <td>{ass.start_date}</td>
                          <td>{ass.end_date ? ass.end_date : <span style={{ fontStyle: 'italic', color: 'var(--success)' }}>Ongoing / Indefinite</span>}</td>
                          <td><span className="badge badge-night">{ass.emp_details?.role || '—'}</span></td>
                          <td>
                            <div className="flex gap-2">
                              <button className="btn btn-secondary" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => openEditAssignmentModal(ass)}>Edit</button>
                              <button className="btn btn-danger" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={() => handleDeleteAssignment(ass.name)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {assignments.length === 0 && (
              <div className="card text-center">
                <p className="text-muted">No assignments yet. Click "+ Assign Shift" to schedule your workforce.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div>
            <h2 className="mb-8">Shift Calendar</h2>
            <ShiftCalendar assignments={assignments} onShiftClick={openEditAssignmentModal} />
          </div>
        )}

        {activeTab === 'rotation' && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2>Current Rotation Status</h2>
                <p className="text-muted">Tracking employees on automated shift cycles</p>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Current Shift</th>
                    <th>Cycle Stage</th>
                    <th>Status</th>
                    <th>Next Rotation</th>
                    <th>Action Required</th>
                  </tr>
                </thead>
                <tbody>
                  {rotationStatus.map(status => (
                    <tr key={status.assignment}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{status.employee_name}</div>
                        <div className="text-muted" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>{status.employee_id}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${status.current_shift.toLowerCase()}`}>
                          {status.current_shift}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{status.cycle_week}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Target: {status.target_shift}</div>
                      </td>
                      <td>
                        {status.is_out_of_sync ? (
                          <span className="badge badge-night" style={{ backgroundColor: '#ef4444' }}>⚠️ Out of Sync</span>
                        ) : (
                          <span className="badge badge-general" style={{ backgroundColor: '#10b981' }}>✅ In Sync</span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: status.next_rotation_in_days <= 1 ? 'var(--danger)' : 'inherit' }}>
                          In {status.next_rotation_in_days} days
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Upcoming Monday</div>
                      </td>
                      <td>
                        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Auto-synced</span>
                      </td>
                    </tr>
                  ))}
                  {rotationStatus.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }} className="text-muted">
                        No employees currently following a rotational cycle.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="card mt-8" style={{ borderLeft: '4px solid var(--primary)' }}>
              <h4>How Rotation Works</h4>
              <ul style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                <li>Rotation cycle is <strong>2 weeks</strong> (General Shift ⟷ Night Shift).</li>
                <li>Shifts are updated every <strong>Monday</strong> based on the initial start date.</li>
                <li>"Out of Sync" means the current assigned shift doesn't match the calculated cycle (can happen if rotation wasn't triggered).</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Employee Modal */}
      {isEmployeeModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 className="mb-4">{editMode ? 'Edit Employee Details' : 'Add Employee'}</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSaveEmployee}>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input type="text" className="form-control" required value={formData.first_name} onChange={(e) => setFormData({...formData, first_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input type="text" className="form-control" value={formData.last_name} onChange={(e) => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Email (Login ID) *</label>
                <input type="email" className="form-control" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
              {!editMode && (
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-control" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Department</label>
                <input type="text" className="form-control" placeholder="e.g. IT, HR, Finance, Operations" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Role / Designation</label>
                <input type="text" className="form-control" placeholder="e.g. Software Engineer, Team Lead, Manager" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" className="btn btn-secondary" onClick={() => setEmployeeModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editMode ? 'Update Details' : 'Save Employee'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Shift Modal */}
      {isAssignmentModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 className="mb-4">{isAssignmentEditMode ? 'Modify Assignment Dates' : 'Assign Shift'}</h3>
            {error && <div className="alert alert-danger">{error}</div>}
            <form onSubmit={handleSaveAssignment}>
              <div className="form-group">
                <label className="form-label">Employee</label>
                <select className="form-control" required disabled={isAssignmentEditMode} value={assignmentData.employee} onChange={(e) => setAssignmentData({...assignmentData, employee: e.target.value})}>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.name} value={emp.employee_id}>{emp.employee_id} — {emp.first_name} {emp.last_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Shift Option *</label>
                <select 
                  className="form-control" 
                  required 
                  value={assignmentType} 
                  onChange={(e) => {
                    const type = e.target.value;
                    setAssignmentType(type);
                    if (type === 'Rotational') {
                      setAssignmentData({
                        ...assignmentData,
                        follow_rotation: 1,
                        initial_shift: assignmentData.initial_shift || 'General',
                        shift: assignmentData.initial_shift || 'General'
                      });
                    } else {
                      setAssignmentData({
                        ...assignmentData,
                        follow_rotation: 0,
                        initial_shift: null,
                        shift: type
                      });
                    }
                  }}
                >
                  <option value="General">General Shift (Fixed)</option>
                  <option value="Night">Night Shift (Fixed)</option>
                  <option value="Rotational">Rotational Shift (Alternating)</option>
                </select>
              </div>

              {assignmentType === 'Rotational' && (
                <div className="form-group animate-fade-in" style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem', marginTop: '0.5rem', marginBottom: '1rem' }}>
                  <label className="form-label">Initial Starting Shift *</label>
                  <select 
                    className="form-control" 
                    required 
                    value={assignmentData.initial_shift || 'General'} 
                    onChange={(e) => setAssignmentData({
                      ...assignmentData,
                      initial_shift: e.target.value,
                      shift: e.target.value
                    })}
                  >
                    <option value="General">General Shift (Day)</option>
                    <option value="Night">Night Shift</option>
                  </select>
                  <span className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    The cycle starts with this shift on the start date, then alternates weekly on Mondays.
                  </span>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Start Date *</label>
                <input type="date" className="form-control" required value={assignmentData.start_date} onChange={(e) => setAssignmentData({...assignmentData, start_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date (Optional for Indefinite)</label>
                <input type="date" className="form-control" value={assignmentData.end_date} onChange={(e) => setAssignmentData({...assignmentData, end_date: e.target.value})} />
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>Leave blank if this is a permanent assignment.</span>
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" className="btn btn-secondary" onClick={() => { setAssignmentModalOpen(false); setAssignmentEditMode(false); setAssignmentEditTargetId(null); setError(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{isAssignmentEditMode ? 'Update' : 'Assign'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Credentials Modal */}
      {isCredentialModalOpen && credentialTarget && (
        <div className="modal-overlay">
          <div className="modal-content animate-fade-in">
            <h3 className="mb-4">🔑 Manage Credentials</h3>
            <div className="card mb-4" style={{ backgroundColor: 'var(--background)' }}>
              <p><strong>Employee:</strong> {credentialTarget.first_name} {credentialTarget.last_name}</p>
              <p><strong>Login Email:</strong> {credentialTarget.email}</p>
              <p><strong>Employee ID:</strong> {credentialTarget.employee_id}</p>
            </div>
            {successMsg && <div className="alert alert-success">{successMsg}</div>}
            <form onSubmit={handleUpdateCredentials}>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-control" required value={credentialData.new_password} onChange={(e) => setCredentialData({ new_password: e.target.value })} />
              </div>
              <div className="flex justify-end gap-4 mt-8">
                <button type="button" className="btn btn-secondary" onClick={() => setCredentialModalOpen(false)}>Close</button>
                <button type="submit" className="btn btn-primary">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmConfig && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content animate-fade-in" style={{ maxWidth: '400px' }}>
            <h3 className="mb-4">Confirm Action</h3>
            <p className="mb-8" style={{ color: 'var(--text-muted)' }}>{confirmConfig.message}</p>
            <div className="flex justify-end gap-4">
              <button className="btn btn-secondary" onClick={() => setConfirmConfig(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { confirmConfig.onConfirm(); setConfirmConfig(null); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Toast Alert */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius)',
          backgroundColor: toast.type === 'success' ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
          color: 'white',
          fontWeight: 600,
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(8px)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast.type === 'success' ? '✅' : '❌'} {toast.message}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
