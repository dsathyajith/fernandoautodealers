import React, { useState, useEffect, useRef } from 'react';
import { createVehicle, updateVehicle } from '../services/vehicleService';

const EMPTY = {
  status: 'ON THE WAY', type: 'IMPORT', brand: '', model: '', chassis: '', colour: '',
  mileage: '', grade: '', lc_date: '', lc_num: '', tt_lkr: '', lc_lkr: '', duty: '',
  others: '', cusdec: '', clear_date: '', cost: '', sell_date: '', sell_price: '', income: '',
  contact: '', notes: '', image: ''
};

export default function VehicleModal({ open, vehicle, onClose, onSaved, showToast }) {
  const [form, setForm] = useState(EMPTY);
  const [imgPreview, setImgPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  useEffect(() => {
    if (vehicle) {
      const f = { ...EMPTY };
      Object.keys(EMPTY).forEach(k => { f[k] = vehicle[k] != null ? String(vehicle[k]) : ''; });
      if (vehicle.lc_date) f.lc_date = vehicle.lc_date.split('T')[0];
      if (vehicle.clear_date) f.clear_date = vehicle.clear_date.split('T')[0];
      if (vehicle.sell_date) f.sell_date = vehicle.sell_date.split('T')[0];
      setForm(f);
      setImgPreview(vehicle.imageUrl || null);
    } else {
      setForm(EMPTY);
      setImgPreview(null);
    }
  }, [vehicle, open]);

  const set = (k, v) => setForm(f => {
    const nf = { ...f, [k]: v };
    // Auto-calc cost and income
    const tt = parseFloat(nf.tt_lkr) || 0;
    const lc = parseFloat(nf.lc_lkr) || 0;
    const du = parseFloat(nf.duty) || 0;
    const ot = parseFloat(nf.others) || 0;
    if ((k === 'tt_lkr' || k === 'lc_lkr' || k === 'duty' || k === 'others') && (tt || lc || du || ot)) {
      nf.cost = (tt + lc + du + ot).toFixed(2);
    }
    if (k !== 'income') {
      const cost = parseFloat(nf.cost) || 0;
      const sell = parseFloat(nf.sell_price) || 0;
      if (cost && sell) nf.income = (sell - cost).toFixed(2);
    }
    return nf;
  });

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setImgPreview(ev.target.result);
    reader.readAsDataURL(f);
  };

  const save = async () => {
    if (!form.brand.trim() || !form.model.trim()) {
      showToast('Brand and Model required', 'err'); return;
    }
    setSaving(true);
    try {
      const imageFile = fileRef.current?.files[0] || null;
      if (vehicle?.id) {
        await updateVehicle(vehicle.id, form, imageFile);
        showToast('Vehicle updated!', 'ok');
      } else {
        await createVehicle(form, imageFile);
        showToast('Vehicle added!', 'ok');
      }
      onSaved();
      onClose();
    } catch (e) {
      showToast(e.message || 'Save failed', 'err');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3>{vehicle ? `EDIT VEHICLE #${vehicle.no}` : 'ADD NEW VEHICLE'}</h3>
        <div className="modal-grid">
          <div className="form-row">
            <label>Status *</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option>SOLD</option><option>IN HAND</option><option>ON THE WAY</option>
            </select>
          </div>
          <div className="form-row">
            <label>Type *</label>
            <select value={form.type} onChange={e => set('type', e.target.value)}>
              <option>LOCAL</option><option>IMPORT</option>
            </select>
          </div>
          <div className="form-row">
            <label>Brand *</label>
            <input value={form.brand} onChange={e => set('brand', e.target.value)} placeholder="Toyota / Honda / Suzuki" />
          </div>
          <div className="form-row">
            <label>Model *</label>
            <input value={form.model} onChange={e => set('model', e.target.value)} placeholder="Yaris X (2024)" />
          </div>
          <div className="form-row">
            <label>Chassis</label>
            <input value={form.chassis} onChange={e => set('chassis', e.target.value)} placeholder="KSP210-…" />
          </div>
          <div className="form-row">
            <label>Colour</label>
            <input value={form.colour} onChange={e => set('colour', e.target.value)} placeholder="Pearl White" />
          </div>
          <div className="form-row">
            <label>Mileage</label>
            <input value={form.mileage} onChange={e => set('mileage', e.target.value)} placeholder="5 KM" />
          </div>
          <div className="form-row">
            <label>Grade</label>
            <input value={form.grade} onChange={e => set('grade', e.target.value)} placeholder="S / 4.5 / 5" />
          </div>
          <div className="form-row">
            <label>LC Date</label>
            <input type="date" value={form.lc_date} onChange={e => set('lc_date', e.target.value)} />
          </div>
          <div className="form-row">
            <label>LC Number</label>
            <input value={form.lc_num} onChange={e => set('lc_num', e.target.value)} placeholder="DCSPABC…" />
          </div>
          <div className="form-row">
            <label>TT (LKR)</label>
            <input type="number" value={form.tt_lkr} onChange={e => set('tt_lkr', e.target.value)} placeholder="0" />
          </div>
          <div className="form-row">
            <label>LC (LKR)</label>
            <input type="number" value={form.lc_lkr} onChange={e => set('lc_lkr', e.target.value)} placeholder="0" />
          </div>
          <div className="form-row">
            <label>Duty (LKR)</label>
            <input type="number" value={form.duty} onChange={e => set('duty', e.target.value)} placeholder="0" />
          </div>
          <div className="form-row">
            <label>Others (LKR)</label>
            <input type="number" value={form.others} onChange={e => set('others', e.target.value)} placeholder="0" />
          </div>
          <div className="form-row">
            <label>CUSDEC</label>
            <input value={form.cusdec} onChange={e => set('cusdec', e.target.value)} placeholder="HBIM1|…" />
          </div>
          <div className="form-row">
            <label>Clearing Date</label>
            <input type="date" value={form.clear_date} onChange={e => set('clear_date', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Cost (LKR) <small style={{ color: 'var(--g)' }}>(auto)</small></label>
            <input type="number" value={form.cost} onChange={e => set('cost', e.target.value)} placeholder="TT+LC+Duty+Others" />
          </div>
          <div className="form-row">
            <label>Sell Date</label>
            <input type="date" value={form.sell_date} onChange={e => set('sell_date', e.target.value)} />
          </div>
          <div className="form-row">
            <label>Sell Price (LKR)</label>
            <input type="number" value={form.sell_price} onChange={e => set('sell_price', e.target.value)} placeholder="0" />
          </div>
          <div className="form-row">
            <label>Income (LKR) <small style={{ color: 'var(--g)' }}>(auto)</small></label>
            <input type="number" value={form.income} onChange={e => set('income', e.target.value)} placeholder="Auto" />
          </div>
          <div className="form-row">
            <label>Contact</label>
            <input value={form.contact} onChange={e => set('contact', e.target.value)} placeholder="07X XXX XXXX" />
          </div>
          <div className="form-row full">
            <label>Notes</label>
            <textarea rows="2" value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Any notes…" />
          </div>
          <div className="form-row full">
            <label>Vehicle Photo</label>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImg} />
            {imgPreview && <img src={imgPreview} className="img-prev" alt="preview" />}
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Vehicle'}
          </button>
        </div>
      </div>
    </div>
  );
}
