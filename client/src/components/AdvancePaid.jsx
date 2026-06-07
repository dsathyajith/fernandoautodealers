import React, { useState, useEffect, useCallback } from 'react';
import { getVehicles, completeAdvanceSale } from '../services/vehicleService';
import { printAdvanceInvoice, printCustomerInvoice } from '../utils/invoicePrint';

const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 });
const fmtD = d => { if (!d) return '—'; const s = String(d).split('T')[0]; const [y, m, dy] = s.split('-'); return `${dy}/${m}/${y}`; };

function CompleteSaleModal({ open, vehicle, onClose, onDone, showToast }) {
  const [finalDate, setFinalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (open) setFinalDate(new Date().toISOString().split('T')[0]); }, [open]);

  const doComplete = async () => {
    setSaving(true);
    try {
      await completeAdvanceSale(vehicle.id, { final_date: finalDate });
      showToast('Sale completed!', 'ok');
      onDone();
      onClose();
      printCustomerInvoice({
        vehicle: { ...vehicle },
        sale: {
          sell_price: vehicle.sell_price,
          sell_date: finalDate,
          vehicle_price: vehicle.vehicle_price,
          rmv_fee: vehicle.rmv_fee,
          lease_amount: vehicle.lease_amount,
          cash_amount: vehicle.cash_amount,
        },
        buyer: {
          customer_name: vehicle.customer_name,
          contact: vehicle.contact,
          buyer_address: vehicle.buyer_address,
        },
      });
    } catch (e) {
      showToast(e.message || 'Failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  const remaining = vehicle
    ? (parseFloat(vehicle.sell_price) || 0) - (parseFloat(vehicle.advance_amount) || 0)
    : 0;

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qs-box" style={{ maxWidth: 380 }}>
        <h3>✅ COMPLETE SALE</h3>
        <p style={{ color: '#60a5fa', fontSize: '.76rem', marginBottom: 14 }}>
          {vehicle?.brand} {vehicle?.model} — #{vehicle?.no}
        </p>
        <div style={{ background: 'var(--bg3)', border: '1px solid var(--br)', borderRadius: 8, padding: '10px 14px', fontSize: '.78rem', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: 'var(--t3)' }}>Selling Price</span>
            <span style={{ color: '#fff', fontFamily: "'Josefin Sans',sans-serif" }}>LKR {fmt(vehicle?.sell_price)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ color: 'var(--t3)' }}>Advance Paid</span>
            <span style={{ color: 'var(--a)', fontFamily: "'Josefin Sans',sans-serif" }}>LKR {fmt(vehicle?.advance_amount)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--br)', paddingTop: 5 }}>
            <span style={{ color: 'var(--t2)', fontWeight: 600 }}>Remaining Balance</span>
            <span style={{ color: '#4ade80', fontFamily: "'Josefin Sans',sans-serif", fontWeight: 700 }}>LKR {fmt(remaining)}</span>
          </div>
        </div>
        <div className="form-row">
          <label>Final Sale Date *</label>
          <input type="date" value={finalDate} onChange={e => setFinalDate(e.target.value)} />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button
            style={{ flex: 2, padding: 10, background: 'linear-gradient(135deg,#16a34a,#15803d)', border: 'none', borderRadius: 7, color: '#fff', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', minHeight: 40 }}
            onClick={doComplete} disabled={saving}
          >
            {saving ? 'Saving…' : '✓ Complete & Print Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdvancePaid({ showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeVehicle, setCompleteVehicle] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getVehicles();
      setVehicles(all.filter(v => v.payment_type === 'ADVANCE' && v.status === 'IN HAND'));
    } catch {
      showToast('Failed to load', 'err');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = q
    ? vehicles.filter(v =>
        `${v.brand} ${v.model} ${v.customer_name || ''} ${v.contact || ''}`.toLowerCase().includes(q.toLowerCase())
      )
    : vehicles;

  const totalAdvance = vehicles.reduce((s, v) => s + (parseFloat(v.advance_amount) || 0), 0);
  const totalRemaining = vehicles.reduce((s, v) => s + Math.max(0, (parseFloat(v.sell_price) || 0) - (parseFloat(v.advance_amount) || 0)), 0);

  return (
    <>
      <CompleteSaleModal
        open={completeOpen}
        vehicle={completeVehicle}
        onClose={() => setCompleteOpen(false)}
        onDone={load}
        showToast={showToast}
      />

      {/* Summary cards */}
      {!loading && vehicles.length > 0 && (
        <div className="sum-grid" style={{ marginBottom: 14 }}>
          <div className="sum-card">
            <div className="sum-icon i-amber"><i className="fa fa-clock" /></div>
            <div className="sum-text">
              <p>Pending Sales</p>
              <h2>{vehicles.length} Vehicles</h2>
              <span>Advance paid, awaiting full payment</span>
            </div>
          </div>
          <div className="sum-card">
            <div className="sum-icon i-green"><i className="fa fa-coins" /></div>
            <div className="sum-text">
              <p>Total Advance Collected</p>
              <h2>LKR {fmt(totalAdvance)}</h2>
              <span>Already received</span>
            </div>
          </div>
          <div className="sum-card">
            <div className="sum-icon i-blue"><i className="fa fa-rotate" /></div>
            <div className="sum-text">
              <p>Remaining to Collect</p>
              <h2>LKR {fmt(totalRemaining)}</h2>
              <span>Balance due from buyers</span>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3>ADVANCE PAID — PENDING COMPLETION</h3>
          <div className="card-header-right">
            <div className="search-wrap">
              <i className="fa fa-search" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" />
            </div>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Brand / Model</th>
                <th>Chassis</th>
                <th>Buyer</th>
                <th>Contact</th>
                <th>Sell Price</th>
                <th>Advance Paid</th>
                <th>Remaining</th>
                <th>Advance Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="10" className="loading"><span className="spin" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="10" className="empty">No advance paid vehicles</td></tr>
              ) : filtered.map(v => {
                const remaining = Math.max(0, (parseFloat(v.sell_price) || 0) - (parseFloat(v.advance_amount) || 0));
                return (
                  <tr key={v.id}>
                    <td><strong>{v.no}</strong></td>
                    <td>
                      <strong>{v.brand}</strong><br />
                      <span style={{ fontSize: '.72rem', color: 'var(--t2)' }}>{v.model}</span>
                    </td>
                    <td style={{ fontSize: '.7rem', color: 'var(--t3)' }}>{v.chassis || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.82rem' }}>{v.customer_name || '—'}</div>
                      {v.buyer_address && (
                        <div style={{ fontSize: '.68rem', color: 'var(--t3)', lineHeight: 1.4, marginTop: 2, whiteSpace: 'pre-line' }}>
                          {v.buyer_address}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '.76rem' }}>{v.contact || '—'}</td>
                    <td className="amt">{fmt(v.sell_price)}</td>
                    <td><span className="badge b-pending">LKR {fmt(v.advance_amount)}</span></td>
                    <td><span className="badge b-onway">LKR {fmt(remaining)}</span></td>
                    <td style={{ fontSize: '.76rem' }}>{fmtD(v.advance_date)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button
                        className="ac ok"
                        title="Complete Sale"
                        onClick={() => { setCompleteVehicle(v); setCompleteOpen(true); }}
                      >
                        <i className="fa fa-circle-check" /> Complete
                      </button>
                      <button
                        className="ac"
                        title="Re-print Advance Invoice"
                        onClick={() => printAdvanceInvoice({
                          vehicle: { ...v },
                          sale: {
                            sell_price: v.sell_price,
                            advance_amount: v.advance_amount,
                            advance_date: v.advance_date,
                            vehicle_price: v.vehicle_price,
                            rmv_fee: v.rmv_fee,
                            lease_amount: v.lease_amount,
                            cash_amount: v.cash_amount,
                          },
                          buyer: { customer_name: v.customer_name, contact: v.contact, buyer_address: v.buyer_address },
                        })}
                      >
                        <i className="fa fa-print" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pag">
          <span className="pag-info">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</span>
          <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>Click Complete to finalize the sale and generate customer invoice</span>
        </div>
      </div>
    </>
  );
}
