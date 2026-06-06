import { getVehicles } from './vehicleService';

export const getLCVehicles = async (search = '', sortDir = 'desc') => {
  const all = await getVehicles();
  let filtered = all.filter(v => v.lc_num && v.lc_num.trim() !== '');

  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(v =>
      (v.brand || '').toLowerCase().includes(q) ||
      (v.model || '').toLowerCase().includes(q) ||
      (v.lc_num || '').toLowerCase().includes(q) ||
      (v.chassis || '').toLowerCase().includes(q)
    );
  }

  filtered.sort((a, b) => {
    const da = a.lc_date || '';
    const db2 = b.lc_date || '';
    return sortDir === 'asc' ? da.localeCompare(db2) : db2.localeCompare(da);
  });

  return filtered;
};
