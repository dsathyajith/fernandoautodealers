import { db, storage } from '../firebase';
import {
  collection, addDoc, getDocs, getDoc, doc,
  updateDoc, deleteDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const COL = 'vehicles';

const toNum = v => (v !== undefined && v !== null && v !== '' ? parseFloat(v) : null);

export const getVehicles = async () => {
  const q = query(collection(db, COL), orderBy('no', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

export const getVehicle = async (id) => {
  const snap = await getDoc(doc(db, COL, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getNextNo = async () => {
  const snap = await getDocs(collection(db, COL));
  if (snap.empty) return 1;
  const max = Math.max(...snap.docs.map(d => d.data().no || 0));
  return max + 1;
};

const uploadImage = async (file, vehicleId) => {
  const imgRef = ref(storage, `vehicles/${vehicleId}_${Date.now()}`);
  await uploadBytes(imgRef, file);
  return getDownloadURL(imgRef);
};

export const createVehicle = async (data, imageFile) => {
  const no = await getNextNo();
  const cost = toNum(data.cost);
  const sell = toNum(data.sell_price);
  const income = toNum(data.income) ?? (cost && sell ? sell - cost : null);

  const docRef = await addDoc(collection(db, COL), {
    no,
    status: data.status || null,
    type: data.type || null,
    brand: data.brand,
    model: data.model,
    year: data.year || null,
    chassis: data.chassis || null,
    colour: data.colour || null,
    mileage: data.mileage || null,
    grade: data.grade || null,
    lc_date: data.lc_date || null,
    lc_num: data.lc_num || null,
    tt_lkr: toNum(data.tt_lkr),
    lc_lkr: toNum(data.lc_lkr),
    duty: toNum(data.duty),
    others: toNum(data.others),
    cusdec: data.cusdec || null,
    clear_date: data.clear_date || null,
    cost,
    sell_date: data.sell_date || null,
    sell_price: sell,
    income,
    contact: data.contact || null,
    notes: data.notes || null,
    imageUrl: null,
    createdAt: serverTimestamp()
  });

  if (imageFile) {
    const url = await uploadImage(imageFile, docRef.id);
    await updateDoc(docRef, { imageUrl: url });
  }

  return { id: docRef.id, no };
};

export const updateVehicle = async (id, data, imageFile) => {
  const cost = toNum(data.cost);
  const sell = toNum(data.sell_price);
  const income = toNum(data.income) ?? (cost && sell ? sell - cost : null);

  const payload = {
    status: data.status || null,
    type: data.type || null,
    brand: data.brand,
    model: data.model,
    year: data.year || null,
    chassis: data.chassis || null,
    colour: data.colour || null,
    mileage: data.mileage || null,
    grade: data.grade || null,
    lc_date: data.lc_date || null,
    lc_num: data.lc_num || null,
    tt_lkr: toNum(data.tt_lkr),
    lc_lkr: toNum(data.lc_lkr),
    duty: toNum(data.duty),
    others: toNum(data.others),
    cusdec: data.cusdec || null,
    clear_date: data.clear_date || null,
    cost,
    sell_date: data.sell_date || null,
    sell_price: sell,
    income,
    contact: data.contact || null,
    notes: data.notes || null
  };

  if (imageFile) {
    payload.imageUrl = await uploadImage(imageFile, id);
  }

  await updateDoc(doc(db, COL, id), payload);
};

export const sellVehicle = async (id, { sell_price, sell_date, contact }) => {
  const vehicle = await getVehicle(id);
  if (!vehicle) throw new Error('Vehicle not found');

  const sell = parseFloat(sell_price);
  const tt = vehicle.tt_lkr || 0;
  const lc = vehicle.lc_lkr || 0;
  const du = vehicle.duty || 0;
  const ot = vehicle.others || 0;
  const co = vehicle.cost || 0;
  const finalCost = (tt + lc + du + ot) > 0 ? (tt + lc + du + ot) : co;
  const income = finalCost && sell ? sell - finalCost : null;

  await updateDoc(doc(db, COL, id), {
    status: 'SOLD',
    sell_price: sell,
    sell_date: sell_date || null,
    contact: contact || null,
    income
  });

  return income;
};

export const deleteVehicle = async (id) => {
  await deleteDoc(doc(db, COL, id));
};
