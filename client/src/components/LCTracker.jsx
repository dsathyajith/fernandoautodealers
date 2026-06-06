import React, { useEffect, useState } from 'react';
import { getLCVehicles } from '../services/lcService';

const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 });
const fmtD = d => { if (!d) return '—'; const s = d.split('T')[0]; const [y, m, dy] = s.split('-'); return `${dy}/${m}/${y}`; };
const fc = v => { const t = parseFloat(v.tt_lkr) || 0, l = parseFloat(v.lc_lkr) || 0, d = parseFloat(v.duty) || 0, o = parseFloat(v.others) || 0; return (t + l + d + o) || parseFloat(v.cost) || 0; };

export default function LCTracker({ showToast }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sortDir, setSortDir] = useState('desc');
  const [expanded, setExpanded] = useState(new Set());

  const load = async () => {
    setLoading(true);
    try {
      setRows(await getLCVehicles(q, sortDir));
    } catch { showToast('Failed to load LC records', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [q, sortDir]);

  const toggle = (id) => setExpanded(s => {
    const ns = new Set(s);
    ns.has(id) ? ns.delete(id) : ns.add(id);
    return ns;
  });

  return (
    <div className="card">
      <div className="card-header">
        <h3>LC TRACKER</h3>
        <div className="card-header-right">
          <div className="search-wrap"><i className="fa fa-search" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search…" /></div>
          <button
            className={`sort-btn on`}
            onClick={() => setSortDir(s => s === 'desc' ? 'asc' : 'desc')}
            style={{ padding: '4px 10px', fontSize: '.7rem' }}
          >
            {sortDir === 'desc' ? '↓ Newest' : '↑ Oldest'}
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th><th>LC Date</th><th>LC Number</th><th>Brand / Model</th>
              <th>Chassis</th><th>Colour</th><th>TT (LKR)</th><th>LC (LKR)</th>
              <th>Duty</th><th>Others</th><th>Final Cost</th><th>CUSDEC</th>
              <th>Clear Date</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="15" className="loading"><span className="spin" />Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan="15" className="empty">No LC records</td></tr>
            ) : rows.map(v => {
              const finalCost = fc(v);
              const isOpen = expanded.has(v.id);
              return (
                <React.Fragment key={v.id}>
                  <tr>
                    <td><strong>{v.no}</strong></td>
                    <td>{fmtD(v.lc_date)}</td>
                    <td><span className="lc-badge">{v.lc_num || '—'}</span></td>
                    <td><strong>{v.brand}</strong><br /><span style={{ fontSize: '.72rem', color: 'var(--t2)' }}>{v.model}</span></td>
                    <td style={{ fontSize: '.7rem', color: 'var(--t3)' }}>{v.chassis || '—'}</td>
                    <td>{v.colour || '—'}</td>
                    <td className="amt">{fmt(v.tt_lkr)}</td>
                    <td className="amt">{fmt(v.lc_lkr)}</td>
                    <td className="amt">{fmt(v.duty)}</td>
                    <td className="amt">{fmt(v.others)}</td>
                    <td className="finaltd"><strong className="amt" style={{ color: 'var(--g)' }}>{fmt(finalCost)}</strong></td>
                    <td style={{ fontSize: '.7rem' }}>{v.cusdec || '—'}</td>
                    <td>{fmtD(v.clear_date)}</td>
                    <td><span className={`badge ${v.status === 'SOLD' ? 'b-sold' : v.status === 'IN HAND' ? 'b-inhand' : 'b-onway'}`}>{v.status}</span></td>
                    <td>
                      <button className="ac" onClick={() => toggle(v.id)}>
                        <i className={`fa ${isOpen ? 'fa-eye-slash' : 'fa-eye'}`} />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr>
                      <td colSpan="15" style={{ padding: 0 }}>
                        <div className="lc-detail">
                          <div style={{ fontSize: '.72rem', fontWeight: 600, color: 'var(--t2)', marginBottom: 8 }}>
                            📋 {v.brand} {v.model} &nbsp;|&nbsp; Chassis: {v.chassis || '—'}
                          </div>
                          <div className="lc-dgrid">
                            <div className="lc-ditem"><label>TT (LKR)</label><span>{fmt(v.tt_lkr)}</span></div>
                            <div className="lc-ditem"><label>LC (LKR)</label><span>{fmt(v.lc_lkr)}</span></div>
                            <div className="lc-ditem"><label>Duty (LKR)</label><span>{fmt(v.duty)}</span></div>
                            <div className="lc-ditem"><label>Others (LKR)</label><span>{fmt(v.others)}</span></div>
                            <div className="lc-ditem" style={{ borderColor: 'rgba(34,197,94,.3)' }}><label>Final Cost</label><span style={{ color: 'var(--g)' }}>{fmt(finalCost)}</span></div>
                            <div className="lc-ditem"><label>CUSDEC</label><span style={{ fontSize: '.78rem' }}>{v.cusdec || '—'}</span></div>
                            <div className="lc-ditem"><label>LC Date</label><span>{fmtD(v.lc_date)}</span></div>
                            <div className="lc-ditem"><label>Clear Date</label><span>{fmtD(v.clear_date)}</span></div>
                            <div className="lc-ditem"><label>Status</label><span>{v.status}</span></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
