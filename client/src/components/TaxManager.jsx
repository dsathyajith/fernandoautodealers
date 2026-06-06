import React, { useEffect, useState, useRef } from 'react';
import { getVehicles } from '../services/vehicleService';
import { getTaxMonths, getTaxEntries, saveTaxEntry, deleteTaxEntry, deleteSlip } from '../services/taxService';

const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 });
const fmtD = d => { if (!d) return '—'; const s = d.split('T')[0]; const [y, m, dy] = s.split('-'); return `${dy}/${m}/${y}`; };

export default function TaxManager({ showToast }) {
  const [months, setMonths] = useState([]);
  const [entries, setEntries] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);
  const [selMonth, setSelMonth] = useState('');
  const [monthVehicles, setMonthVehicles] = useState([]);
  const [form, setForm] = useState({ sscl: '', vat_amount: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const ssclRef = useRef();
  const vatRef = useRef();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const vehicles = await getVehicles();
      const [ms, es] = await Promise.all([getTaxMonths(vehicles), getTaxEntries()]);
      setMonths(ms);
      setEntries(es);
      setAllVehicles(vehicles);
    } catch { showToast('Failed to load tax data', 'err'); }
  };

  const onMonthChange = (mk) => {
    setSelMonth(mk);
    if (!mk) { setMonthVehicles([]); setForm({ sscl: '', vat_amount: '', notes: '' }); return; }
    const filtered = allVehicles.filter(v => {
      if (v.status !== 'SOLD' || !v.sell_date) return false;
      const d = new Date(v.sell_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return key === mk;
    });
    setMonthVehicles(filtered);
    const m = months.find(x => x.month_key === mk);
    if (m) setForm({ sscl: m.sscl_saved ?? '', vat_amount: m.vat_saved ?? '', notes: m.notes_saved ?? '' });
  };

  const curMonth = months.find(m => m.month_key === selMonth);

  const saveTax = async () => {
    if (!selMonth) { showToast('Select a month', 'err'); return; }
    setSaving(true);
    try {
      await saveTaxEntry(selMonth, {
        month_label: curMonth?.month_label || selMonth,
        year: curMonth?.yr || 0,
        month: curMonth?.mo || 0,
        vehicles_count: curMonth?.count || 0,
        turnover: curMonth?.turnover || 0,
        profit: curMonth?.profit || 0,
        sscl: form.sscl || 0,
        vat_amount: form.vat_amount || 0,
        notes: form.notes || ''
      }, ssclRef.current?.files[0] || null, vatRef.current?.files[0] || null);
      showToast('Tax entry saved!', 'ok');
      loadAll();
      if (ssclRef.current) ssclRef.current.value = '';
      if (vatRef.current) vatRef.current.value = '';
    } catch (e) {
      showToast(e.message || 'Save failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  const delEntry = async (mk) => {
    if (!confirm('Delete tax entry for ' + mk + '?')) return;
    await deleteTaxEntry(mk);
    showToast('Deleted', 'ok');
    loadAll();
  };

  const delSlip = async (mk, type) => {
    if (!confirm(`Delete ${type.toUpperCase()} slip?`)) return;
    await deleteSlip(mk, type);
    showToast('Slip removed', 'ok');
    loadAll();
  };

  const total = (parseFloat(form.sscl) || 0) + (parseFloat(form.vat_amount) || 0);

  const expCSV = () => {
    const cols = ['Month', 'Vehicles', 'Turnover', 'Profit', 'SSCL', 'VAT', 'Total Tax', 'Notes'];
    const data = entries.map(e => [e.month_label, e.vehicles_count, e.turnover, e.profit, e.sscl, e.vat_amount, (parseFloat(e.sscl) || 0) + (parseFloat(e.vat_amount) || 0), e.notes || '']);
    const csv = [cols, ...data].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'tax-records.csv';
    a.click();
  };

  return (
    <>
      {/* Add/Edit Form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <h3>ADD / EDIT MONTHLY TAX ENTRY</h3>
          <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>Select month → review vehicles → enter VAT & SSCL manually</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
            <div>
              <div className="form-row">
                <label>Select Month</label>
                <select className="filter" style={{ width: '100%' }} value={selMonth} onChange={e => onMonthChange(e.target.value)}>
                  <option value="">— Select Month —</option>
                  {months.map(m => (
                    <option key={m.month_key} value={m.month_key}>{m.month_label} ({m.count} sold)</option>
                  ))}
                </select>
              </div>
              {curMonth && (
                <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 12, border: '1px solid var(--br)', fontSize: '.78rem' }}>
                  <div style={{ color: 'var(--t3)', marginBottom: 6, fontSize: '.65rem', letterSpacing: 1, textTransform: 'uppercase' }}>Month Summary</div>
                  <div>Vehicles: <strong>{curMonth.count}</strong></div>
                  <div>Turnover: <strong>LKR {fmt(curMonth.turnover)}</strong></div>
                  <div>Profit: <strong>LKR {fmt(curMonth.profit)}</strong></div>
                  {curMonth.has_entry && <div style={{ color: 'var(--g)', marginTop: 4, fontSize: '.7rem' }}>✓ Entry saved</div>}
                </div>
              )}
            </div>
            {selMonth && monthVehicles.length > 0 && (
              <div>
                <div style={{ fontSize: '.65rem', color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Vehicles Sold This Month</div>
                <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--br)', borderRadius: 8 }}>
                  <table style={{ minWidth: 400 }}>
                    <thead><tr><th>#</th><th>Brand / Model</th><th>Sell Price</th><th>Cost</th><th>Income</th><th>Date</th></tr></thead>
                    <tbody>
                      {monthVehicles.map(v => (
                        <tr key={v.no}>
                          <td>{v.no}</td>
                          <td><strong>{v.brand}</strong> {v.model}</td>
                          <td className="amt">{fmt(v.sell_price)}</td>
                          <td className="amt">{fmt(v.cost)}</td>
                          <td className={parseFloat(v.income) < 0 ? 'neg' : 'pos'}>{fmt(v.income)}</td>
                          <td>{fmtD(v.sell_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {selMonth && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--br)' }}>
              <div style={{ fontSize: '.65rem', color: 'var(--t3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Enter Tax Amounts Manually</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12 }}>
                <div className="form-row" style={{ margin: 0 }}>
                  <label>Turnover (LKR) <small style={{ color: 'var(--t3)' }}>(auto)</small></label>
                  <input type="number" value={curMonth?.turnover || ''} readOnly style={{ opacity: .7 }} />
                </div>
                <div className="form-row" style={{ margin: 0 }}>
                  <label>Total Profit (LKR) <small style={{ color: 'var(--t3)' }}>(auto)</small></label>
                  <input type="number" value={curMonth?.profit || ''} readOnly style={{ opacity: .7 }} />
                </div>
                <div className="form-row" style={{ margin: 0 }}>
                  <label><span className="sscl-badge">SSCL</span> Amount (LKR) *</label>
                  <input type="number" value={form.sscl} onChange={e => setForm(f => ({ ...f, sscl: e.target.value }))} placeholder="Enter SSCL amount" style={{ borderColor: 'rgba(139,92,246,.4)' }} />
                </div>
                <div className="form-row" style={{ margin: 0 }}>
                  <label><span className="vat-badge">VAT</span> Amount (LKR) *</label>
                  <input type="number" value={form.vat_amount} onChange={e => setForm(f => ({ ...f, vat_amount: e.target.value }))} placeholder="Enter VAT amount" style={{ borderColor: 'rgba(6,182,212,.4)' }} />
                </div>
                <div className="form-row" style={{ margin: 0, gridColumn: '1 / -1' }}>
                  <label>Notes <small style={{ color: 'var(--t3)' }}>(optional)</small></label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="e.g. Filed on 15/06/2026, reference #123…" />
                </div>
                <div className="form-row" style={{ margin: 0 }}>
                  <label><span className="sscl-badge">SSCL</span> Payment Slip (PDF/JPG/PNG)</label>
                  <input ref={ssclRef} type="file" accept=".pdf,.jpg,.jpeg,.png" />
                  {curMonth?.sscl_slip && (
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={curMonth.sscl_slip} target="_blank" rel="noreferrer" className="slip-thumb">
                        <i className="fa fa-file" /> {curMonth.sscl_slip_name || curMonth.sscl_slip}
                      </a>
                      <button className="ac del" onClick={() => delSlip(selMonth, 'sscl')}><i className="fa fa-times" /></button>
                    </div>
                  )}
                </div>
                <div className="form-row" style={{ margin: 0 }}>
                  <label><span className="vat-badge">VAT</span> Payment Slip (PDF/JPG/PNG)</label>
                  <input ref={vatRef} type="file" accept=".pdf,.jpg,.jpeg,.png" />
                  {curMonth?.vat_slip && (
                    <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <a href={curMonth.vat_slip} target="_blank" rel="noreferrer" className="slip-thumb">
                        <i className="fa fa-file" /> {curMonth.vat_slip_name || curMonth.vat_slip}
                      </a>
                      <button className="ac del" onClick={() => delSlip(selMonth, 'vat')}><i className="fa fa-times" /></button>
                    </div>
                  )}
                </div>
              </div>
              {total > 0 && (
                <div style={{ marginTop: 12, background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: 8, padding: '12px 16px' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>Total Tax:</span>
                  <strong style={{ fontFamily: "'Josefin Sans',sans-serif", fontSize: '1.1rem', color: 'var(--a)', marginLeft: 8 }}>LKR {fmt(total)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn-save" style={{ maxWidth: 200 }} onClick={saveTax} disabled={saving}>
                  <i className="fa fa-save" /> {saving ? 'Saving…' : 'Save Entry'}
                </button>
                <button className="btn-cancel" style={{ maxWidth: 120 }} onClick={() => { setSelMonth(''); setForm({ sscl: '', vat_amount: '', notes: '' }); }}>Clear</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved entries table */}
      <div className="card">
        <div className="card-header">
          <h3>SAVED TAX RECORDS</h3>
          <button className="btn-secondary" onClick={expCSV}><i className="fa fa-download" /> Export CSV</button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Month</th><th>Vehicles</th><th>Turnover (LKR)</th><th>Profit (LKR)</th>
                <th><span className="sscl-badge">SSCL (LKR)</span></th>
                <th><span className="vat-badge">VAT (LKR)</span></th>
                <th>Total Tax</th><th>Notes</th>
                <th><span className="sscl-badge">SSCL</span> Slip</th>
                <th><span className="vat-badge">VAT</span> Slip</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.length === 0 ? (
                <tr><td colSpan="11" className="empty">No saved entries</td></tr>
              ) : entries.map(e => {
                const totalTax = (parseFloat(e.sscl) || 0) + (parseFloat(e.vat_amount) || 0);
                return (
                  <tr key={e.id}>
                    <td><strong>{e.month_label}</strong></td>
                    <td>{e.vehicles_count}</td>
                    <td className="amt">{fmt(e.turnover)}</td>
                    <td className="amt">{fmt(e.profit)}</td>
                    <td className="amt">{fmt(e.sscl)}</td>
                    <td className="amt">{fmt(e.vat_amount)}</td>
                    <td className="amt" style={{ color: 'var(--a)' }}>{fmt(totalTax)}</td>
                    <td style={{ fontSize: '.72rem', color: 'var(--t3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.notes || '—'}</td>
                    <td>{e.sscl_slip ? <a href={e.sscl_slip} target="_blank" rel="noreferrer" className="slip-thumb"><i className="fa fa-file" /> View</a> : <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>—</span>}</td>
                    <td>{e.vat_slip ? <a href={e.vat_slip} target="_blank" rel="noreferrer" className="slip-thumb"><i className="fa fa-file" /> View</a> : <span style={{ fontSize: '.7rem', color: 'var(--t3)' }}>—</span>}</td>
                    <td>
                      <button className="ac del" onClick={() => delEntry(e.month_key)}><i className="fa fa-trash" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pag">
          <span className="pag-info">{entries.length} entries</span>
          <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>⚠ Consult your tax advisor for exact obligations</span>
        </div>
      </div>
    </>
  );
}
