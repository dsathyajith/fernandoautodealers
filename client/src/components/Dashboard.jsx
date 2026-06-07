import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardStats } from '../services/dashboardService';

const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-LK', { maximumFractionDigits: 0 });
const fmtD = d => { if (!d) return '—'; const s = d.split('T')[0]; const [y, m, dy] = s.split('-'); return `${dy}/${m}/${y}`; };

function StatCard({ value, label, sub, icon, cls }) {
  return (
    <div className={`stat-card ${cls}`}>
      <div className="stat-icon"><i className={`fa ${icon}`} /></div>
      <div className="stat-num" style={{ fontSize: String(value).length > 8 ? '1rem' : undefined }}>{value}</div>
      <div className="stat-lbl">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

function MonthlyChart({ monthly, thisMonth, lastMonth, avgMonthly, winRate, profitCount, lossCount }) {
  if (!monthly || !monthly.length) return null;
  const maxP = monthly.reduce((m, r) => Math.max(m, Math.abs(parseFloat(r.profit) || 0)), 1);
  const tmPct = lastMonth > 0
    ? `${thisMonth >= lastMonth ? '▲' : '▼'} ${Math.abs(((thisMonth - lastMonth) / lastMonth) * 100).toFixed(0)}%`
    : '—';

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-header">
        <h3>MONTHLY PROFIT CHART</h3>
        <span style={{ fontSize: '.72rem', color: 'var(--t3)' }}>Last 12 months · Hover bar for detail</span>
      </div>
      <div className="month-stats">
        <div className="mstat">
          <div className="mstat-lbl">This Month</div>
          <div className="mstat-val">LKR {fmt(thisMonth)}</div>
          <div className="mstat-sub" style={{ color: thisMonth >= lastMonth ? 'var(--g)' : 'var(--rl)' }}>{tmPct}</div>
        </div>
        <div className="mstat">
          <div className="mstat-lbl">Last Month</div>
          <div className="mstat-val">LKR {fmt(lastMonth)}</div>
          <div className="mstat-sub" style={{ color: 'var(--t3)' }}>Previous period</div>
        </div>
        <div className="mstat">
          <div className="mstat-lbl">Monthly Avg</div>
          <div className="mstat-val">LKR {fmt(avgMonthly)}</div>
          <div className="mstat-sub" style={{ color: 'var(--t3)' }}>Per active month</div>
        </div>
        <div className="mstat">
          <div className="mstat-lbl">Win Rate</div>
          <div className="mstat-val" style={{ color: 'var(--g)' }}>{winRate}%</div>
          <div className="mstat-sub" style={{ color: 'var(--t3)' }}>{profitCount} profit / {lossCount} loss</div>
        </div>
      </div>
      <div className="chart-wrap">
        <div className="chart-bars">
          {monthly.map(m => {
            const profit = parseFloat(m.profit) || 0;
            const h = Math.max(4, Math.round(Math.abs(profit) / maxP * 85));
            const isPos = profit >= 0;
            const col = isPos
              ? 'linear-gradient(to top,#16a34a,#22c55e)'
              : 'linear-gradient(to top,#b71c1c,#e53935)';
            const sv = Math.abs(profit) >= 1e6 ? (profit / 1e6).toFixed(1) + 'M' : fmt(profit);
            const parts = m.month_label.split(' ');
            return (
              <div key={m.month_key} className="chart-col">
                <div className="chart-bar-wrap">
                  <div
                    className="chart-bar"
                    style={{ height: h, background: col }}
                    title={`${m.month_label} | ${m.count} sold | LKR ${fmt(profit)}`}
                  >
                    <div className="chart-val" style={{ color: isPos ? 'var(--g)' : 'var(--rl)' }}>{sv}</div>
                  </div>
                </div>
                <div className="chart-lbl">{parts[0]}<br /><span style={{ fontSize: '.53rem' }}>{parts[1] || ''}</span></div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ showToast }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch(() => showToast('Failed to load dashboard', 'err'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading"><span className="spin" />Loading dashboard…</div>;
  if (!data) return <div className="loading">Failed to load data.</div>;

  const winRate = data.sold > 0 ? ((data.profit_count / data.sold) * 100).toFixed(0) : '0';
  const avgMargin = data.total_sales > 0 ? ((data.income / data.total_sales) * 100).toFixed(1) : '0';
  const chg = data.last_month > 0
    ? `${(((data.this_month - data.last_month) / data.last_month) * 100).toFixed(0)}% vs last month`
    : 'First month';

  return (
    <>
      <div className="stats-grid">
        <StatCard value={data.total} label="Total Vehicles" icon="fa-car-side" cls="s1"
          sub={<><span>Local <b>{data.local_sold}</b></span><span>Import <b>{data.import_sold}</b></span></>} />
        <StatCard value={data.sold} label="Sold" icon="fa-circle-check" cls="s2"
          sub={<><span>✓ Profit <b>{data.profit_count}</b></span><span>✗ Loss <b>{data.loss_count}</b></span></>} />
        <StatCard value={data.inhand} label="In Hand" icon="fa-warehouse" cls="s5"
          sub={<><span>Cost <b>{fmt(data.inhand_cost)}</b></span></>} />
        <StatCard value={data.onway} label="On The Way" icon="fa-ship" cls="s3" />
        <StatCard value={`LKR ${fmt(data.income)}`} label="Total Income (LKR)" icon="fa-coins" cls="s2"
          sub={<><span>Local <b>{fmt(data.local_income)}</b></span></>} />
        <StatCard value={fmt(data.best)} label="Best Profit" icon="fa-trophy" cls="s1"
          sub={data.best_v ? <><span style={{ fontSize: '.6rem', color: 'var(--t3)' }}>{data.best_v.brand} {data.best_v.model}</span></> : null} />
        <StatCard value={`${avgMargin}%`} label="Avg Margin" icon="fa-percent" cls="s4"
          sub={<><span>Win Rate <b>{winRate}%</b></span></>} />
        <StatCard value={fmt(data.avg_profit)} label="Avg Profit/Vehicle" icon="fa-chart-bar" cls="s6"
          sub={data.top_brand ? <><span>Top: <b>{data.top_brand.brand}</b></span></> : null} />
      </div>

      <div className="sum-grid">
        <div className="sum-card">
          <div className="sum-icon i-green"><i className="fa fa-arrow-trend-up" /></div>
          <div className="sum-text"><p>Total Income</p><h2>LKR {fmt(data.income)}</h2><span>From {data.sold} sold vehicles</span></div>
        </div>
        <div className="sum-card">
          <div className="sum-icon i-red"><i className="fa fa-triangle-exclamation" /></div>
          <div className="sum-text"><p>Worst Result</p><h2>{parseFloat(data.worst) < 0 ? `– LKR ${fmt(Math.abs(data.worst))}` : 'No Loss'}</h2><span>Min income recorded</span></div>
        </div>
        <div className="sum-card">
          <div className="sum-icon i-amber"><i className="fa fa-calendar-alt" /></div>
          <div className="sum-text"><p>This Month</p><h2>LKR {fmt(data.this_month)}</h2><span style={{ color: data.this_month >= data.last_month ? 'var(--g)' : 'var(--rl)' }}>{chg}</span></div>
        </div>
        <div className="sum-card">
          <div className="sum-icon i-blue"><i className="fa fa-chart-bar" /></div>
          <div className="sum-text"><p>Monthly Avg</p><h2>LKR {fmt(data.avg_monthly)}</h2><span>Per selling month</span></div>
        </div>
        <div className="sum-card">
          <div className="sum-icon i-purple"><i className="fa fa-file-invoice-dollar" /></div>
          <div className="sum-text"><p>Total Sales Revenue</p><h2>LKR {fmt(data.total_sales)}</h2><span>Gross turnover</span></div>
        </div>
        <div className="sum-card">
          <div className="sum-icon i-cyan"><i className="fa fa-ship" /></div>
          <div className="sum-text"><p>On The Way</p><h2>{data.onway} Vehicles</h2><span>In transit from Japan</span></div>
        </div>
      </div>

      <MonthlyChart
        monthly={data.monthly}
        thisMonth={data.this_month}
        lastMonth={data.last_month}
        avgMonthly={data.avg_monthly}
        winRate={winRate}
        profitCount={data.profit_count}
        lossCount={data.loss_count}
      />

      {/* Brand Breakdown */}
      {data.brands && data.brands.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><h3>BRAND BREAKDOWN</h3></div>
          <div className="table-wrap">
            <table>
              <thead><tr>
                <th>Brand</th><th>Total</th><th>Sold</th><th>In Hand</th><th>On Way</th>
                <th>Total Sales</th><th>Total Cost</th><th>Net Profit</th><th>Margin</th>
                <th>Avg Profit</th><th>Win/Loss</th>
              </tr></thead>
              <tbody>
                {data.brands.map(b => {
                  const bAvg = b.sold > 0 ? (b.total_profit / b.sold).toFixed(0) : 0;
                  const bMar = b.total_sales > 0 ? ((b.total_profit / b.total_sales) * 100).toFixed(1) : '0';
                  const neg = parseFloat(b.total_profit) < 0;
                  return (
                    <tr key={b.brand}>
                      <td><strong>{b.brand}</strong></td>
                      <td>{b.total}</td><td>{b.sold}</td><td>{b.inhand}</td><td>{b.onway}</td>
                      <td className="amt">{fmt(b.total_sales)}</td>
                      <td className="amt">{fmt(b.total_cost)}</td>
                      <td className={`amt ${neg ? 'neg' : 'pos'}`}>{neg ? '−' : '+'} {fmt(Math.abs(b.total_profit))}</td>
                      <td style={{ color: 'var(--t2)' }}>{bMar}%</td>
                      <td className="amt" style={{ fontSize: '.75rem' }}>{fmt(bAvg)}</td>
                      <td>
                        <span style={{ color: 'var(--g)', fontSize: '.72rem' }}>{b.profit_count}✓</span>{' '}
                        <span style={{ color: 'var(--rl)', fontSize: '.72rem' }}>{b.loss_count}✗</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Sales */}
      <div className="card">
        <div className="card-header">
          <h3>RECENT SALES</h3>
          <button className="btn-primary" onClick={() => navigate('/profit')}>
            <i className="fa fa-arrow-right" /> Full Report
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Type</th><th>Brand</th><th>Model</th><th>Sell Price</th><th>Cost</th><th>Income</th><th>Date</th><th>Contact</th></tr></thead>
            <tbody>
              {data.recent && data.recent.length > 0 ? data.recent.map(r => (
                <tr key={r.no}>
                  <td><strong>{r.no}</strong></td>
                  <td><span className={`badge ${r.type === 'LOCAL' ? 'b-local' : 'b-import'}`}>{r.type}</span></td>
                  <td><strong>{r.brand}</strong></td>
                  <td>{r.model}</td>
                  <td className="amt">{fmt(r.sell_price)}</td>
                  <td className="amt">{fmt(r.cost)}</td>
                  <td>{r.income == null ? '—' : (
                    <span className={`badge ${parseFloat(r.income) < 0 ? 'b-loss' : 'b-profit'}`}>
                      {parseFloat(r.income) < 0 ? '− ' : '+ '}{fmt(Math.abs(r.income))}
                    </span>
                  )}</td>
                  <td>{fmtD(r.sell_date)}</td>
                  <td style={{ fontSize: '.72rem' }}>{r.contact || '—'}</td>
                </tr>
              )) : (
                <tr><td colSpan="9" className="empty">No sales yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
