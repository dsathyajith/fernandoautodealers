import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getVehicles } from '../services/vehicleService';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '../firebase';

const fmtD = d => {
  if (!d) return '—';
  const s = String(d).split('T')[0];
  const [y, m, dy] = s.split('-');
  return `${dy}/${m}/${y}`;
};

const uploadPdf = async (file, vehicleId, tag) => {
  const pdfRef = ref(storage, `vehicles/${vehicleId}_${tag}_${Date.now()}.pdf`);
  await uploadBytes(pdfRef, file);
  return getDownloadURL(pdfRef);
};

/* ════════════════════════════════════════════
   PDF Viewer popup
   ════════════════════════════════════════════ */
function PdfViewer({ url, title, onClose }) {
  /* close on Escape */
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!url) return null;
  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,.82)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* top bar */}
      <div style={{
        width: '100%', maxWidth: 920, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', marginBottom: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <i className="fa fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.1rem' }} />
          <span style={{ fontSize: '.82rem', fontWeight: 700, color: '#fff', letterSpacing: '.5px' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={url} target="_blank" rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: '.72rem', fontWeight: 700,
              background: 'rgba(96,165,250,.15)', color: '#93c5fd',
              border: '1px solid rgba(96,165,250,.3)', textDecoration: 'none',
            }}
          >
            <i className="fa fa-arrow-up-right-from-square" /> Open in Browser
          </a>
          <button
            onClick={onClose}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, fontSize: '.72rem', fontWeight: 700,
              background: 'rgba(239,68,68,.15)', color: '#fca5a5',
              border: '1px solid rgba(239,68,68,.3)', cursor: 'pointer',
            }}
          >
            <i className="fa fa-xmark" /> Close
          </button>
        </div>
      </div>

      {/* iframe */}
      <iframe
        src={url}
        title={title}
        style={{
          width: '100%', maxWidth: 920, height: 'min(80vh, 900px)',
          border: 'none', borderRadius: 10,
          background: '#fff',
        }}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   View button — opens PdfViewer inline
   ════════════════════════════════════════════ */
function ViewBtn({ url, label, onView }) {
  if (!url) return <span style={{ fontSize: '.68rem', color: 'var(--t3)' }}>—</span>;
  return (
    <button
      onClick={() => onView(url, label)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '4px 10px', borderRadius: 20, fontSize: '.68rem', fontWeight: 700,
        background: 'rgba(74,222,128,.12)', color: '#4ade80',
        border: '1px solid rgba(74,222,128,.25)', cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      <i className="fa fa-eye" style={{ fontSize: '.6rem' }} /> {label}
    </button>
  );
}

/* ════════════════════════════════════════════
   Upload button
   ════════════════════════════════════════════ */
function UploadBtn({ vehicleId, tag, currentUrl, onUploaded, showToast }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadPdf(file, vehicleId, tag);
      const field = tag === 'lc' ? 'lc_pdf_url' : 'cusdec_pdf_url';
      await updateDoc(doc(db, 'vehicles', vehicleId), { [field]: url });
      onUploaded(vehicleId, field, url);
      showToast('PDF uploaded!', 'ok');
    } catch (err) {
      showToast(err.message || 'Upload failed', 'err');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '4px 9px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700,
          background: uploading ? 'var(--bg3)' : 'rgba(96,165,250,.12)',
          color: uploading ? 'var(--t3)' : '#93c5fd',
          border: `1px solid ${uploading ? 'var(--br)' : 'rgba(96,165,250,.25)'}`,
          cursor: uploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap',
        }}
      >
        {uploading
          ? <><span className="spin" style={{ width: 10, height: 10, borderWidth: 2 }} /> Uploading…</>
          : <><i className="fa fa-upload" style={{ fontSize: '.6rem' }} /> {currentUrl ? 'Replace' : 'Upload'}</>
        }
      </button>
      <input ref={inputRef} type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleFile} />
    </>
  );
}

