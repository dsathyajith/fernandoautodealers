import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { getVehicles, deleteVehicle, sellVehicle, updateVehicle, bulkCreateVehicles } from '../services/vehicleService';
import VehicleModal from './VehicleModal';

const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 });
const fmtD = d => { if (!d) return '—'; const s = d.split('T')[0]; const [y, m, dy] = s.split('-'); return `${dy}/${m}/${y}`; };
const fc = v => { const t = parseFloat(v.tt_lkr) || 0, l = parseFloat(v.lc_lkr) || 0, d = parseFloat(v.duty) || 0, o = parseFloat(v.others) || 0; return (t + l + d + o) || parseFloat(v.cost) || 0; };

function QuickSellModal({ open, vehicle, finalCost, onClose, onDone, showToast }) {
  const [sell, setSell] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);
  const inc = sell && finalCost ? parseFloat(sell) - finalCost : null;

  const doSell = async () => {
    if (!sell || !date) { showToast('Enter sell price and date', 'err'); return; }
    setSaving(true);
    try {
      const income = await sellVehicle(vehicle.id, { sell_price: sell, sell_date: date, contact });
      showToast(`Sold! Income: LKR ${fmt(income)}`, 'ok');
      onDone();
      onClose();
    } catch (e) {
      showToast(e.message || 'Failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qs-box">
        <h3>💰 MARK AS SOLD</h3>
        <p style={{ color: 'var(--rl)', fontSize: '.76rem', marginBottom: 14 }}>
          {vehicle?.brand} {vehicle?.model} — #{vehicle?.no}
        </p>
        <div className="form-row">
          <label>Selling Price (LKR) *</label>
          <input type="number" value={sell} onChange={e => setSell(e.target.value)} placeholder="Enter selling price" />
        </div>
        {inc !== null && (
          <div style={{ background: parseFloat(inc) >= 0 ? 'rgba(34,197,94,.08)' : 'rgba(229,57,53,.08)', border: `1px solid ${parseFloat(inc) >= 0 ? 'rgba(34,197,94,.2)' : 'rgba(229,57,53,.2)'}`, borderRadius: 7, padding: '10px 12px', fontSize: '.78rem', margin: '8px 0', color: parseFloat(inc) >= 0 ? '#4ade80' : '#ff6b6b' }}>
            Income: LKR {fmt(Math.abs(inc))} {parseFloat(inc) >= 0 ? '✓ Profit' : '⚠ Loss'}
          </div>
        )}
        <div className="form-row">
          <label>Selling Date *</label>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Buyer Contact</label>
          <input value={contact} onChange={e => setContact(e.target.value)} placeholder="07X XXX XXXX" />
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-green" onClick={doSell} disabled={saving}>
            {saving ? 'Saving…' : '✓ Confirm Sale'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ArriveModal({ open, vehicle, onClose, onDone, showToast }) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [cost, setCost] = useState('');
  const [saving, setSaving] = useState(false);

  const doArrive = async () => {
    if (!date || !cost) { showToast('Enter date and cost', 'err'); return; }
    setSaving(true);
    try {
      await updateVehicle(vehicle.id, {
        ...vehicle, status: 'IN HAND', clear_date: date, cost,
        lc_date: vehicle.lc_date?.split('T')[0] || '',
        sell_date: vehicle.sell_date?.split('T')[0] || ''
      });
      showToast('Marked In Hand!', 'ok');
      onDone();
      onClose();
    } catch (e) {
      showToast(e.message || 'Failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="qs-box">
        <h3>🚢 MARK AS IN HAND</h3>
        <p style={{ color: '#60a5fa', fontSize: '.76rem', marginBottom: 14 }}>{vehicle?.brand} {vehicle?.model}</p>
        <div className="form-row"><label>Clearing Date *</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        <div className="form-row"><label>Total Cost (LKR) *</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="Landed cost" /></div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button style={{ flex: 2, padding: 9, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', border: 'none', borderRadius: 7, color: '#fff', fontSize: '.78rem', fontWeight: 700, cursor: 'pointer' }} onClick={doArrive} disabled={saving}>
            {saving ? 'Saving…' : '✓ Mark Arrived'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ open, onClose, onDone, showToast }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      setRows(data);
    };
    reader.readAsArrayBuffer(file);
  };

  const doImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    setProgress(0);
    try {
      const errors = await bulkCreateVehicles(rows, (done, total) => setProgress(Math.round((done / total) * 100)));
      if (errors.length) showToast(`Imported with ${errors.length} error(s)`, 'err');
      else showToast(`${rows.length} vehicles imported!`, 'ok');
      onDone();
      onClose();
    } catch (e) {
      showToast(e.message || 'Import failed', 'err');
    } finally {
      setImporting(false);
      setRows([]);
      setFileName('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const reset = () => { setRows([]); setFileName(''); if (fileRef.current) fileRef.current.value = ''; onClose(); };

  if (!open) return null;
  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && reset()}>
      <div className="qs-box" style={{ maxWidth: 460 }}>
        <h3>📥 IMPORT FROM EXCEL</h3>
        <p style={{ fontSize: '.74rem', color: 'var(--t3)', marginBottom: 14 }}>
          Column headers in your sheet should match vehicle fields (Brand, Model, Status, Type, Chassis, Colour, Year, Cost, etc.)
        </p>
        <div className="form-row">
          <label>Excel / CSV File</label>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={onFile} style={{ color: 'var(--t1)', fontSize: '.78rem' }} />
        </div>
        {rows.length > 0 && (
          <div style={{ background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', borderRadius: 7, padding: '10px 14px', fontSize: '.78rem', color: '#4ade80', margin: '8px 0' }}>
            ✓ {rows.length} rows found in <strong>{fileName}</strong>
            <div style={{ color: 'var(--t3)', marginTop: 4 }}>
              Columns: {Object.keys(rows[0] || {}).join(', ')}
            </div>
          </div>
        )}
        {importing && (
          <div style={{ margin: '10px 0' }}>
            <div style={{ background: 'var(--b2)', borderRadius: 4, height: 6 }}>
              <div style={{ background: '#3b82f6', height: 6, borderRadius: 4, width: `${progress}%`, transition: 'width .2s' }} />
            </div>
            <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: 4 }}>{progress}% uploaded…</div>
          </div>
        )}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={reset} disabled={importing}>Cancel</button>
          <button className="btn-primary" onClick={doImport} disabled={!rows.length || importing}>
            {importing ? `Importing… ${progress}%` : `Import ${rows.length || ''} Rows`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Vehicles({ showToast, defaultStatus = '' }) {
  const [vehicles, setVehicles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortCol, setSortCol] = useState('no');
  const [sortDir, setSortDir] = useState('asc');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [brand, setBrand] = useState('');
  const [type, setType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [qsOpen, setQsOpen] = useState(false);
  const [qsVehicle, setQsVehicle] = useState(null);
  const [qsCost, setQsCost] = useState(0);
  const [arrOpen, setArrOpen] = useState(false);
  const [arrVehicle, setArrVehicle] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const LIMIT = 20;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let all = await getVehicles();
      if (status) all = all.filter(v => v.status === status);
      if (brand) all = all.filter(v => v.brand === brand);
      if (type) all = all.filter(v => v.type === type);
      if (q) {
        const lq = q.toLowerCase();
        all = all.filter(v =>
          (v.brand || '').toLowerCase().includes(lq) ||
          (v.model || '').toLowerCase().includes(lq) ||
          (v.chassis || '').toLowerCase().includes(lq) ||
          (v.colour || '').toLowerCase().includes(lq) ||
          (v.contact || '').toLowerCase().includes(lq) ||
          (v.lc_num || '').toLowerCase().includes(lq)
        );
      }
      all.sort((a, b) => {
        const av = a[sortCol] ?? '', bv = b[sortCol] ?? '';
        const res = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return sortDir === 'desc' ? -res : res;
      });
      setTotal(all.length);
      setVehicles(all.slice((page - 1) * LIMIT, page * LIMIT));
    } catch { showToast('Failed to load vehicles', 'err'); }
    finally { setLoading(false); }
  }, [q, status, brand, type, page, sortCol, sortDir]);

  useEffect(() => { load(); }, [load]);

  const sort = (col) => {
    setSortCol(col);
    setSortDir(s => sortCol === col ? (s === 'asc' ? 'desc' : 'asc') : 'asc');
    setPage(1);
  };
  const SortBtn = ({ col }) => (
    <button className={`sort-btn ${sortCol === col ? 'on' : ''}`} onClick={() => sort(col)}>
      {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </button>
  );

  const del = async (v) => {
    if (!confirm(`Delete vehicle #${v.no}?`)) return;
    try {
      await deleteVehicle(v.id);
      showToast(`Vehicle #${v.no} deleted`, 'ok');
      load();
    } catch { showToast('Delete failed', 'err'); }
  };

  const pages = Math.ceil(total / LIMIT);
  const start = (page - 1) * LIMIT;

  const exportCSV = async () => {
    const rows = await getVehicles();
    const cols = ['#', 'Status', 'Type', 'Brand', 'Model', 'Chassis', 'Colour', 'Cost', 'Sell Price', 'Income', 'Sell Date', 'Contact'];
    const data = rows.map(v => [v.no, v.status, v.type, v.brand, v.model, v.chassis || '', v.colour || '', v.cost || '', v.sell_price || '', v.income || '', v.sell_date ? v.sell_date.split('T')[0] : '', v.contact || '']);
    const csv = [cols, ...data].map(r => r.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = 'vehicles.csv';
    a.click();
  };

  const isStatusPage = defaultStatus !== '';
  const title = defaultStatus === 'IN HAND' ? 'IN HAND — READY TO SELL' : defaultStatus === 'ON THE WAY' ? 'ON THE WAY — IN TRANSIT' : 'VEHICLE REGISTER';

  return (
    <>
      <div className="card">
        <div className="card-header">
          <h3>{title}</h3>
          <div className="card-header-right">
            <div className="search-wrap"><i className="fa fa-search" /><input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder="Search…" /></div>
            {!isStatusPage && (
              <>
                <select className="filter" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
                  <option value="">All Status</option>
                  <option>SOLD</option><option>IN HAND</option><option>ON THE WAY</option>
                </select>
                <select className="filter" value={brand} onChange={e => { setBrand(e.target.value); setPage(1); }}>
                  <option value="">All Brands</option>
                  <option>Toyota</option><option>Honda</option><option>Suzuki</option><option>Nissan</option>
                  <option>Mitsubishi</option><option>Mazda</option><option>Subaru</option>
                </select>
                <select className="filter" value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
                  <option value="">All Types</option><option>LOCAL</option><option>IMPORT</option>
                </select>
                <button className="btn-secondary" onClick={exportCSV}><i className="fa fa-download" /> Export</button>
                <button className="btn-secondary" onClick={() => setImportOpen(true)}><i className="fa fa-file-excel" /> Import</button>
              </>
            )}
            <button className="btn-primary" onClick={() => { setEditVehicle(null); setModalOpen(true); }}>
              <i className="fa fa-plus" /> Add
            </button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Img</th>
                <th><SortBtn col="no" /> #</th>
                <th>Status</th><th>Type</th>
                <th><SortBtn col="brand" /> Brand</th>
                <th>Model</th><th>Chassis</th><th>Colour</th>
                <th><SortBtn col="cost" /> Cost</th>
                <th><SortBtn col="sell_price" /> Sell Price</th>
                <th><SortBtn col="income" /> Income</th>
                <th><SortBtn col="sell_date" /> Sell Date</th>
                <th>Contact</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="14" className="loading"><span className="spin" />Loading…</td></tr>
              ) : vehicles.length === 0 ? (
                <tr><td colSpan="14" className="empty">No vehicles found</td></tr>
              ) : vehicles.map(v => {
                const finalCost = fc(v);
                const inc = v.income != null ? parseFloat(v.income) : null;
                return (
                  <tr key={v.id}>
                    <td>
                      {v.imageUrl
                        ? <img src={v.imageUrl} className="v-img" alt="" onError={e => { e.target.style.display = 'none'; }} />
                        : <div className="v-img-ph"><i className="fa fa-car" /></div>}
                    </td>
                    <td><strong>{v.no}</strong></td>
                    <td><span className={`badge ${v.status === 'SOLD' ? 'b-sold' : v.status === 'IN HAND' ? 'b-inhand' : 'b-onway'}`}>{v.status}</span></td>
                    <td><span className={`badge ${v.type === 'LOCAL' ? 'b-local' : 'b-import'}`}>{v.type}</span></td>
                    <td><strong>{v.brand}</strong></td>
                    <td>{v.model}</td>
                    <td style={{ fontSize: '.7rem', color: 'var(--t3)' }}>{v.chassis || '—'}</td>
                    <td>{v.colour || '—'}</td>
                    <td className="amt">{fmt(v.cost)}</td>
                    <td className="amt">{fmt(v.sell_price)}</td>
                    <td>
                      {inc == null ? '—' : (
                        <span className={`badge ${inc < 0 ? 'b-loss' : 'b-profit'}`}>
                          {inc < 0 ? '− ' : '+ '}{fmt(Math.abs(inc))}
                        </span>
                      )}
                    </td>
                    <td>{fmtD(v.sell_date)}</td>
                    <td style={{ fontSize: '.71rem' }}>{v.contact || '—'}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button className="ac" onClick={() => { setEditVehicle(v); setModalOpen(true); }} title="Edit"><i className="fa fa-pen" /></button>
                      {v.status === 'IN HAND' && (
                        <button className="ac sell" onClick={() => { setQsVehicle(v); setQsCost(finalCost); setQsOpen(true); }} title="Sell"><i className="fa fa-dollar-sign" /></button>
                      )}
                      {v.status === 'ON THE WAY' && (
                        <button className="ac arr" onClick={() => { setArrVehicle(v); setArrOpen(true); }} title="Arrived"><i className="fa fa-ship" /></button>
                      )}
                      <button className="ac del" onClick={() => del(v)} title="Delete"><i className="fa fa-trash" /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="pag">
          <span className="pag-info">
            {total > 0 ? `Showing ${Math.min(start + 1, total)}–${Math.min(start + LIMIT, total)} of ${total}` : ''}
          </span>
          <div className="pag-btns">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`pgb ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
          </div>
        </div>
      </div>

      <VehicleModal
        open={modalOpen}
        vehicle={editVehicle}
        onClose={() => { setModalOpen(false); setEditVehicle(null); }}
        onSaved={load}
        showToast={showToast}
      />
      <QuickSellModal
        open={qsOpen}
        vehicle={qsVehicle}
        finalCost={qsCost}
        onClose={() => setQsOpen(false)}
        onDone={load}
        showToast={showToast}
      />
      <ArriveModal
        open={arrOpen}
        vehicle={arrVehicle}
        onClose={() => setArrOpen(false)}
        onDone={load}
        showToast={showToast}
      />
      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onDone={load}
        showToast={showToast}
      />
    </>
  );
}
