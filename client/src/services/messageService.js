import { db } from '../firebase';
import {
  collection, getDocs, doc, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const COL = 'messages';

export const getMessages = async () => {
  const q = query(collection(db, COL), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createMessage = async (data) => {
  return addDoc(collection(db, COL), {
    ...data,
    is_read: false,
    created_at: serverTimestamp()
  });
};

export const markMessageRead = async (id) => {
  await updateDoc(doc(db, COL, id), { is_read: true });
};

export const deleteMessage = async (id) => {
  await deleteDoc(doc(db, COL, id));
};
