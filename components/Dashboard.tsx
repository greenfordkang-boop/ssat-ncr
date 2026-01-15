
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { NCREntry, CustomerSummary } from '../types';

interface DashboardProps {
  data: NCREntry[];
}

const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  const activeCustomers: string[] = Array.from(new Set<string>(data.map(d => d.customer))).sort();

  const summary: CustomerSummary[] = activeCustomers.map(customer => {
    const customerEntries = data.filter(d => d.customer === customer);
    const close = customerEntries.filter(d => d.status === 'Closed').length;
    const total = customerEntries.length;
    const open = customerEntries.filter(d => d.status === 'Open').length;
    const delay = customerEntries.filter(d => d.status === 'Delay').length;

    return {
      customer,
      customerCount: customerEntries.filter(d => d.source !== '사내').length,
      newCount: 0, 
      internalCount: customerEntries.filter(d => d.source === '사내').length,
      total,
      close,
      open,
      delay,
      progressRate: total > 0 ? Math.round((close / total) * 100) : 0
    };
  });

  const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const count = data.filter(d => d.month === month).length;
    return { name: `${month}월`, 건수: count };
  });

  const totalStats = summary.reduce((acc, curr) => ({
    total: acc.total + curr.total,
    close: acc.close + curr.close,
    open: acc.open + curr.open,
    delay: acc.delay + curr.delay
  }), { total: 0, close: 0, open: 0, delay: 0 });

  const chartData = summary.map(s => ({
    name: s.customer,
    '총 건수': s.total,
    '완료': s.close,
    '지연': s.delay
  }));

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-3xl border border-dashed border-slate-300">
        <div className="bg-slate-50 p-6 rounded-full mb-4">
          <svg className="w-12 h-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">등록된 데이터가 없습니다</h3>
        <p className="text-slate-500 text-sm">신규 부적합 내역을 등록하면 실시간 대시보드가 생성됩니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">전체 부적합 건수</p>
          <p className="text-4xl font-black mt-2 text-slate-900">{totalStats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider">조치 완료</p>
          <p className="text-4xl font-black mt-2 text-emerald-600">{totalStats.close}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-blue-500 uppercase tracking-wider">진행 중 (Open)</p>
          <p className="text-4xl font-black mt-2 text-blue-600">{totalStats.open}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-sm font-bold text-rose-500 uppercase tracking-wider">지연 (Delay)</p>
          <p className="text-4xl font-black mt-2 text-rose-600">{totalStats.delay}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-5 bg-blue-600 rounded-full"></div>
            고객사별 관리 현황
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 600}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px', fontSize: '12px', fontWeight: 600}} />
                <Bar dataKey="총 건수" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="완료" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar dataKey="지연" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <div className="w-2 h-5 bg-indigo-600 rounded-full"></div>
            월별 발생 추이 (Trend)
          </h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Line type="monotone" dataKey="건수" stroke="#6366f1" strokeWidth={3} dot={{r: 6, fill: '#6366f1', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            ( 2025년 ) 부적합 LIST 관리현황
          </h3>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Unit: Cases</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase">
              <tr>
                <th rowSpan={2} className="px-4 py-4 border-b border-r border-slate-200 text-center">고객사</th>
                <th colSpan={3} className="px-4 py-2 border-b border-r border-slate-200 text-center">발생 구분</th>
                <th rowSpan={2} className="px-4 py-4 border-b border-r border-slate-200 text-center bg-slate-100/50">합계</th>
                <th rowSpan={2} className="px-4 py-4 border-b border-r border-slate-200 text-center text-emerald-600">Close</th>
                <th rowSpan={2} className="px-4 py-4 border-b border-r border-slate-200 text-center text-blue-600">Open</th>
                <th rowSpan={2} className="px-4 py-4 border-b border-r border-slate-200 text-center text-rose-500">Delay</th>
                <th rowSpan={2} className="px-4 py-4 border-b border-slate-200 text-center">진척률</th>
              </tr>
              <tr className="bg-slate-50/50">
                <th className="px-4 py-2 border-b border-r border-slate-200 text-center font-semibold">고객사</th>
                <th className="px-4 py-2 border-b border-r border-slate-200 text-center font-semibold">신규</th>
                <th className="px-4 py-2 border-b border-r border-slate-200 text-center font-semibold text-indigo-500">사내</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {summary.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 border-r border-slate-100 font-bold text-slate-700">{row.customer}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center text-slate-500">{row.customerCount || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center text-slate-500">{row.newCount || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center text-indigo-400 font-semibold">{row.internalCount || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center font-black bg-slate-50/30">{row.total}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center font-bold text-emerald-600">{row.close || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center font-bold text-blue-600">{row.open || '-'}</td>
                  <td className="px-4 py-3 border-r border-slate-100 text-center font-bold text-rose-500">{row.delay || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-600 h-full" style={{width: `${row.progressRate}%`}}></div>
                      </div>
                      <span className="font-bold min-w-[35px] text-xs">{row.progressRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold">
              <tr>
                <td className="px-4 py-5 text-center uppercase tracking-widest text-xs">Grand Total</td>
                <td className="px-4 py-5 text-center">{summary.reduce((a,b) => a+b.customerCount, 0)}</td>
                <td className="px-4 py-5 text-center">{summary.reduce((a,b) => a+b.newCount, 0)}</td>
                <td className="px-4 py-5 text-center">{summary.reduce((a,b) => a+b.internalCount, 0)}</td>
                <td className="px-4 py-5 text-center text-yellow-400">{totalStats.total}</td>
                <td className="px-4 py-5 text-center text-emerald-400">{totalStats.close}</td>
                <td className="px-4 py-5 text-center text-blue-400">{totalStats.open}</td>
                <td className="px-4 py-5 text-center text-rose-400">{totalStats.delay}</td>
                <td className="px-4 py-5 text-center">
                  {totalStats.total > 0 ? Math.round((totalStats.close / totalStats.total) * 100) : 0}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
