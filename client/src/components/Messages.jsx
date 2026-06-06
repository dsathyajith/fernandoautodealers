import React, { useEffect, useState } from 'react';
import { getMessages, markMessageRead, deleteMessage } from '../services/messageService';

const fmtD = d => { if (!d) return '—'; return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };

export default function Messages({ showToast }) {
  const [msgs, setMsgs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      setMsgs(await getMessages());
    } catch { showToast('Failed to load messages', 'err'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    await markMessageRead(id);
    setMsgs(m => m.map(x => x.id === id ? { ...x, is_read: true } : x));
  };

  const del = async (id) => {
    if (!confirm('Delete this message?')) return;
    await deleteMessage(id);
    setMsgs(m => m.filter(x => x.id !== id));
    showToast('Message deleted', 'ok');
  };

  if (loading) return <div className="loading"><span className="spin" />Loading…</div>;

  return (
    <div>
      {msgs.length === 0 && <div className="loading">No messages</div>}
      {msgs.map(m => (
        <div key={m.id} className={`msg ${!m.is_read ? 'unread' : ''}`}>
          <div className="msg-top">
            <span className="msg-name">{m.name}</span>
            <span className="msg-time">{fmtD(m.created_at)}</span>
          </div>
          <div className="msg-email">{m.email}</div>
          <div className="msg-subject">{m.subject}</div>
          <div className="msg-body">{m.body}</div>
          <div className="msg-actions">
            {!m.is_read && <button className="ac ok" onClick={() => markRead(m.id)}><i className="fa fa-check" /> Mark Read</button>}
            <button className="ac del" onClick={() => del(m.id)}><i className="fa fa-trash" /> Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
