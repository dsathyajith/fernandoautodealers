import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { changePassword } from '../services/authService';

export default function Settings({ showToast }) {
  const { username, user } = useAuth();
  const [cur, setCur] = useState('');
  const [np, setNp] = useState('');
  const [cp, setCp] = useState('');
  const [saving, setSaving] = useState(false);

  const savePwd = async () => {
    if (!cur || !np || !cp) { showToast('Fill in all password fields', 'err'); return; }
    if (np !== cp) { showToast('Passwords do not match', 'err'); return; }
    if (np.length < 6) { showToast('Min 6 characters', 'err'); return; }
    setSaving(true);
    try {
      await changePassword(cur, np);
      showToast('Password changed!', 'ok');
      setCur(''); setNp(''); setCp('');
    } catch (e) {
      const msg = e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential'
        ? 'Current password is incorrect'
        : e.message || 'Failed';
      showToast(msg, 'err');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 400 }}>
      <div className="card-header"><h3>CHANGE PASSWORD</h3></div>
      <div className="card-body">
        <div className="form-row">
          <label>Email</label>
          <input type="text" value={user?.email || username} readOnly style={{ opacity: .5 }} />
        </div>
        <div className="form-row">
          <label>Current Password</label>
          <input type="password" value={cur} onChange={e => setCur(e.target.value)} placeholder="Current password" />
        </div>
        <div className="form-row">
          <label>New Password</label>
          <input type="password" value={np} onChange={e => setNp(e.target.value)} placeholder="Min 6 chars" />
        </div>
        <div className="form-row">
          <label>Confirm New Password</label>
          <input type="password" value={cp} onChange={e => setCp(e.target.value)} placeholder="Confirm" />
        </div>
        <button className="btn-save" style={{ width: '100%', marginTop: 4 }} onClick={savePwd} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
