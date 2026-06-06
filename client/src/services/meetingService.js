import { db } from '../firebase';
import {
  collection, getDocs, doc, addDoc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

const COL = 'meetings';

export const getMeetings = async () => {
  const q = query(collection(db, COL), orderBy('meeting_date', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const createMeeting = async (data) => {
  return addDoc(collection(db, COL), {
    ...data,
    status: 'pending',
    created_at: serverTimestamp()
  });
};

export const updateMeetingStatus = async (id, status) => {
  await updateDoc(doc(db, COL, id), { status });
};

export const deleteMeeting = async (id) => {
  await deleteDoc(doc(db, COL, id));
};
