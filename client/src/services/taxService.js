import { db, storage } from '../firebase';
import {
  collection, getDocs, doc, setDoc,
  deleteDoc, query, orderBy, where
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const COL = 'taxEntries';

export const getTaxMonths = async (vehicles) => {
  const entriesSnap = await getDocs(collection(db, COL));
  const entryMap = {};
  entriesSnap.docs.forEach(d => { entryMap[d.data().month_key] = { id: d.id, ...d.data() }; });

  const monthMap = {};
  vehicles
    .filter(v => v.status === 'SOLD' && v.sell_date)
    .forEach(v => {
      const d = new Date(v.sell_date);
      const mk = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthMap[mk]) monthMap[mk] = { month_key: mk, month_label: label, yr: d.getFullYear(), mo: d.getMonth() + 1, count: 0, turnover: 0, profit: 0 };
      monthMap[mk].count++;
      monthMap[mk].turnover += v.sell_price || 0;
      monthMap[mk].profit += v.income || 0;
    });

  return Object.values(monthMap)
    .sort((a, b) => b.month_key.localeCompare(a.month_key))
    .map(m => ({
      ...m,
      sscl_saved: entryMap[m.month_key]?.sscl ?? null,
      vat_saved: entryMap[m.month_key]?.vat_amount ?? null,
      notes_saved: entryMap[m.month_key]?.notes ?? '',
      sscl_slip: entryMap[m.month_key]?.sscl_slip ?? '',
      sscl_slip_name: entryMap[m.month_key]?.sscl_slip_name ?? '',
      vat_slip: entryMap[m.month_key]?.vat_slip ?? '',
      vat_slip_name: entryMap[m.month_key]?.vat_slip_name ?? '',
      has_entry: !!entryMap[m.month_key]
    }));
};

export const getTaxEntries = async () => {
  const q = query(collection(db, COL), orderBy('month_key', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

const uploadSlip = async (file, monthKey, prefix) => {
  const slipRef = ref(storage, `slips/${prefix}_${monthKey}`);
  await uploadBytes(slipRef, file);
  return getDownloadURL(slipRef);
};

export const saveTaxEntry = async (monthKey, data, ssclFile, vatFile) => {
  const docRef = doc(db, COL, monthKey);
  const existing = (await getDocs(query(collection(db, COL), where('month_key', '==', monthKey)))).docs[0]?.data() || {};

  let sscl_slip = existing.sscl_slip || '';
  let sscl_slip_name = existing.sscl_slip_name || '';
  let vat_slip = existing.vat_slip || '';
  let vat_slip_name = existing.vat_slip_name || '';

  if (ssclFile) {
    sscl_slip = await uploadSlip(ssclFile, monthKey, 'sscl');
    sscl_slip_name = ssclFile.name;
  }
  if (vatFile) {
    vat_slip = await uploadSlip(vatFile, monthKey, 'vat');
    vat_slip_name = vatFile.name;
  }

  await setDoc(docRef, {
    month_key: monthKey,
    month_label: data.month_label || monthKey,
    year: data.year || 0,
    month: data.month || 0,
    vehicles_count: data.vehicles_count || 0,
    turnover: data.turnover || 0,
    profit: data.profit || 0,
    sscl: data.sscl || 0,
    vat_amount: data.vat_amount || 0,
    notes: data.notes || '',
    sscl_slip,
    sscl_slip_name,
    vat_slip,
    vat_slip_name
  }, { merge: true });
};

export const deleteTaxEntry = async (monthKey) => {
  await deleteDoc(doc(db, COL, monthKey));
};

export const deleteSlip = async (monthKey, type) => {
  const field = type === 'vat' ? 'vat_slip' : 'sscl_slip';
  const nameField = type === 'vat' ? 'vat_slip_name' : 'sscl_slip_name';
  await setDoc(doc(db, COL, monthKey), { [field]: '', [nameField]: '' }, { merge: true });
};
