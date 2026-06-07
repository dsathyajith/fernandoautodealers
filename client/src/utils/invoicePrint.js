import logoUrl from '../assests/aboutaaa.png';

const fmt = n => {
  if (n == null || n === '' || isNaN(n)) return null;
  return Number(n).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const fmtDate = d => {
  if (!d) return '—';
  const s = String(d).split('T')[0];
  const parts = s.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(parts[2])} ${months[parseInt(parts[1]) - 1]} ${parts[0]}`;
};

const DIAMOND_SVG = `<svg width="76" height="76" viewBox="0 0 88 88" fill="none" xmlns="http://www.w3.org/2000/svg">
  <polygon points="44,2 86,44 44,86 2,44" stroke="#bbb" stroke-width="0.8" fill="none"/>
  <polygon points="44,13 75,44 44,75 13,44" stroke="#bbb" stroke-width="0.8" fill="none"/>
  <polygon points="44,24 64,44 44,64 24,44" stroke="#bbb" stroke-width="0.8" fill="none"/>
  <polygon points="44,35 53,44 44,53 35,44" stroke="#bbb" stroke-width="0.8" fill="none"/>
  <line x1="2" y1="44" x2="86" y2="44" stroke="#bbb" stroke-width="0.5"/>
  <line x1="44" y1="2" x2="44" y2="86" stroke="#bbb" stroke-width="0.5"/>
  <line x1="13" y1="13" x2="75" y2="75" stroke="#bbb" stroke-width="0.4"/>
  <line x1="75" y1="13" x2="13" y2="75" stroke="#bbb" stroke-width="0.4"/>
  <line x1="2" y1="44" x2="44" y2="2" stroke="#bbb" stroke-width="0.3"/>
  <line x1="44" y1="2" x2="86" y2="44" stroke="#bbb" stroke-width="0.3"/>
  <line x1="86" y1="44" x2="44" y2="86" stroke="#bbb" stroke-width="0.3"/>
  <line x1="44" y1="86" x2="2" y2="44" stroke="#bbb" stroke-width="0.3"/>
</svg>`;

const CSS = `
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Work Sans',Arial,sans-serif;background:#ebebeb;color:#111;-webkit-print-color-adjust:exact;print-color-adjust:exact}

  /* A4 page — flex column so footer sticks to bottom */
  .page{
    width:794px;
    min-height:1060px;
    background:#fff;
    margin:14px auto;
    padding:30px 44px 0 44px;
    box-shadow:0 4px 24px rgba(0,0,0,.15);
    display:flex;
    flex-direction:column;
  }
  .page-body{flex:1 0 auto;}

  /* ── HEADER ── */
  .inv-hdr{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-bottom:16px;border-bottom:2px solid #111}
  .logo-img{height:66px;width:auto;object-fit:contain;flex-shrink:0}
  .co-name{text-align:center;flex:1;padding:0 8px}
  .co-name h1{font-family:'Josefin Sans',sans-serif;font-size:25px;font-weight:700;color:#e53935;letter-spacing:3.5px;text-transform:uppercase;line-height:1.15}
  .co-name p{font-size:8.5px;letter-spacing:4px;text-transform:uppercase;color:#999;margin-top:3px}
  .dia-wrap{width:76px;height:76px;flex-shrink:0}

  /* ── INVOICE TITLE ── */
  .inv-title{display:flex;align-items:stretch;margin:14px 0 12px}
  .title-bar{width:8px;background:#e53935;border-radius:2px;margin-right:13px;flex-shrink:0}
  .title-txt{font-family:'Work Sans',sans-serif;font-size:34px;font-weight:900;color:#111;letter-spacing:.2px;line-height:1.05}

  /* ── RECIPIENT ROW ── */
  .inv-to{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;padding-bottom:10px}
  .to-left{flex:1;min-width:0}
  .to-lbl{font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin-bottom:3px}
  .to-name{font-size:17px;font-weight:800;margin-bottom:4px;line-height:1.2;color:#111}
  .to-addr{font-size:12px;line-height:1.7;color:#444}
  .to-right{text-align:right;white-space:nowrap;padding-top:2px;flex-shrink:0}
  .date-lbl{font-size:9.5px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#999;margin-bottom:3px}
  .date-val{font-size:13.5px;font-weight:700;color:#111}

  /* ── DIVIDERS + DESC HEADER ── */
  .hr{border:none;border-top:1.8px solid #111;margin:6px 0}
  .hr-thin{border:none;border-top:1px solid #ddd;margin:5px 0}
  .desc-hdr{font-size:10px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#555;padding:5px 0}

  /* ── VEHICLE DETAIL TABLE ── */
  .vehicle-name{font-size:14px;font-weight:800;letter-spacing:.3px;padding:6px 0 4px;color:#111}
  .vd-table{width:100%;border-collapse:collapse;margin:2px 0 8px}
  .vd-table tr{border-bottom:1px solid #f0f0f0}
  .vd-table tr:last-child{border-bottom:none}
  .vd-lbl{font-size:11.5px;color:#888;font-weight:600;padding:3px 14px 3px 0;width:145px;white-space:nowrap;vertical-align:top}
  .vd-val{font-size:11.5px;color:#111;font-weight:600;padding:3px 0;vertical-align:top}

  /* ── PAYMENT BREAKDOWN ── */
  .lc-block{font-size:12.5px;line-height:1.8;padding:4px 0 2px;color:#222}
  .item-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:13px}
  .item-row+.item-row{border-top:1px solid #f2f2f2}
  .item-lbl{font-weight:600;color:#333}
  .item-val{font-weight:600;color:#111;font-family:'Josefin Sans',sans-serif;letter-spacing:.3px}
  .item-row.total-row .item-lbl{font-weight:800;color:#111}
  .item-row.total-row .item-val{font-weight:800;color:#111}

  /* ── PAYMENT BADGE ── */
  .inv-pay{display:flex;justify-content:flex-end;margin:16px 0 12px}
  .pay-badge{
    background:#e53935;color:#fff;
    font-family:'Josefin Sans',sans-serif;font-size:11.5px;font-weight:700;
    letter-spacing:2.5px;padding:11px 20px;text-transform:uppercase;
    white-space:nowrap;display:flex;align-items:center;
  }
  .pay-amt{
    background:#f5f5f5;border:1.5px solid #ddd;border-left:none;
    font-family:'Josefin Sans',sans-serif;font-size:16px;font-weight:700;
    color:#111;padding:11px 24px;letter-spacing:.5px;white-space:nowrap;
  }

  /* ── SIGNATURES — generous space above lines ── */
  .inv-sigs{display:flex;justify-content:space-between;align-items:flex-end;padding:6px 2px 18px}
  .sig-block{min-width:190px}
  .sig-space{height:52px}
  .sig-line{border-top:1.5px solid #111;width:190px;margin-bottom:7px}
  .sig-dashes{
    font-size:14px;letter-spacing:3px;color:#aaa;
    border-bottom:1.5px solid #111;
    width:190px;margin-bottom:7px;
    padding-bottom:4px;text-align:right;
  }
  .sig-lbl{font-size:11.5px;font-weight:700;letter-spacing:.5px;color:#333}
  .sig-block-right{text-align:right;min-width:190px}

  /* ── FOOTER — always at the bottom of the page ── */
  .page-footer{
    margin-top:auto;
    padding-top:12px;
    flex-shrink:0;
  }
  .foot-hr{border:none;border-top:2px solid #111;margin-bottom:14px}
  .foot{
    display:flex;
    align-items:flex-start;
    padding-bottom:26px;
  }
  .fitem{
    flex:1;
    display:flex;
    align-items:flex-start;
    gap:10px;
    padding-right:16px;
  }
  .fitem+.fitem{
    border-left:1px solid #e0e0e0;
    padding-left:16px;
    padding-right:0;
  }
  .fitem:last-child{padding-right:0}
  .ficon{
    width:30px;height:30px;
    border:1.5px solid #111;border-radius:4px;
    display:flex;align-items:center;justify-content:center;
    font-size:14px;flex-shrink:0;
  }
  .ftxt .flbl{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:#444;margin-bottom:3px}
  .ftxt .fval{font-size:10.5px;color:#555;line-height:1.6}

  /* ── PRINT BUTTON ── */
  .pbar{text-align:center;padding:13px 0 7px;background:#f0f0f0}
  .pbtn{padding:10px 32px;background:#e53935;color:#fff;border:none;border-radius:6px;font-size:14px;font-weight:700;cursor:pointer;font-family:'Work Sans',sans-serif;letter-spacing:.4px}
  .pbtn:hover{background:#c62828}

  @media print{
    body{background:#fff}
    .pbar{display:none!important}
    .page{margin:0;box-shadow:none;padding:22px 40px 0;min-height:0}
    @page{size:A4;margin:0}
  }
`;

function buildHTML(type, { vehicle, sale, buyer }, logoSrc) {
  const isAdv   = type === 'advance';
  const title   = isAdv ? 'ADVANCED INVOICE' : 'INVOICE';
  const date    = isAdv ? (sale.advance_date || sale.sell_date) : sale.sell_date;

  const vehicleName = [vehicle.brand, vehicle.model, vehicle.year].filter(Boolean).join(' ');

  // Structured detail rows — all four key fields always shown if present
  const detailRows = [
    ['Chassis No',       vehicle.chassis],
    ['Engine No',        vehicle.engine_num],
    ['Model Code',       vehicle.model_code],
    ['Country of Origin',vehicle.origin],
    ['Fuel Type',        vehicle.fuel_type],
  ]
    .filter(([, v]) => v)
    .map(([lbl, val]) => `<tr><td class="vd-lbl">${lbl}</td><td class="vd-val">${val}</td></tr>`)
    .join('');

  const leaseFmt = fmt(sale.lease_amount);
  const cashFmt  = fmt(sale.cash_amount);
  const vpFmt    = fmt(sale.vehicle_price);
  const rmvFmt   = fmt(sale.rmv_fee);
  const sellFmt  = fmt(sale.sell_price);
  const advFmt   = fmt(sale.advance_amount);

  const lcBlock = (leaseFmt || cashFmt) ? `
    <div class="lc-block">
      ${leaseFmt ? `<div><b>Lease Amount:</b> Rs. ${leaseFmt}</div>` : ''}
      ${cashFmt  ? `<div><b>Cash Amount:</b> Rs. ${cashFmt}</div>`   : ''}
    </div>
    <div class="hr-thin"></div>` : '';

  // Price breakdown lines
  const priceLines = [
    vpFmt  ? ['Vehicle Price',   `Rs. ${vpFmt}`,   false] : null,
    rmvFmt ? ['RMV Fee',         `Rs. ${rmvFmt}`,  false] : null,
    sellFmt ? ['Selling Price',  `Rs. ${sellFmt}`, true]  : null,
  ]
    .filter(Boolean)
    .map(([lbl, val, total]) =>
      `<div class="item-row${total ? ' total-row' : ''}">
        <span class="item-lbl">${lbl}</span>
        <span class="item-val">${val}</span>
      </div>`
    ).join('');

  const payBadge  = isAdv ? 'ADVANCED' : 'SELLING PRICE';
  const payAmount = isAdv ? `LKR ${advFmt ?? sellFmt}` : `LKR ${sellFmt}`;

  // Signature styles differ: advance seller has no line, full has a line; buyer always has dashes
  const sellerSig = `
    <div class="sig-block">
      <div class="sig-space"></div>
      ${isAdv ? '' : '<div class="sig-line"></div>'}
      <div class="sig-lbl">Signature of Seller</div>
    </div>`;

  const buyerSig = `
    <div class="sig-block sig-block-right">
      <div class="sig-space"></div>
      <div class="sig-dashes">_ _ _ _ _ _ _ _ _</div>
      <div class="sig-lbl">Signature of Buyer</div>
    </div>`;

  const addrHTML = (buyer.buyer_address || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');

  const logoTag = logoSrc
    ? `<img class="logo-img" src="${logoSrc}" alt="Fernando Auto Dealers">`
    : `<div style="font-family:'Josefin Sans',sans-serif;font-size:20px;font-weight:700;letter-spacing:3px;color:#111">Fernando</div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} — Fernando Auto Dealers</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@400;600;700&family=Work+Sans:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  <div class="pbar">
    <button class="pbtn" onclick="window.print()">&#128424;&nbsp; Print / Save as PDF</button>
  </div>

  <div class="page">
    <div class="page-body">

      <!-- HEADER -->
      <div class="inv-hdr">
        ${logoTag}
        <div class="co-name">
          <h1>Fernando<br>Auto Dealers</h1>
          <p>Vehicle Sales &amp; Imports · Moratuwa</p>
        </div>
        <div class="dia-wrap">${DIAMOND_SVG}</div>
      </div>

      <!-- TITLE -->
      <div class="inv-title">
        <div class="title-bar"></div>
        <div class="title-txt">${title}</div>
      </div>

      <!-- RECIPIENT -->
      <div class="inv-to">
        <div class="to-left">
          <div class="to-lbl">Bill To</div>
          <div class="to-name">${buyer.customer_name || '—'}</div>
          ${addrHTML ? `<div class="to-addr">${addrHTML}</div>` : ''}
        </div>
        <div class="to-right">
          <div class="date-lbl">Date</div>
          <div class="date-val">${fmtDate(date)}</div>
        </div>
      </div>

      <!-- DESCRIPTION SECTION -->
      <div class="hr"></div>
      <div class="desc-hdr">Description</div>
      <div class="hr"></div>

      <!-- VEHICLE DETAILS -->
      <div class="vehicle-name">${vehicleName}</div>
      ${detailRows ? `<table class="vd-table"><tbody>${detailRows}</tbody></table>` : ''}

      <div class="hr-thin"></div>

      ${lcBlock}
      ${priceLines ? `<div style="margin:4px 0 2px">${priceLines}</div>` : ''}

      <!-- PAYMENT BADGE -->
      <div class="inv-pay">
        <div class="pay-badge">${payBadge}</div>
        <div class="pay-amt">${payAmount}</div>
      </div>

      <!-- SIGNATURES -->
      <div class="inv-sigs">
        ${sellerSig}
        ${buyerSig}
      </div>

    </div><!-- /.page-body -->

    <!-- FOOTER pinned to bottom -->
    <div class="page-footer">
      <div class="foot-hr"></div>
      <div class="foot">
        <div class="fitem">
          <div class="ficon">&#128222;</div>
          <div class="ftxt">
            <div class="flbl">Phone</div>
            <div class="fval">0784738223</div>
          </div>
        </div>
        <div class="fitem">
          <div class="ficon">&#9993;</div>
          <div class="ftxt">
            <div class="flbl">Email</div>
            <div class="fval">fernandoautodealers<br>@gmail.com</div>
          </div>
        </div>
        <div class="fitem">
          <div class="ficon">&#128205;</div>
          <div class="ftxt">
            <div class="flbl">Address</div>
            <div class="fval">140/15 De Mel Road,<br>Lakshapathiya, Moratuwa</div>
          </div>
        </div>
      </div>
    </div>

  </div><!-- /.page -->
</body>
</html>`;
}

function openInvoice(html) {
  const win = window.open('', '_blank', 'width=870,height=1200,scrollbars=yes,resizable=yes');
  if (!win) {
    alert('Popups are blocked. Please allow popups for this site to print invoices.');
    return;
  }
  win.document.write(html);
  win.document.close();
}

export function printAdvanceInvoice(data) {
  openInvoice(buildHTML('advance', data, logoUrl));
}

export function printCustomerInvoice(data) {
  openInvoice(buildHTML('full', data, logoUrl));
}
