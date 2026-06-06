import React, { useEffect, useState } from 'react';
import { getMeetings, updateMeetingStatus, deleteMeeting } from '../services/meetingService';

const fmtD = d => { if (!d) return '—'; const s = d.split('T')[0]; const [y, m, dy] = s.split('-'); return `${dy}/${m}/${y}`; };

const STATUS_CLASSES = { pending: 'b-pending', confirmed: 'b-confirmed', done: 'b-done', cancelled: 'b-loss' };

export default function Meetings({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await getMeetings()); }
    catch { showToast('Failed to load', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await updateMeetingStatus(id, status);
    setRows(r => r.map(x => x.id === id ? { ...x, status } : x));
    showToast('Status updated', 'ok');
  };

  const del = async (id) => {
    if (!confirm('Delete this meeting?')) return;
    await deleteMeeting(id);
    setRows(r => r.filter(x => x.id !== id));
    showToast('Deleted', 'ok');
  };

  return (
    <div className="card">
      <div className="card-header"><h3>MEETING REQUESTS</h3></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>Date</th><th>Time</th><th>Purpose</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="10" className="loading"><span className="spin" />Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="10" className="empty">No meetings</td></tr>
            ) : rows.map((m, i) => (
              <tr key={m.id}>
                <td>{i + 1}</td>
                <td><strong>{m.full_name}</strong></td>
                <td>{m.phone}</td>
                <td style={{ fontSize: '.72rem' }}>{m.email}</td>
                <td>{fmtD(m.meeting_date)}</td>
                <td>{m.meeting_time || '—'}</td>
                <td style={{ fontSize: '.74rem' }}>{m.purpose || '—'}</td>
                <td style={{ fontSize: '.72rem', color: 'var(--t3)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.notes || '—'}</td>
                <td><span className={`badge ${STATUS_CLASSES[m.status] || 'b-pending'}`}>{m.status}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <select
                    className="filter"
                    value={m.status}
                    onChange={e => updateStatus(m.id, e.target.value)}
                    style={{ marginRight: 4, padding: '3px 6px', fontSize: '.68rem' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="done">Done</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button className="ac del" onClick={() => del(m.id)}><i className="fa fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
