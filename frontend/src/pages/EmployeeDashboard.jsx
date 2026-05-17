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

  useEffect(() => {
    if (profile) {
      fetchAssignments();
      fetchShifts();
      fetchRotationStatus();
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
    </div>
  );
};

export default EmployeeDashboard;
