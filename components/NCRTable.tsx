
import React, { useState } from 'react';
import { NCREntry, NCRStatus, NCRAttachment } from '../types';

interface NCRTableProps {
  data: NCREntry[];
  onEdit: (entry: NCREntry) => void;
  onDelete: (id: string) => void;
  onOpen8D: (entry: NCREntry) => void;
}

const NCRTable: React.FC<NCRTableProps> = ({ data, onEdit, onDelete, onOpen8D }) => {
  const [filter, setFilter] = useState('');

  const filteredData = data.filter(item => 
    item.customer.toLowerCase().includes(filter.toLowerCase()) ||
    item.model.toLowerCase().includes(filter.toLowerCase()) ||
    item.defectContent.toLowerCase().includes(filter.toLowerCase())
  );

  const getStatusBadge = (status: NCRStatus) => {
    switch(status) {
      case 'Closed': return <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-bold">완료</span>;
      case 'Delay': return <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded text-[9px] font-bold">지연</span>;
      default: return <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[9px] font-bold">진행</span>;
    }
  };

  const handleRowDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // 행 클릭 이벤트(수정창 열기 등)가 있다면 전파 차단
    onDelete(id); // App.tsx의 개선된 삭제 로직 호출 (거기서 confirm이 뜹니다)
  };

  const handleRowEdit = (e: React.MouseEvent, item: NCREntry) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit(item);
  };

  const handleRow8D = (e: React.MouseEvent, item: NCREntry) => {
    e.preventDefault();
    e.stopPropagation();
    onOpen8D(item);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
      <div className="p-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <input 
          type="text" 
          placeholder="데이터 필터링 검색..."
          className="pl-4 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 w-64"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-[11px] text-left border-collapse min-w-[1950px] table-fixed">
          <thead className="bg-slate-100 text-slate-600 font-bold sticky top-0 z-[60] border-b border-slate-200">
            <tr>
              <th className="px-2 py-3 w-[50px] text-center">NO</th>
              <th className="px-2 py-3 w-[80px] text-center">발생일자</th>
              <th className="px-2 py-3 w-[120px]">고객사</th>
              <th className="px-2 py-3 w-[120px]">모델</th>
              <th className="px-2 py-3 w-[150px]">품명</th>
              <th className="px-2 py-3 w-[300px]">불량 내용</th>
              <th className="px-2 py-3 w-[100px] text-center">대책서</th>
              <th className="px-2 py-3 w-[400px]">원인 및 개선대책</th>
              <th className="px-2 py-3 w-[80px] text-center">상태</th>
              <th className="px-2 py-3 w-[150px] text-center sticky right-0 bg-slate-100 border-l border-slate-300 z-[60] shadow-[-4px_0_10px_-4px_rgba(0,0,0,0.1)]">관리도구</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-2 py-3 text-center text-slate-400">{idx + 1}</td>
                <td className="px-2 py-3 text-center">{item.month}/{item.day}</td>
                <td className="px-2 py-3 font-bold text-slate-700">{item.customer}</td>
                <td className="px-2 py-3">{item.model}</td>
                <td className="px-2 py-3">{item.partName}</td>
                <td className="px-2 py-3 whitespace-pre-wrap">{item.defectContent}</td>
                <td className="px-2 py-3 text-center">
                  {item.attachments?.length > 0 ? (
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 font-bold">File</span>
                  ) : '-'}
                </td>
                <td className="px-2 py-3 whitespace-pre-wrap">
                  <div className="text-blue-600 font-medium">원인: {item.rootCause}</div>
                  <div className="text-emerald-600">대책: {item.countermeasure}</div>
                </td>
                <td className="px-2 py-3 text-center">{getStatusBadge(item.status)}</td>
                <td className="px-2 py-3 text-center sticky right-0 bg-white border-l border-slate-200 z-[50] group-hover:bg-slate-50">
                  <div className="flex justify-center items-center gap-2 pointer-events-auto relative z-[70]">
                    <button 
                      onClick={(e) => handleRow8D(e, item)}
                      className="px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-black hover:bg-blue-700 transition-all shadow-sm active:scale-95"
                    >8D</button>
                    <button 
                      onClick={(e) => handleRowEdit(e, item)} 
                      className="p-1.5 text-slate-400 hover:text-blue-600 transition-colors"
                      title="수정"
                    >✏️</button>
                    <button 
                      onClick={(e) => handleRowDelete(e, item.id)} 
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all"
                      title="삭제"
                    >
                       <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                       </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default NCRTable;
