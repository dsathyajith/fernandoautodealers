import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKm800UExbE0Qc09vPkhi6-uFBSDwq4qE",
  authDomain: "fernando-auto-dealers.firebaseapp.com",
  projectId: "fernando-auto-dealers",
  storageBucket: "fernando-auto-dealers.firebasestorage.app",
  messagingSenderId: "277282668411",
  appId: "1:277282668411:web:279a863e6eb6365dcbc7de",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// All 47 vehicles from the Excel sheet
// Status logic: SOLD = has sell_price | IN HAND = has cost but no sell | ON THE WAY = no cost
const vehicles = [
  { no:1,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2024)',             chassis:'KSP210-0114827',    colour:'Bronze',       tt_lkr:2734000,    lc_lkr:2606000,      duty:4464636,    others:270000,    cost:10074636,     sell_price:10300000,    income:225364,      status:'SOLD' },
  { no:2,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0090499',    colour:'Bronze',                                                                                    cost:9600000,      sell_price:10050000,    income:450000,      status:'SOLD' },
  { no:3,  type:'IMPORT', brand:'Nissan',  model:'Almera VL (2025)',           chassis:'MNTBAAN18Z0064962', colour:'Pearl White',  tt_lkr:2450000,    lc_lkr:4980000,      duty:6211286,    others:546000,    cost:14187286,     sell_price:14450000,    income:262714,      status:'SOLD' },
  { no:4,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0093682',    colour:'Light Blue',                                                                                cost:9750000,      sell_price:10200000,    income:450000,      status:'SOLD' },
  { no:5,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0090832',    colour:'Dark Blue',                                                                                 cost:9550000,      sell_price:9900000,     income:350000,      status:'SOLD' },
  { no:6,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0091646',    colour:'Pearl White',                                                                               cost:9750000,      sell_price:10225000,    income:475000,      status:'SOLD' },
  { no:7,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0091821',    colour:'White',                                                                                     cost:9750000,      sell_price:10250000,    income:500000,      status:'SOLD' },
  { no:8,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0092128',    colour:'White',                                                                                     cost:9750000,      sell_price:10250000,    income:500000,      status:'SOLD' },
  { no:9,  type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0108276',    colour:'Pearl White',                                                                               cost:9750000,      sell_price:10325000,    income:575000,      status:'SOLD' },
  { no:10, type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0099935',    colour:'Bronze',                                                                                    cost:9750000,      sell_price:10225000,    income:475000,      status:'SOLD' },
  { no:11, type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0105029',    colour:'Black',                                                                                     cost:9750000,      sell_price:10282000,    income:532000,      status:'SOLD' },
  { no:12, type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0099022',    colour:'Pearl White',                                                                               cost:9750000,      sell_price:10130000,    income:380000,      status:'SOLD' },
  { no:13, type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0099081',    colour:'Pearl White',                                                                               cost:9650000,      sell_price:8700000,     income:-950000,     status:'SOLD' },
  { no:14, type:'IMPORT', brand:'Honda',   model:'Vezel X (2024)',             chassis:'RV5-1229019',       colour:'Pearl White',                                                                               cost:17500000,     sell_price:18025000,    income:525000,      status:'SOLD' },
  { no:15, type:'IMPORT', brand:'Toyota',  model:'Yaris X (2024)',             chassis:'KSP210-0127097',    colour:'Bronze',                                                                                    cost:9800000,      sell_price:10300000,    income:500000,      status:'SOLD' },
  { no:16, lc_date:'2025-09-22', lc_num:'DCSPABC024252552', type:'IMPORT', brand:'Toyota',  model:'Raize Z (2025)',              chassis:'A210A-0098718',     colour:'Pearl White',  tt_lkr:3108000,    lc_lkr:3821602,      duty:5083469,    others:108528,    cusdec:'HBIM1 | 45476',  clear_date:'2025-11-11', cost:12121599,     sell_date:'2025-12-13', sell_price:12475000,    income:353401,      contact:'077 433 2205', status:'SOLD' },
  { no:17, lc_date:'2025-09-29', lc_num:'DCSPABC024252631', type:'IMPORT', brand:'Suzuki',  model:'Wagonr ZX (2025)',            chassis:'MH95S-290809',      colour:'Pearl White',  tt_lkr:2307000,    lc_lkr:2420500,      duty:3984541,    others:105132,    cusdec:'HBIM1| 45475',   clear_date:'2025-11-11', cost:8817173,      sell_date:'2025-11-27', sell_price:9000000,     income:182827,      contact:'076 742 5100', status:'SOLD' },
  { no:18, lc_date:'2025-10-03', lc_num:'DCSPABC024252720', type:'IMPORT', brand:'Toyota',  model:'Raize Z (2025)',              chassis:'A210A-0098325',     colour:'Pearl White',  tt_lkr:3003000,    lc_lkr:3831193,      duty:5085785,    others:73540,     cusdec:'HBIM1 | 53143',  clear_date:'2025-12-12', cost:11993518,     sell_date:'2025-12-24', sell_price:12700000,    income:706482,      contact:'071 750 5932', status:'SOLD' },
  { no:19, lc_date:'2025-11-21', lc_num:'DCSPABC024253315', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2023)',      chassis:'M900A-1079194',     colour:'Black',        tt_lkr:607825,     lc_lkr:3720567,      duty:4963374,    others:70768,     cusdec:'HBIM1 | 1000',   clear_date:'2026-01-06', cost:9362534,      sell_date:'2026-01-12', sell_price:9875000,     income:512466,      contact:'077 908 9447', status:'SOLD' },
  { no:20, lc_date:'2025-12-01', lc_num:'DCSPABC024253388', type:'IMPORT', brand:'Suzuki',  model:'Wagon R ZX (2025)',           chassis:'MH955-293105',      colour:'Pearl White',  tt_lkr:1451044,    lc_lkr:2529337.5,    duty:4034811,    others:71000,     cusdec:'HBIM1 | 6045',   clear_date:'2026-02-06', cost:8086192.5,    sell_date:'2026-02-10', sell_price:8737000,     income:650807.5,    contact:'071 574 2726', status:'SOLD' },
  { no:21, lc_date:'2025-12-01', lc_num:'DCSPABC024253388', type:'IMPORT', brand:'Suzuki',  model:'Wagon R ZX (2025)',           chassis:'MH955-293183',      colour:'Pearl White',  tt_lkr:1428308,    lc_lkr:2491837.5,    duty:3988178,    others:83965,     cusdec:'HBIM1 | 3635',   clear_date:'2026-01-20', cost:7992288.5,    sell_date:'2026-02-02', sell_price:8700000,     income:707711.5,    contact:'075 278 7287', status:'SOLD' },
  { no:22, lc_date:'2025-12-12', lc_num:'DCSPABC024253545', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2025)',      chassis:'M900A-1217615',     colour:'Pearl White',  tt_lkr:1624000,    lc_lkr:3387162.25,   duty:4906965,    others:88291,     cusdec:'HBIM1 | 3632',   clear_date:'2026-01-20', cost:10006418.25,  sell_date:'2026-01-29', sell_price:10797000,    income:790581.75,   contact:'076 053 1734', status:'SOLD' },
  { no:23, lc_date:'2025-12-22', lc_num:'DCSPABC024253671', type:'IMPORT', brand:'Honda',   model:'Vezel Z Premium (2025)',      chassis:'RV5-1312390',       colour:'Green',        tt_lkr:3385222.5,  lc_lkr:4893998,      duty:9014431,    others:72950,     cusdec:'HBIM1| 7180',    clear_date:'2026-02-11', cost:17366601.5,   sell_date:'2026-02-26', sell_price:18500000,    income:1133398.5,   contact:'077 302 8285', status:'SOLD' },
  { no:24, lc_date:'2025-12-22', lc_num:'DCSPABC024253671', type:'IMPORT', brand:'Honda',   model:'Vezel Z Premium (2025)',      chassis:'RV5-1304619',       colour:'Pearl White',  tt_lkr:3418800,    lc_lkr:4893998,      duty:9014431,    others:72950,     cusdec:'HBIM1| 7187',    clear_date:'2026-02-11', cost:17400179,     sell_date:'2026-02-22', sell_price:18525000,    income:1124821,     contact:'071 220 3779', status:'SOLD' },
  { no:25, lc_date:'2025-12-23', lc_num:'DCSPABC024253679', type:'IMPORT', brand:'Toyota',  model:'Raize Z (2025)',              chassis:'A210A-0101629',     colour:'Pearl White',  tt_lkr:2612940,    lc_lkr:3885771,      duty:5061847,    others:88300,     cusdec:'HBIM1| 7930',    clear_date:'2026-02-12', cost:11648858,     sell_date:'2026-02-19', sell_price:12213758,    income:564900,      contact:'077 711 7574', status:'SOLD' },
  { no:26, lc_date:'2026-01-22', lc_num:'DCSPABC024260184', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom G (2023)',       chassis:'M900A-1074985',     colour:'Dark Blue',    tt_lkr:634886,     lc_lkr:2955000,      duty:4811695,    others:71850,     cusdec:'HBIM1| 12159',   clear_date:'2026-03-10', cost:8473431,      sell_date:'2026-03-14', sell_price:8911795,     income:438364,      contact:'078 385 1765', status:'SOLD' },
  { no:27, lc_date:'2026-02-06', lc_num:'DCSPABC024260367', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2025)',      chassis:'M900A-1232550',     colour:'Pearl White',  tt_lkr:1812384,    lc_lkr:3372802.7,    duty:4922605,    others:82050,     cusdec:'HBIM1| 15319',   clear_date:'2026-03-23', cost:10189841.7,   sell_date:'2026-04-02', sell_price:11000000,    income:810158.3,    contact:'071 274 8750', status:'SOLD' },
  { no:28, lc_date:'2026-02-06', lc_num:'DCSPABC024260367', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2026)',      chassis:'M900A-1241500',     colour:'Pearl White',  tt_lkr:1834308,    lc_lkr:3372802.7,    duty:4922605,    others:82050,     cusdec:'HBIM1| 15324',   clear_date:'2026-03-23', cost:10211765.7,   sell_date:'2026-03-30', sell_price:10925000,    income:713234.3,    contact:'077 304 9255', status:'SOLD' },
  { no:29, lc_date:'2026-02-09', lc_num:'DCSPABC024260380', type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',             chassis:'KSP210-0102790',    colour:'Pearl White',  tt_lkr:1225511,    lc_lkr:2471000,      duty:4439981,    others:80500,     cusdec:'HBIM1| 15312',   clear_date:'2026-03-23', cost:8216992,      sell_date:'2026-04-02', sell_price:8686382,     income:469390,      contact:'071 616 0662', status:'SOLD' },
  { no:30, lc_date:'2026-02-19', lc_num:'DCSPABC024260566', type:'IMPORT', brand:'Honda',   model:'Vezel Z Premium (2026)',      chassis:'RV5-1319597',       colour:'Gray',         tt_lkr:3273384,    lc_lkr:4900000,      duty:9028163,    others:73100,     cusdec:'HBIM1| 19990',   clear_date:'2026-04-17', cost:17274647,     sell_date:'2026-04-24', sell_price:17905823,    income:631176,      contact:'074 085 0066', status:'SOLD' },
  { no:31, lc_date:'2026-02-25', lc_num:'DCSPABC024260668', type:'IMPORT', brand:'Honda',   model:'Vezel RS (2025)',             chassis:'RV5-1302676',       colour:'Pearl White',  tt_lkr:2070762,    lc_lkr:5728067.78,   duty:9862444,    others:73100,     cusdec:'HBIM1| 19737',   clear_date:'2026-04-17', cost:17734373.78,  sell_date:'2026-05-13', sell_price:18950000,    income:1215626.22,  contact:'077 304 3283', status:'SOLD' },
  { no:32, lc_date:'2026-03-03', lc_num:'DCSPABC024260722', type:'IMPORT', brand:'Honda',   model:'Vezel Z Premium (2025)',      chassis:'RV5-1266115',       colour:'Pearl White',  tt_lkr:2908745,    lc_lkr:4925827.18,   duty:9028163,    others:73100,     cusdec:'HBIM1| 19733',   clear_date:'2026-04-17', cost:16935835.18,  sell_date:'2026-05-04', sell_price:18025000,    income:1089164.82,  contact:'077 197 5229', status:'SOLD' },
  { no:33, lc_date:'2026-03-09', lc_num:'DB4167LC2602860',  type:'IMPORT', brand:'Toyota',  model:'Yaris G (2023)',              chassis:'KSP210-0109422',    colour:'Black',        tt_lkr:1400814,    lc_lkr:2600000,      duty:4642593,    others:71400,     cusdec:'HBIM1| 19991',   clear_date:'2026-04-17', cost:8714807,      sell_date:'2026-04-23', sell_price:9224157,     income:509350,      contact:'074 979 4203', status:'SOLD' },
  { no:34, lc_date:'2026-03-19', lc_num:'DCSPABC024260998', type:'IMPORT', brand:'Suzuki',  model:'Wagonr ZX (2026)',            chassis:'MH95S-303499',      colour:'Pearl White',  tt_lkr:1354080,    lc_lkr:2731872.65,   duty:4012334,    others:83500,     cusdec:'HBIM1| 23432',   clear_date:'2026-04-24', cost:8181786.65,   sell_date:'2026-05-14', sell_price:9000000,     income:818213.35,   contact:'071 724 5111', status:'SOLD' },
  { no:35, lc_date:'2026-03-19', lc_num:'DCSPABC024260998', type:'IMPORT', brand:'Suzuki',  model:'Wagonr FX (2025)',            chassis:'MH85S-232797',      colour:'Pearl White',  tt_lkr:1077219,    lc_lkr:2124789.84,   duty:3562410,    others:83500,     cusdec:'HBIM1| 23438',   clear_date:'2026-04-24', cost:6847918.84,   sell_date:'2026-05-08', sell_price:7550000,     income:702081.16,   contact:'076 390 3792', status:'SOLD' },
  { no:36, lc_date:'2026-04-01', lc_num:'DCSPABC024261398', type:'IMPORT', brand:'Suzuki',  model:'Wagonr ZX (2026)',            chassis:'MH95S-304685',      colour:'Pearl White',  tt_lkr:1576143.9,  lc_lkr:3054795,      duty:4157107,    others:82759,     cusdec:'HBIM1| 30825',   clear_date:'2026-05-21', cost:8870804.9,                                                                                    status:'IN HAND' },
  { no:37, lc_date:'2026-04-15', lc_num:'DCSPABC011261503', type:'IMPORT', brand:'Toyota',  model:'Yaris G (2023)',              chassis:'KSP210-0106805',    colour:'Light Pink',   tt_lkr:1216560,    lc_lkr:2600000,      duty:4891194,    others:87174,     cusdec:'HBIM1| 29664',   clear_date:'2026-05-19', cost:8794928,                          sell_price:9462078,     income:667150,                          status:'SOLD' },
  { no:38, lc_date:'2026-04-16', lc_num:'DCSPABC024261529', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2025)',      chassis:'M900A-1252379',     colour:'Pearl White',  tt_lkr:2170285.5,  lc_lkr:3841577.85,   duty:5216633,    others:76314,     cusdec:'HBIM1| 30781',   clear_date:'2026-05-21', cost:11304810.35,                                                                                   status:'IN HAND' },
  { no:39, lc_date:'2026-04-17', lc_num:'DILS260002024928', type:'IMPORT', brand:'Toyota',  model:'Raize Z (2025)',              chassis:'A202A-0113842',     colour:'Pearl White',  tt_lkr:3278855.25, lc_lkr:3700000,      duty:6457731,    others:82000,     cusdec:'HBIM1| 31536',   clear_date:'2026-05-25', cost:13518586.25,                      sell_price:13768586.25, income:250000,                          status:'SOLD' },
  { no:40, lc_date:'2026-04-27', lc_num:'TF2611753901',      type:'IMPORT', brand:'Toyota',  model:'Yaris X (2025)',              chassis:'KSP210-0142399',    colour:'Pearl White',  tt_lkr:1949365.5,  lc_lkr:2500000,      duty:4449365.5,  others:250000,                                                                                                                                                        status:'ON THE WAY' },
  { no:41, lc_date:'2026-05-15', lc_num:'DCSPABC024261923', type:'IMPORT', brand:'Suzuki',  model:'Wagonr ZX (2026)',            chassis:'MH95S-306466',      colour:'Pearl White',  tt_lkr:1675814.4,  lc_lkr:158146.19,                                                                                                                                                                                             status:'ON THE WAY' },
  { no:42, lc_date:'2026-05-15', lc_num:'DCSPABC024261923', type:'IMPORT', brand:'Suzuki',  model:'Wagonr ZX (2026)',            chassis:'MH95S-306808',      colour:'Pearl White',  tt_lkr:1669075.2,  lc_lkr:158146.19,                                                                                                                                                                                             status:'ON THE WAY' },
  { no:43, lc_date:'2026-05-15', lc_num:'DCSPABC024261923', type:'IMPORT', brand:'Toyota',  model:'Yaris X (2023)',              chassis:'KSP210-0108577',    colour:'Silver',       tt_lkr:1668108,    lc_lkr:146431.66,                                                                                                                                                                                             status:'ON THE WAY' },
  { no:44, lc_date:'2026-05-20', lc_num:'DCSPABC024262048', type:'IMPORT', brand:'Suzuki',  model:'Wagonr FX (2025)',            chassis:'MH85S-237820',      colour:'Pearl White',  tt_lkr:1457208,    lc_lkr:135116.75,                                                                                                                                                                                             status:'ON THE WAY' },
  { no:45, lc_date:'2026-05-21', lc_num:'DCSPABC024262132', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2025)',      chassis:'M900A-1243264',     colour:'Pearl White',  tt_lkr:2298962.4,  lc_lkr:214598.95,                                                                                                                                                                                             status:'ON THE WAY' },
  { no:46, lc_date:'2026-05-27', lc_num:'DCSPABC024262173', type:'IMPORT', brand:'Toyota',  model:'Roomy Custom GT (2025)',      chassis:'M900A-1241254',     colour:'Pearl White',  tt_lkr:2176982.64, lc_lkr:201752.05,                                                                                                                                                                                             status:'ON THE WAY' },
  { no:47, lc_date:'2026-05-29', lc_num:'DCSPABC024262190', type:'IMPORT', brand:'Toyota',  model:'Yaris X (2024)',              chassis:'KSP210-0120889',    colour:'Pearl White',  tt_lkr:1369833.61, lc_lkr:2676226.25,                                                                                                                                                                                            status:'ON THE WAY' },
];

const n = v => (v !== undefined && v !== null && v !== '' ? parseFloat(v) : null);

async function run() {
  console.log('Fetching existing vehicles…');
  const snap = await getDocs(collection(db, 'vehicles'));
  const existing = {};
  snap.docs.forEach(d => { const no = d.data().no; if (no) existing[no] = d.id; });
  console.log(`Found ${snap.size} existing vehicle(s) in DB.\n`);

  let created = 0, updated = 0, errors = 0;

  for (const v of vehicles) {
    const payload = {
      no:         v.no,
      status:     v.status    ?? null,
      type:       v.type      ?? 'IMPORT',
      brand:      v.brand,
      model:      v.model,
      year:       v.year      ?? null,
      chassis:    v.chassis   ?? null,
      colour:     v.colour    ?? null,
      mileage:    v.mileage   ?? null,
      grade:      v.grade     ?? null,
      lc_date:    v.lc_date   ?? null,
      lc_num:     v.lc_num    ?? null,
      tt_lkr:     n(v.tt_lkr),
      lc_lkr:     n(v.lc_lkr),
      duty:       n(v.duty),
      others:     n(v.others),
      cusdec:     v.cusdec    ?? null,
      clear_date: v.clear_date ?? null,
      cost:       n(v.cost),
      sell_date:  v.sell_date  ?? null,
      sell_price: n(v.sell_price),
      income:     n(v.income),
      contact:    v.contact   ?? null,
      notes:      v.notes     ?? null,
    };

    try {
      if (existing[v.no]) {
        await updateDoc(doc(db, 'vehicles', existing[v.no]), payload);
        console.log(`  ✓ #${v.no} ${v.brand} ${v.model} — updated`);
        updated++;
      } else {
        await addDoc(collection(db, 'vehicles'), { ...payload, imageUrl: null, createdAt: serverTimestamp() });
        console.log(`  + #${v.no} ${v.brand} ${v.model} — created`);
        created++;
      }
    } catch (e) {
      console.error(`  ✗ #${v.no} ${v.brand} ${v.model} — ERROR: ${e.message}`);
      errors++;
    }
  }

  console.log(`\nDone! Created: ${created}  Updated: ${updated}  Errors: ${errors}`);
  process.exit(errors > 0 ? 1 : 0);
}

run().catch(e => { console.error(e); process.exit(1); });
