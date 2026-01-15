
import React, { useState, useEffect } from 'react';
import { NCREntry, EightDData, NCRAttachment } from './types';
import Dashboard from './components/Dashboard';
import NCRTable from './components/NCRTable';
import NCRForm from './components/NCRForm';
import EightDReportModal from './components/EightDReportModal';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(false);
  
  const [data, setData] = useState<NCREntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list'>('dashboard');
  const [showForm, setShowForm] = useState(false);
  const [showEightD, setShowEightD] = useState(false);
  const [editingEntry, setEditingEntry] = useState<NCREntry | null>(null);
  const [selectedFor8D, setSelectedFor8D] = useState<NCREntry | null>(null);

  const setupSQL = `-- [긴급] 삭제가 안 될 때 Supabase SQL Editor에서 실행\nalter table ncr_entries disable row level security;\ngrant all on table ncr_entries to anon, authenticated, service_role;`;

  useEffect(() => {
    const authStatus = sessionStorage.getItem('isAuth');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
      fetchEntries();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'SSAT2026') {
      setIsAuthenticated(true);
      sessionStorage.setItem('isAuth', 'true');
      fetchEntries();
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 2000);
    }
  };

  const handleLogout = () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      setIsAuthenticated(false);
      sessionStorage.removeItem('isAuth');
      setPassword('');
      setData([]);
    }
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data: entries, error } = await supabase
        .from('ncr_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedData: NCREntry[] = (entries || []).map((e: any) => ({
        id: e.id,
        month: e.month,
        day: e.day,
        source: e.source,
        customer: e.customer,
        model: e.model,
        partName: e.part_name,
        partNo: e.part_no,
        defectContent: e.defect_content,
        outflowCause: e.outflow_cause,
        rootCause: e.root_cause,
        countermeasure: e.countermeasure,
        planDate: e.plan_date,
        resultDate: e.result_date,
        effectivenessCheck: e.effectiveness_check,
        status: e.status,
        progressRate: e.progress_rate,
        remarks: e.remarks,
        attachments: e.attachments || [],
        eightDData: e.eight_d_data
      }));

      setData(mappedData);
    } catch (e: any) {
      setErrorMsg(e.message || '데이터베이스 연결 오류');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (entry: NCREntry) => {
    try {
      const dbPayload = {
        ...(entry.id ? { id: entry.id } : {}),
        month: entry.month, day: entry.day, source: entry.source, customer: entry.customer,
        model: entry.model, part_name: entry.partName, part_no: entry.partNo,
        defect_content: entry.defectContent, outflow_cause: entry.outflowCause,
        root_cause: entry.rootCause, countermeasure: entry.countermeasure,
        plan_date: entry.planDate, result_date: entry.resultDate,
        effectiveness_check: entry.effectivenessCheck, status: entry.status,
        progress_rate: entry.progressRate, remarks: entry.remarks,
        attachments: entry.attachments || [], eight_d_data: entry.eightDData
      };

      const { error } = await supabase.from('ncr_entries').upsert(dbPayload);
      if (error) throw error;
      await fetchEntries();
      setShowForm(false);
      setEditingEntry(null);
    } catch (e: any) {
      console.error(`Save failed: ${e.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id || !window.confirm('정말로 이 항목을 삭제하시겠습니까?')) return;
    try {
      const { error } = await supabase.from('ncr_entries').delete().eq('id', id);
      if (error) throw error;
      setData(prev => prev.filter(item => item.id !== id));
      setShowForm(false);
      setEditingEntry(null);
    } catch (e: any) {
      console.error('Delete Error:', e);
    }
  };

  const handleSave8D = async (id: string, updatedFields: Partial<NCREntry>) => {
    try {
      // 8D 리포트에서 생성된 원인/대책/파일/상태를 모두 Supabase에 반영
      const dbPayload = {
        eight_d_data: updatedFields.eightDData,
        root_cause: updatedFields.rootCause,
        countermeasure: updatedFields.countermeasure,
        attachments: updatedFields.attachments,
        status: updatedFields.status || 'Closed',
        progress_rate: updatedFields.progressRate || 100
      };

      const { error } = await supabase
        .from('ncr_entries')
        .update(dbPayload)
        .eq('id', id);
        
      if (error) throw error;
      
      // 즉시 리스트 새로고침
      await fetchEntries();
      setShowEightD(false);
      setSelectedFor8D(null);
    } catch (e: any) {
      console.error(`8D Report Sync Save failed: ${e.message}`);
      alert('데이터 동기화 중 오류가 발생했습니다.');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 relative overflow-hidden text-white font-sans">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]"></div>
        <div className="w-full max-w-md z-10">
          <div className="text-center mb-10">
            <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-2xl mb-6">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.48V10.74" />
              </svg>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">품질 관리 전산 시스템</h1>
            <p className="text-slate-400 font-medium">SSAT 부적합 & 8D REPORT 통합 플랫폼</p>
          </div>
          <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-slate-800 shadow-2xl">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">SYSTEM ACCESS PASSWORD</label>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className={`w-full bg-slate-950 border ${loginError ? 'border-rose-500 animate-shake' : 'border-slate-800'} rounded-2xl p-4 text-center text-xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-blue-500 outline-none transition-all pr-12`}
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 bottom-4 text-slate-500">
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all active:scale-[0.98]">접속하기</button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 overflow-x-hidden">
      <nav className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-blue-600 p-2 rounded-lg"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 21.48V10.74" /></svg></div>
            <h1 className="text-xl font-bold tracking-tight">부적합 LIST 관리 시스템</h1>
          </div>
          <div className="flex bg-slate-800 p-1 rounded-xl">
            <button onClick={() => setActiveTab('dashboard')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>종합 대시보드</button>
            <button onClick={() => setActiveTab('list')} className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === 'list' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>상세 내역 관리</button>
          </div>
        </div>
        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
      </nav>

      <main className="flex-1 p-6 lg:p-8 max-w-screen-2xl mx-auto w-full min-h-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>
        ) : errorMsg ? (
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 p-10 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-black text-rose-600 mb-4">데이터베이스 권한 오류</h2>
            <div className="bg-slate-900 text-slate-300 p-6 rounded-2xl text-[11px] overflow-x-auto font-mono mb-6 whitespace-pre">
              {setupSQL}
            </div>
            <button onClick={() => { navigator.clipboard.writeText(setupSQL); alert('SQL이 복사되었습니다.'); }} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">SQL 복사하기</button>
          </div>
        ) : (
          activeTab === 'dashboard' ? (
            <Dashboard data={data} />
          ) : (
            <div className="flex flex-col gap-4">
               <div className="flex justify-end">
                  <button onClick={() => { setEditingEntry(null); setShowForm(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-sm font-black shadow-lg">신규 부적합 등록</button>
               </div>
               <NCRTable data={data} onEdit={(e) => { setEditingEntry(e); setShowForm(true); }} onDelete={handleDelete} onOpen8D={(e) => { setSelectedFor8D(e); setShowEightD(true); }} />
            </div>
          )
        )}
      </main>

      {showForm && (
        <NCRForm 
          initialData={editingEntry} 
          onSave={handleSave} 
          onDelete={handleDelete}
          onCancel={() => { setShowForm(false); setEditingEntry(null); }} 
        />
      )}
      {showEightD && selectedFor8D && (
        <EightDReportModal entry={selectedFor8D} onSave={handleSave8D} onClose={() => { setShowEightD(false); setSelectedFor8D(null); }} />
      )}
    </div>
  );
};

export default App;
