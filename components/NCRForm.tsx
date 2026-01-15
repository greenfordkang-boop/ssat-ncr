
import React, { useState, useEffect, useRef } from 'react';
import { NCREntry, NCRStatus, NCRAttachment, Type } from '../types';
import { CUSTOMER_LIST } from '../data/mockData';
import { GoogleGenAI } from "@google/genai";

interface NCRFormProps {
  initialData?: NCREntry | null;
  onSave: (entry: NCREntry) => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const NCRForm: React.FC<NCRFormProps> = ({ initialData, onSave, onDelete, onCancel }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Partial<NCREntry>>({
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
    source: '',
    customer: '',
    model: '',
    partName: '',
    partNo: '',
    defectContent: '',
    outflowCause: '',
    rootCause: '',
    countermeasure: '',
    planDate: new Date().toISOString().split('T')[0],
    resultDate: '',
    effectivenessCheck: '',
    status: 'Open',
    progressRate: 0,
    remarks: '',
    attachments: []
  });

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData, attachments: initialData.attachments || [] });
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer?.trim()) {
      alert('고객사를 입력하거나 선택하세요.');
      return;
    }
    onSave(formData as NCREntry);
  };

  const handleFormDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (initialData?.id) {
      onDelete(initialData.id); // App.tsx의 개선된 삭제 로직 호출 (거기서 confirm 처리를 합니다)
    } else {
      alert('삭제할 데이터의 식별자(ID)를 확인할 수 없습니다.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'month' || name === 'day' || name === 'progressRate' ? Number(value) : value 
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-slate-200 animate-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">
              {initialData ? '부적합 상세 내역 수정' : '신규 부적합 사항 등록'}
            </h2>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form id="ncr-form" onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 bg-blue-100 text-blue-600 rounded-full text-[10px] font-bold">1</span>
              <h3 className="font-bold text-slate-800 text-sm">발생 기본 정보</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">발생월</label>
                <input name="month" type="number" value={formData.month} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">발생일</label>
                <input name="day" type="number" value={formData.day} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">고객사</label>
              <input name="customer" list="customers" value={formData.customer} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-bold" placeholder="고객사를 선택하거나 입력하세요" />
              <datalist id="customers">
                {CUSTOMER_LIST.map(c => <option key={c} value={c} />)}
              </datalist>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">모델명 / 품명</label>
              <div className="grid grid-cols-2 gap-2">
                <input name="model" type="text" value={formData.model} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none" placeholder="모델명" />
                <input name="partName" type="text" value={formData.partName} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none" placeholder="품명" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">불량 상세 내용</label>
              <textarea name="defectContent" value={formData.defectContent} onChange={handleChange} rows={4} className="w-full border border-slate-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none" placeholder="발생된 불량 현상을 상세히 기술하세요" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center justify-center w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full text-[10px] font-bold">2</span>
              <h3 className="font-bold text-slate-800 text-sm">원인 분석 및 개선 대책</h3>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">근본 원인 (Root Cause)</label>
              <textarea name="rootCause" value={formData.rootCause} onChange={handleChange} rows={2} className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none resize-none" placeholder="왜 발생했나요?" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">개선 대책 (Countermeasure)</label>
              <textarea name="countermeasure" value={formData.countermeasure} onChange={handleChange} rows={2} className="w-full border border-slate-200 p-3 rounded-xl text-sm outline-none resize-none" placeholder="어떻게 개선했나요?" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">진행 상태</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm font-bold outline-none bg-white">
                  <option value="Open">진행 (Open)</option>
                  <option value="Closed">완료 (Closed)</option>
                  <option value="Delay">지연 (Delay)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">진척률 (%)</label>
                <input name="progressRate" type="number" min="0" max="100" value={formData.progressRate} onChange={handleChange} className="w-full border border-slate-200 p-2.5 rounded-xl text-sm outline-none" />
              </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2">
              <p className="text-[10px] font-bold text-slate-400 uppercase">근거 자료 첨부</p>
              <input ref={fileInputRef} type="file" className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
            </div>
          </div>
        </form>

        <div className="p-6 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center">
          <div className="flex-1">
            {initialData && (
              <button 
                type="button" 
                onClick={handleFormDelete}
                className="group px-5 py-2.5 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-black flex items-center gap-2.5 border border-rose-200 transition-all shadow-sm hover:shadow-rose-100"
              >
                <svg className="w-4.5 h-4.5 group-hover:animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                현재 내역 영구 삭제
              </button>
            )}
          </div>
          <div className="flex gap-4">
            <button type="button" onClick={onCancel} className="px-8 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-500 hover:bg-white transition-all text-sm">닫기</button>
            <button form="ncr-form" type="submit" className="px-12 py-2.5 bg-blue-600 text-white rounded-xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all text-sm">데이터베이스 저장</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NCRForm;
