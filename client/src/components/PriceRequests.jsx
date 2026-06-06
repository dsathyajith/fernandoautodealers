import React, { useEffect, useState } from 'react';
import { getPriceRequests, updatePriceRequestStatus, deletePriceRequest } from '../services/priceRequestService';

const fmtD = d => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };
const STATUS_CLASSES = { pending: 'b-pending', replied: 'b-confirmed', closed: 'b-done' };

export default function PriceRequests({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setRows(await getPriceRequests()); }
    catch { showToast('Failed to load', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await updatePriceRequestStatus(id, status);
    setRows(r => r.map(x => x.id === id ? { ...x, status } : x));
    showToast('Status updated', 'ok');
  };

  const del = async (id) => {
    if (!confirm('Delete this request?')) return;
    await deletePriceRequest(id);
    setRows(r => r.filter(x => x.id !== id));
    showToast('Deleted', 'ok');
  };

  return (
    <div className="card">
      <div className="card-header"><h3>PRICE REQUESTS</h3></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Vehicle</th><th>Customer</th><th>Email</th><th>Message</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="8" className="loading"><span className="spin" />Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="8" className="empty">No price requests</td></tr>
            ) : rows.map((r, i) => (
              <tr key={r.id}>
                <td>{i + 1}</td>
                <td><strong>{r.vehicle_name || r.stock_id}</strong></td>
                <td>{r.user_name || r.username}</td>
                <td style={{ fontSize: '.72rem' }}>{r.user_email}</td>
                <td style={{ fontSize: '.74rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.message || '—'}</td>
                <td><span className={`badge ${STATUS_CLASSES[r.status] || 'b-pending'}`}>{r.status}</span></td>
                <td style={{ fontSize: '.72rem' }}>{fmtD(r.created_at)}</td>
                <td style={{ whiteSpace: 'nowrap' }}>
                  <select
                    className="filter"
                    value={r.status}
                    onChange={e => updateStatus(r.id, e.target.value)}
                    style={{ marginRight: 4, padding: '3px 6px', fontSize: '.68rem' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="replied">Replied</option>
                    <option value="closed">Closed</option>
                  </select>
                  <button className="ac del" onClick={() => del(r.id)}><i className="fa fa-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
