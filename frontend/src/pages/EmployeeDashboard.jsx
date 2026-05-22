import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ShiftCalendar from '../components/ShiftCalendar';

const EmployeeDashboard = () => {
  const { profile } = useContext(AuthContext);
  const [assignments, setAssignments] = useState([]);
  const [shiftDetails, setShiftDetails] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [rotationStatus, setRotationStatus] = useState(null);
  const [projects, setProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [myTimesheets, setMyTimesheets] = useState([]);
  const [timesheetForm, setTimesheetForm] = useState({ date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', project: '', activity: '', description: '' });
  const [timesheetEditId, setTimesheetEditId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (profile) {
      fetchAssignments();
      fetchShifts();
      fetchRotationStatus();
      fetchTimesheetData();
    }
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [profile]);

  const fetchAssignments = async () => {
    try {
      const res = await api.get(`/resource/Shift Assignment?filters=[["employee","=","${profile.name}"]]&fields=["name","shift","start_date","end_date","follow_rotation","initial_shift"]`);
      setAssignments(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchShifts = async () => {
    try {
      const res = await api.get('/resource/Work Shift?fields=["shift_name","start_time","end_time","is_rotational"]');
      const map = {};
      (res.data.data || []).forEach(s => { map[s.shift_name] = s; });
      setShiftDetails(map);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRotationStatus = async () => {
    try {
      const res = await api.get(`/method/shift_management.api.get_rotation_status?employee_id=${profile.employee_id}`);
      if (res.data.message && res.data.message.length > 0) {
        setRotationStatus(res.data.message[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTimesheetData = async () => {
    try {
      const projRes = await api.get('/method/shift_management.timesheet_api.get_projects');
      setProjects(projRes.data.message || []);
      
      const actRes = await api.get('/method/shift_management.timesheet_api.get_activities');
      setActivities(actRes.data.message || []);
      
      const tsRes = await api.get(`/method/shift_management.timesheet_api.get_timesheets?employee=${profile.employee_id}`);
      setMyTimesheets(tsRes.data.message || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTimesheetSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/method/shift_management.timesheet_api.log_timesheet', {
        employee: profile.employee_id,
        timesheet_id: timesheetEditId,
        ...timesheetForm
      });
      showToast(timesheetEditId ? 'Timesheet updated successfully!' : 'Timesheet logged successfully!', 'success');
      setTimesheetForm({ date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', project: '', activity: '', description: '' });
      setTimesheetEditId(null);
      fetchTimesheetData();
    } catch (err) {
      showToast('Error logging timesheet', 'error');
      console.error(err);
    }
  };

  const handleEditTimesheet = (t) => {
    setTimesheetEditId(t.name);
    setTimesheetForm({
      date: t.date,
      start_time: t.start_time,
      end_time: t.end_time,
      project: t.project,
      activity: t.activity,
      description: t.description || ''
    });
  };

  const handleCancelEditTimesheet = () => {
    setTimesheetEditId(null);
    setTimesheetForm({ date: new Date().toISOString().split('T')[0], start_time: '', end_time: '', project: '', activity: '', description: '' });
  };

  const handleDeleteTimesheet = async (timesheet_id) => {
    if (!window.confirm("Are you sure you want to delete this timesheet?")) return;
    try {
      await api.post('/method/shift_management.timesheet_api.delete_timesheet', {
        timesheet_id: timesheet_id,
        employee: profile.employee_id
      });
      showToast('Timesheet deleted successfully!', 'success');
      if (timesheetEditId === timesheet_id) {
        handleCancelEditTimesheet();
      }
      fetchTimesheetData();
    } catch (err) {
      showToast('Error deleting timesheet', 'error');
      console.error(err);
    }
  };

  const handleDownloadReport = async (period) => {
    try {
      const res = await api.get(`/method/shift_management.timesheet_api.download_timesheet_report?period=${period}&employee=${profile.employee_id}`);
      const data = res.data.message;
      
      const byteCharacters = atob(data.content);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      showToast(`Downloaded ${period} report!`, 'success');
    } catch (err) {
      showToast('Error downloading report', 'error');
      console.error(err);
    }
  };

  return (
    <div className="container mt-8 animate-fade-in">
      <div className="flex justify-between items-center mb-8 bg-surface p-4 rounded-lg border border-border">
        <div>
          <h2 style={{ margin: 0 }}>Employee Dashboard</h2>
          <p className="text-muted" style={{ margin: 0 }}>Your personal shift schedule and profile</p>
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

      {/* Duty Summary & Profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="card md:col-span-2" style={{ borderLeft: '4px solid var(--primary)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', fontSize: '5rem', opacity: 0.1 }}>👋</div>
          <div className="flex justify-between items-center">
            <div>
              <h2 style={{ marginBottom: '0.25rem' }}>Welcome, {profile?.first_name} {profile?.last_name}</h2>
              <p className="text-muted">Employee ID: <strong>{profile?.employee_id}</strong> &nbsp;|&nbsp; Department: <strong>{profile?.department || '—'}</strong></p>
              <p className="text-muted">Role: <strong>{profile?.role || '—'}</strong></p>
            </div>
            <div className="badge badge-general" style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
              {assignments.length} Active Assignment{assignments.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success)', background: 'linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.1) 100%)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-5px', bottom: '-10px', fontSize: '4rem', opacity: 0.15 }}>🕒</div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TODAY'S DUTY</h3>
          {assignments.length > 0 ? (
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--success)' }}>
                {assignments[0].shift} Shift
              </div>
              <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                {shiftDetails[assignments[0].shift] ? `${shiftDetails[assignments[0].shift].start_time} - ${shiftDetails[assignments[0].shift].end_time}` : '...'}
              </div>
            </div>
          ) : (
            <div className="text-muted">No duty today</div>
          )}
        </div>
      </div>

      {/* Rotation Preview (if applicable) */}
      {rotationStatus && (
        <div className="card mb-8 animate-fade-in" style={{ borderLeft: '4px solid #34d399', backgroundColor: 'rgba(52, 211, 153, 0.05)' }}>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div className="flex items-center gap-4">
              <div style={{ fontSize: '2rem' }}>⚙️</div>
              <div>
                <h4 style={{ margin: 0 }}>Rotational Cycle Active</h4>
                <p className="text-muted" style={{ fontSize: '0.9rem', margin: 0 }}>
                  You are currently in <strong>{rotationStatus.cycle_week}</strong>
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:flex gap-8">
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Target Shift</div>
                <div style={{ fontWeight: 700 }}>{rotationStatus.target_shift}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Next Rotation</div>
                <div style={{ fontWeight: 700, color: rotationStatus.next_rotation_in_days <= 1 ? 'var(--danger)' : 'var(--success)' }}>
                  In {rotationStatus.next_rotation_in_days} days
                </div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600 }}>Status</div>
                <div>
                  {rotationStatus.is_out_of_sync ? (
                    <span className="badge badge-night" style={{ backgroundColor: '#ef4444' }}>⚠️ Update Pending</span>
                  ) : (
                    <span className="badge badge-general" style={{ backgroundColor: '#10b981' }}>✅ Synchronized</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {rotationStatus.is_out_of_sync && (
            <div className="mt-4 p-2 bg-red-100 text-red-800 rounded text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#b91c1c' }}>
              <strong>Note:</strong> Your shift is scheduled to change, but has not been updated yet. This usually happens automatically on Mondays.
            </div>
          )}
        </div>
      )}

      {/* Timesheet Form & Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="card">
          <h3 className="mb-4">{timesheetEditId ? '✏️ Edit Timesheet' : '⏱️ Log Timesheet'}</h3>
          <form onSubmit={handleTimesheetSubmit}>
            <div className="form-group mb-4">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" required value={timesheetForm.date} onChange={(e) => setTimesheetForm({...timesheetForm, date: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="form-label">Check-in Time *</label>
                <input type="time" className="form-control" required value={timesheetForm.start_time} onChange={(e) => setTimesheetForm({...timesheetForm, start_time: e.target.value})} />
              </div>
              <div>
                <label className="form-label">Check-out Time *</label>
                <input type="time" className="form-control" required value={timesheetForm.end_time} onChange={(e) => setTimesheetForm({...timesheetForm, end_time: e.target.value})} />
              </div>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Project *</label>
              <select className="form-control" required value={timesheetForm.project} onChange={(e) => setTimesheetForm({...timesheetForm, project: e.target.value})}>
                <option value="">Select Project</option>
                {projects.map(p => <option key={p.name} value={p.name}>{p.project_name}</option>)}
              </select>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Activity *</label>
              <select className="form-control" required value={timesheetForm.activity} onChange={(e) => setTimesheetForm({...timesheetForm, activity: e.target.value})}>
                <option value="">Select Activity</option>
                {activities.map(a => <option key={a.name} value={a.name}>{a.activity_name}</option>)}
              </select>
            </div>
            <div className="form-group mb-4">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows="2" value={timesheetForm.description} onChange={(e) => setTimesheetForm({...timesheetForm, description: e.target.value})}></textarea>
            </div>
            <div className="flex gap-4">
              {timesheetEditId && (
                <button type="button" className="btn btn-secondary w-full" onClick={handleCancelEditTimesheet}>Cancel</button>
              )}
              <button type="submit" className="btn btn-primary w-full">{timesheetEditId ? 'Update Timesheet' : 'Submit Timesheet'}</button>
            </div>
          </form>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ margin: 0 }}>Recent Timesheets</h3>
            <div className="flex gap-2">
              <button className="btn btn-primary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDownloadReport('day')}>📥 Daily</button>
              <button className="btn btn-primary" style={{ backgroundColor: '#818cf8', borderColor: '#818cf8', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDownloadReport('weekly')}>📥 Weekly</button>
              <button className="btn btn-primary" style={{ backgroundColor: '#34d399', borderColor: '#34d399', padding: '0.2rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleDownloadReport('monthly')}>📥 Monthly</button>
            </div>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {myTimesheets.map(t => (
              <div key={t.name} style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <strong style={{ display: 'block' }}>{t.date}</strong>
                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>{t.start_time} - {t.end_time}</span>
                  </div>
                  <div className="flex gap-2 items-center">
                    <span className="badge badge-general">{t.duration} Hrs</span>
                    <button className="btn btn-secondary" style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleEditTimesheet(t)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '0.1rem 0.5rem', fontSize: '0.75rem' }} onClick={() => handleDeleteTimesheet(t.name)}>Delete</button>
                  </div>
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}><strong>{t.project}</strong> — {t.activity}</div>
                {t.description && <div className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>"{t.description}"</div>}
              </div>
            ))}
            {myTimesheets.length === 0 && <div className="text-muted text-center p-4">You haven't logged any timesheets yet.</div>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <div className="card">
          <h3 className="mb-4">📅 Shift Calendar</h3>
          <ShiftCalendar assignments={assignments} />
        </div>

        <div>
          <h3 className="mb-4">📋 Shift List</h3>
          {assignments.length === 0 ? (
            <div className="card text-center">
              <p className="text-muted">You have no shifts assigned currently. Please contact your administrator.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Shift</th>
                    <th>Timing</th>
                    <th>Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(ass => {
                    const detail = shiftDetails[ass.shift];
                    return (
                      <tr key={ass.name}>
                        <td>
                          <span className={`badge badge-${ass.shift.toLowerCase()}`}>
                            {ass.shift}
                          </span>
                        </td>
                        <td>{detail ? `${detail.start_time} – ${detail.end_time}` : '—'}</td>
                        <td>{ass.follow_rotation ? 'Rotational (Weekly)' : 'Fixed'}</td>
                        <td>{ass.start_date}</td>
                        <td>{ass.end_date ? ass.end_date : <span style={{ fontStyle: 'italic', color: 'var(--success)' }}>Ongoing / Indefinite</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Toast Alert */}
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

export default EmployeeDashboard;