/* ════════════════════════════════════════════
   Combined cell: view + upload
   ════════════════════════════════════════════ */
function DocCell({ vehicleId, tag, currentUrl, onUploaded, showToast, onView, viewLabel }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <ViewBtn url={currentUrl} label={viewLabel} onView={onView} />
      <UploadBtn vehicleId={vehicleId} tag={tag} currentUrl={currentUrl} onUploaded={onUploaded} showToast={showToast} />
    </div>
  );
}

/* ── Document completion pill ── */
function CompletionPill({ lc, cusdec }) {
  const count  = (lc ? 1 : 0) + (cusdec ? 1 : 0);
  const color  = count === 2 ? '#4ade80' : count === 1 ? '#fb923c' : '#ef4444';
  const bg     = count === 2 ? 'rgba(74,222,128,.1)' : count === 1 ? 'rgba(251,146,60,.1)' : 'rgba(239,68,68,.1)';
  const label  = count === 2 ? 'Complete' : count === 1 ? 'Partial' : 'Missing';
  return (
    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '.65rem', fontWeight: 700,
      background: bg, color, border: `1px solid ${color}33` }}>
      {count}/2 · {label}
    </span>
  );
}

/* ════════════════════════════════════════════
   Main page
   ════════════════════════════════════════════ */
