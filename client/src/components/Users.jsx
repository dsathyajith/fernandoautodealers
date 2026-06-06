import React, { useEffect, useState } from 'react';
import { getUsers, deleteUser } from '../services/userService';

const fmtD = d => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

export default function Users({ showToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setUsers(await getUsers()); }
    catch { showToast('Failed to load users', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const del = async (u) => {
    if (!confirm(`Delete user "${u.username || u.email}"?`)) return;
    try {
      await deleteUser(u.id);
      setUsers(us => us.filter(x => x.id !== u.id));
      showToast('User deleted', 'ok');
    } catch { showToast('Delete failed', 'err'); }
  };

  return (
    <div className="card">
      <div className="card-header"><h3>USER ACCOUNTS</h3></div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>#</th><th>Username</th><th>Full Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="loading"><span className="spin" />Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="7" className="empty">No user accounts</td></tr>
            ) : users.map((u, i) => (
              <tr key={u.id}>
                <td>{i + 1}</td>
                <td><strong>{u.username}</strong></td>
                <td>{u.name || '—'}</td>
                <td style={{ fontSize: '.76rem' }}>{u.email || '—'}</td>
                <td><span className={`badge ${u.role === 'admin' ? 'b-profit' : 'b-local'}`}>{u.role || 'user'}</span></td>
                <td style={{ fontSize: '.72rem' }}>{fmtD(u.created_at)}</td>
                <td><button className="ac del" onClick={() => del(u)}><i className="fa fa-trash" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
