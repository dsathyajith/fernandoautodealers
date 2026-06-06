import { db } from '../firebase';
import {
  collection, getDocs, doc,
  deleteDoc, query, orderBy
} from 'firebase/firestore';

const COL = 'adminUsers';

export const getUsers = async () => {
  const q = query(collection(db, COL), orderBy('created_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const deleteUser = async (id) => {
  await deleteDoc(doc(db, COL, id));
};