export default function Documents({ showToast }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [q, setQ]               = useState('');
  const [statusF, setStatusF]   = useState('ALL');
  const [docF, setDocF]         = useState('ALL');

  /* PDF viewer state */
  const [pdfUrl, setPdfUrl]     = useState(null);
  const [pdfTitle, setPdfTitle] = useState('');

const openPdf  = useCallback((url, title) => { setPdfUrl(url); setPdfTitle(title); }, []);
  const closePdf = useCallback(() => setPdfUrl(null), []);

  const load = useCallback(() => {
    setLoading(true);
    getVehicles()
      .then(setVehicles)
      .catch(() => showToast('Failed to load vehicles', 'err'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const onUploaded = useCallback((vehicleId, field, url) => {
    setVehicles(vs => vs.map(v => v.id === vehicleId ? { ...v, [field]: url } : v));
  }, []);

  const filtered = vehicles.filter(v => {
    if (statusF !== 'ALL' && v.status !== statusF) return false;
    if (docF === 'COMPLETE' && !(v.lc_pdf_url && v.cusdec_pdf_url)) return false;
    if (docF === 'PARTIAL'  && !((v.lc_pdf_url && !v.cusdec_pdf_url) || (!v.lc_pdf_url && v.cusdec_pdf_url))) return false;
    if (docF === 'MISSING'  && (v.lc_pdf_url || v.cusdec_pdf_url)) return false;
    if (q) {
      const ql = q.toLowerCase();
      return `${v.no} ${v.brand} ${v.model} ${v.chassis || ''} ${v.lc_num || ''}`.toLowerCase().includes(ql);
    }
    return true;
  });

  const totalComplete = vehicles.filter(v => v.lc_pdf_url && v.cusdec_pdf_url).length;
  const totalPartial  = vehicles.filter(v => (v.lc_pdf_url || v.cusdec_pdf_url) && !(v.lc_pdf_url && v.cusdec_pdf_url)).length;
  const totalMissing  = vehicles.filter(v => !v.lc_pdf_url && !v.cusdec_pdf_url).length;

  return (
    <>
      {/* ── PDF viewer overlay ── */}
      {pdfUrl && <PdfViewer url={pdfUrl} title={pdfTitle} onClose={closePdf} />}

<div className="card">
        <div className="card-header">
          <h3>VEHICLE DOCUMENTS</h3>
          <div className="card-header-right" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="search-wrap">
              <i className="fa fa-search" />
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search #no, brand, model, chassis, LC no…" />
            </div>
            <select className="filter" value={statusF} onChange={e => setStatusF(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="SOLD">Sold</option>
              <option value="IN HAND">In Hand</option>
              <option value="ON THE WAY">On The Way</option>
            </select>
            <select className="filter" value={docF} onChange={e => setDocF(e.target.value)}>
              <option value="ALL">All Docs</option>
              <option value="COMPLETE">Complete (2/2)</option>
              <option value="PARTIAL">Partial (1/2)</option>
              <option value="MISSING">Missing (0/2)</option>
            </select>
            <button className="btn-primary" onClick={load} title="Refresh">
              <i className="fa fa-rotate-right" />
            </button>
          </div>
        </div>

        {/* Summary strip */}
        <div style={{ display: 'flex', gap: 12, padding: '10px 0 14px', flexWrap: 'wrap' }}>
          {[
            { label: 'Complete', val: totalComplete, color: '#4ade80', bg: 'rgba(74,222,128,.08)' },
            { label: 'Partial',  val: totalPartial,  color: '#fb923c', bg: 'rgba(251,146,60,.08)' },
            { label: 'Missing',  val: totalMissing,  color: '#ef4444', bg: 'rgba(239,68,68,.08)' },
            { label: 'Total',    val: vehicles.length, color: 'var(--t2)', bg: 'var(--bg3)' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} style={{ flex: 1, minWidth: 90, background: bg,
              border: `1px solid ${color}22`, borderRadius: 10, padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color, fontFamily: "'Josefin Sans', sans-serif" }}>{val}</div>
              <div style={{ fontSize: '.65rem', color: 'var(--t3)', letterSpacing: '.5px', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle</th>
                <th>Chassis</th>
                <th>LC Number</th>
                <th>LC Date</th>
                <th>Status</th>
                <th>LC PDF</th>
                <th>Cusdec PDF</th>
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="loading"><span className="spin" />Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="empty">No vehicles found</td></tr>
              ) : filtered.map(v => {
                const statusCls = v.status === 'SOLD' ? 'b-sold' : v.status === 'IN HAND' ? 'b-inhand' : 'b-onway';
                const lcTitle     = `#${v.no} ${v.brand} ${v.model} — LC PDF`;
                const cusdecTitle = `#${v.no} ${v.brand} ${v.model} — Cusdec PDF`;
                return (
                  <tr key={v.id}>
                    <td><strong style={{ fontFamily: "'Josefin Sans', sans-serif" }}>{v.no}</strong></td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '.82rem' }}>{v.brand} {v.model}</div>
                      <div style={{ fontSize: '.67rem', color: 'var(--t3)' }}>{v.colour || '—'} · {v.type}</div>
                    </td>
                    <td style={{ fontSize: '.74rem', fontFamily: 'monospace', color: 'var(--t2)' }}>{v.chassis || '—'}</td>
                    <td style={{ fontSize: '.74rem', color: 'var(--t2)' }}>{v.lc_num || '—'}</td>
                    <td style={{ fontSize: '.74rem', color: 'var(--t3)' }}>{fmtD(v.lc_date)}</td>
                    <td><span className={`badge ${statusCls}`}>{v.status}</span></td>
                    <td>
                      <DocCell
                        vehicleId={v.id} tag="lc" currentUrl={v.lc_pdf_url}
                        onUploaded={onUploaded} showToast={showToast}
                        onView={openPdf} viewLabel="View LC"
                      />
                    </td>
                    <td>
                      <DocCell
                        vehicleId={v.id} tag="cusdec" currentUrl={v.cusdec_pdf_url}
                        onUploaded={onUploaded} showToast={showToast}
                        onView={openPdf} viewLabel="View Cusdec"
                      />
                    </td>
                    <td><CompletionPill lc={v.lc_pdf_url} cusdec={v.cusdec_pdf_url} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="pag">
          <span className="pag-info">
            {filtered.length} of {vehicles.length} vehicles
            {filtered.length > 0 && ` · ${filtered.filter(v => v.lc_pdf_url && v.cusdec_pdf_url).length} complete`}
          </span>
        </div>
      </div>
    </>
  );
}
