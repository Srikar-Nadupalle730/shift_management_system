import React, { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const shiftColors = {
  general: { bg: 'rgba(79, 70, 229, 0.25)', border: '#818cf8', text: '#a5b4fc' },
  night: { bg: 'rgba(245, 158, 11, 0.25)', border: '#fbbf24', text: '#fde68a' },
  rotational: { bg: 'rgba(16, 185, 129, 0.25)', border: '#34d399', text: '#6ee7b7' },
};

const getDefaultColor = () => ({ bg: 'rgba(148, 163, 184, 0.2)', border: '#94a3b8', text: '#cbd5e1' });

// Helper to parse YYYY-MM-DD to local Date object safely
const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day || 1);
};

// Helper to format Date to YYYY-MM-DD
const formatDateStr = (date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const ShiftCalendar = ({ assignments = [], onShiftClick }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    
    if (!isNaN(year) && !isNaN(month)) {
      setCurrentYear(year);
      setCurrentMonth(month - 1);
    }
  };

  const handleDateJump = (e) => {
    const val = e.target.value;
    if (!val) return;
    const date = parseLocalDate(val);
    if (date) {
      setCurrentYear(date.getFullYear());
      setCurrentMonth(date.getMonth());
    }
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const monthEnd = new Date(currentYear, currentMonth, daysInMonth, 23, 59, 59);
  const monthStart = new Date(currentYear, currentMonth, 1);

  // Helper to get Monday of the week for a given date
  const getMonday = (d) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday;
  };

  // Build a map: dateStr -> [shifts]
  const shiftMap = {};
  assignments.forEach(a => {
    if (!a.start_date) return;
    
    const start = parseLocalDate(a.start_date);
    const end = a.end_date ? parseLocalDate(a.end_date) : null;
    
    if (start > monthEnd) return;
    
    let d = new Date(Math.max(start, monthStart));
    const effectiveEnd = end ? new Date(Math.min(end, monthEnd)) : monthEnd;
    
    d.setHours(0, 0, 0, 0);
    effectiveEnd.setHours(23, 59, 59, 999);

    const startMonday = getMonday(start);

    for (; d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
      // Sunday (0) is a holiday
      if (d.getDay() === 0) continue;

      const key = formatDateStr(d);
      if (!shiftMap[key]) shiftMap[key] = [];
      
      let displayedShift = a.shift;
      if (a.follow_rotation) {
        const currentMonday = getMonday(d);
        const msPerWeek = 7 * 24 * 60 * 60 * 1000;
        const weeksPassed = Math.round((currentMonday - startMonday) / msPerWeek);
        
        // Rotation Cycle: General (Week 0) -> Night (Week 1) -> General (Week 2) ...
        displayedShift = (weeksPassed % 2 === 0) ? 'General' : 'Night';
      }

      shiftMap[key].push({
        ...a,
        displayedShift: displayedShift
      });
    }
  });

  const cells = [];
  // Fill empty cells before 1st day
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push(<div key={`e${i}`} className="cal-cell cal-empty"></div>);
  }
  // Fill day cells
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const shiftsForDay = shiftMap[dateStr] || [];
    const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

    const dayOfWeek = new Date(currentYear, currentMonth, day).getDay();
    const isSunday = dayOfWeek === 0;

    cells.push(
      <div key={day} className={`cal-cell ${isToday ? 'cal-today' : ''} ${isSunday ? 'cal-holiday' : ''}`}>
        <span className="cal-day-number">{day}</span>
        <div className="cal-shifts">
          {isSunday ? (
            <div className="cal-holiday-tag">Holiday</div>
          ) : (
            shiftsForDay.map((s, i) => {
              const shiftName = s.displayedShift || s.shift;
              const colors = shiftColors[shiftName?.toLowerCase()] || getDefaultColor();
              const isClickable = !!onShiftClick;
              return (
                <div 
                  key={i} 
                  className={`cal-shift-tag ${isClickable ? 'clickable' : ''}`}
                  title={`${shiftName} - ${s.employee_name || ''} ${s.follow_rotation ? '(Rotational)' : ''}`} 
                  style={{ 
                    backgroundColor: colors.bg, 
                    borderLeft: `3px solid ${colors.border}`, 
                    color: colors.text,
                    cursor: isClickable ? 'pointer' : 'default'
                  }}
                  onClick={() => isClickable && onShiftClick(s)}
                >
                  {shiftName}
                  {s.employee_name ? <span className="cal-emp-name"> — {s.employee_name}</span> : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="shift-calendar">
      <div className="cal-header">
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={prevMonth} title="Previous Month">◀</button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={goToToday}>Today</button>
          <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }} onClick={nextMonth} title="Next Month">▶</button>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <h3 style={{ minWidth: '150px' }}>{MONTHS[currentMonth]} {currentYear}</h3>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Month:</label>
              <input 
                type="month" 
                className="form-control cal-month-picker" 
                value={`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`}
                onChange={handleMonthChange}
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
            <div className="flex items-center gap-1">
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Jump to Date:</label>
              <input 
                type="date" 
                className="form-control cal-month-picker" 
                onChange={handleDateJump}
                style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="cal-grid">
        {DAYS.map(d => <div key={d} className="cal-cell cal-day-header">{d}</div>)}
        {cells}
      </div>
    </div>
  );
};

export default ShiftCalendar;

