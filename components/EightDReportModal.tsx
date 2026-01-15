
import React, { useState, useEffect, useRef } from 'react';
import { NCREntry, EightDData, Type } from '../types';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { GoogleGenAI } from "@google/genai";

interface EightDReportModalProps {
  entry: NCREntry;
  onSave: (id: string, data: EightDData) => void;
  onClose: () => void;
}

const EightDReportModal: React.FC<EightDReportModalProps> = ({ entry, onSave, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [report, setReport] = useState<EightDData>({
    docNo: `2025.${entry.month.toString().padStart(2, '0')}.${entry.id.slice(0, 2).toUpperCase()}`,
    lastUpdate: new Date().toISOString().split('T')[0],
    relatedPerson: { 
      actionDetail: '품질팀', 
      assemblyTeam: '생산팀', 
      developmentTeam: '기술팀' 
    },
    sevenW: {
      who: entry.customer,
      what: `${entry.model} / ${entry.partName}`,
      when: `2025.${entry.month.toString().padStart(2, '0')}.${entry.day.toString().padStart(2, '0')}`,
      where: entry.source,
      why: entry.defectContent,
      howMany: '1 EA',
      howOften: '1 Case'
    },
    containment: '',
    rootCause: {
      whyHappened: ['', '', '', '', ''],
      whyNotDetected: ['', '', '', '', ''],
    },
    countermeasures: [
      { type: 'Prevent', action: '', owner: '품질팀', complete: '', implement: '', status: 'Plan' },
      { type: 'Detection', action: '', owner: '생산팀', complete: '', implement: '', status: 'Plan' }
    ],
    verification: [
      { item: '개선 전후 데이터 비교 검증', yes: false, no: false, date: '' },
      { item: '신뢰성 시험 및 초품 검사', yes: false, no: false, date: '' }
    ],
    prevention: [
      { standard: 'CP', owner: '', complete: '', readAcross: 'N/A', raOwner: '', raComplete: '' },
      { standard: 'PFMEA', owner: '', complete: '', readAcross: 'N/A', raOwner: '', raComplete: '' }
    ],
    reviewAndConfirm: '',
    approvals: { 
      madeBy: '', 
      reviewBy: '', 
      approveBy: '', 
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.') 
    }
  });

  useEffect(() => {
    if (entry.eightDData) {
      setReport(entry.eightDData);
    }
  }, [entry]);

  useEffect(() => {
    if (!isGenerating && report.rootCause.whyHappened.some(w => w)) {
      setTimeout(() => {
        const textareas = reportRef.current?.querySelectorAll('textarea');
        textareas?.forEach(ta => {
          ta.style.height = 'auto';
          ta.style.height = (ta.scrollHeight) + 'px';
        });
      }, 150);
    }
  }, [isGenerating]);

  const generateAIDraft = async () => {
    if (!process.env.API_KEY) {
      alert('API 키가 설정되지 않았습니다.');
      return;
    }
    
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `당신은 자동차/전자 부품 제조 분야의 품질 관리 전문가입니다. 
      다음 부적합(NCR) 데이터를 바탕으로 전문적인 8D 리포트 초안을 작성하십시오.
      
      [데이터]
      - 고객사: ${entry.customer}
      - 모델/품명: ${entry.model} / ${entry.partName}
      - 불량현상: ${entry.defectContent}
      - 발생지: ${entry.source}

      [지시사항]
      1. 'sevenW' (7W1H): 불량 상황을 구체적으로 정의하십시오.
      2. 'containment': 즉시 취해야 할 봉쇄 조치(선별, 격리 등)를 기술하십시오.
      3. 'rootCause': 5-Why 분석을 통해 발생 원인(whyHappened)과 유출 원인(whyNotDetected)을 각각 5단계로 논리적으로 기술하십시오.
      4. 'countermeasures': 발생 방지 대책(Prevent)과 검출 강화 대책(Detection)을 실질적으로 제안하십시오.
      5. 'reviewAndConfirm': 개선 후 기대 효과 및 표준화 방안을 요약하십시오.
      6. 모든 응답은 한국어로 작성하되 전문 용어는 병기하십시오.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sevenW: {
                type: Type.OBJECT,
                properties: {
                  who: { type: Type.STRING },
                  what: { type: Type.STRING },
                  when: { type: Type.STRING },
                  where: { type: Type.STRING },
                  why: { type: Type.STRING },
                  howMany: { type: Type.STRING },
                  howOften: { type: Type.STRING },
                },
                required: ["who", "what", "when", "where", "why", "howMany", "howOften"]
              },
              containment: { type: Type.STRING },
              rootCause: {
                type: Type.OBJECT,
                properties: {
                  whyHappened: { type: Type.ARRAY, items: { type: Type.STRING }, description: "발생 원인 5-Why" },
                  whyNotDetected: { type: Type.ARRAY, items: { type: Type.STRING }, description: "유출 원인 5-Why" },
                },
                required: ["whyHappened", "whyNotDetected"]
              },
              countermeasures: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "대책 상세 내용" },
                    type: { type: Type.STRING, enum: ["Prevent", "Detection"] }
                  },
                  required: ["action", "type"]
                },
                minItems: 2
              },
              reviewAndConfirm: { type: Type.STRING }
            },
            required: ["sevenW", "containment", "rootCause", "countermeasures", "reviewAndConfirm"]
          }
        }
      });

      const aiResult = JSON.parse(response.text);
      
      setReport(prev => {
        const updatedCountermeasures = prev.countermeasures.map((cm, idx) => {
          const aiCm = aiResult.countermeasures?.find((a: any) => a.type === cm.type) || aiResult.countermeasures?.[idx];
          return {
            ...cm,
            action: aiCm?.action || cm.action,
            complete: new Date().toISOString().split('T')[0]
          };
        });

        return {
          ...prev,
          sevenW: { ...prev.sevenW, ...aiResult.sevenW },
          containment: aiResult.containment || '',
          rootCause: {
            whyHappened: Array.isArray(aiResult.rootCause?.whyHappened) ? [...aiResult.rootCause.whyHappened, '', '', '', ''].slice(0, 5) : prev.rootCause.whyHappened,
            whyNotDetected: Array.isArray(aiResult.rootCause?.whyNotDetected) ? [...aiResult.rootCause.whyNotDetected, '', '', '', ''].slice(0, 5) : prev.rootCause.whyNotDetected,
          },
          countermeasures: updatedCountermeasures,
          reviewAndConfirm: aiResult.reviewAndConfirm || ''
        };
      });
      alert('AI가 전문적인 8D 대책 초안 작성을 완료했습니다.');
    } catch (error) {
      console.error("AI Generation Error:", error);
      alert('AI 초안 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => { onSave(entry.id, report); onClose(); };

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`8D_REPORT_${report.docNo}.pdf`);
    } catch (e) {
      console.error(e);
      alert('PDF 생성 중 오류가 발생했습니다.');
    } finally { setIsExporting(false); }
  };

  const updateField = (path: string, value: any) => {
    const keys = path.split('.');
    const newReport = { ...report };
    let current: any = newReport;
    for (let i = 0; i < keys.length - 1; i++) { current = current[keys[i]]; }
    current[keys[keys.length - 1]] = value;
    setReport(newReport);
  };

  const standardTextStyle = "text-[9.5px] leading-[1.6] text-slate-800 w-full bg-transparent resize-none outline-none border-none focus:ring-0 p-0 whitespace-pre-wrap break-all";
  const sectionHeaderStyle = "bg-slate-200 p-0.5 px-2 text-[10.5px] font-bold border-b border-slate-800 text-slate-900";

  return (
    <div className="fixed inset-0 z-[150] flex flex-col bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="flex-1 flex justify-center py-4 px-4 sm:px-6 md:px-8">
        <div className="bg-white w-full max-w-[1050px] rounded shadow-2xl overflow-hidden border-2 border-slate-800 flex flex-col h-fit mb-8">
          
          <div className="bg-slate-900 px-4 py-3 flex justify-between items-center text-white no-print sticky top-0 z-10">
            <div className="flex items-center gap-3">
               <span className="bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold">8D SYSTEM</span>
               <h2 className="text-sm font-bold">8D 대책 리포트 편집기</h2>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={generateAIDraft}
                disabled={isGenerating}
                className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg text-xs font-bold hover:from-purple-700 transition-all flex items-center gap-2 shadow-lg shadow-purple-900/50 disabled:opacity-50"
              >
                {isGenerating ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                )}
                AI 대책 초안 자동생성
              </button>
              <div className="w-px h-6 bg-slate-700 mx-1"></div>
              <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>

          <div className="bg-slate-100 p-4 md:p-8 flex justify-center overflow-x-auto">
             <div ref={reportRef} className="bg-white p-0 flex flex-col shadow-2xl origin-top mb-4" style={{ width: '210mm', minHeight: '297mm', border: '1px solid #000' }}>
                
                <div className="grid grid-cols-12 border-b-2 border-slate-800">
                  <div className="col-span-3 p-2 border-r-2 border-slate-800 flex flex-col justify-center bg-white text-[9px]">
                    <div className="font-bold">Document No. : {report.docNo}</div>
                    <div className="font-bold">Last update : {report.lastUpdate}</div>
                  </div>
                  <div className="col-span-5 p-1 border-r-2 border-slate-800 flex items-center justify-center bg-white">
                    <h1 className="text-2xl md:text-3xl font-black tracking-[0.2em] text-slate-900">8D REPORT</h1>
                  </div>
                  <div className="col-span-4 p-1.5 bg-slate-50 flex flex-col gap-0.5">
                    <div className="grid grid-cols-12 gap-0.5 font-bold text-[9px]">
                      <div className="col-span-1 border border-slate-800 text-center flex items-center justify-center h-3.5 bg-white font-black">S</div>
                      <div className="col-span-11 pl-1 flex items-center">1.Related Person</div>
                      <div className="col-span-1 border border-slate-800 text-center flex items-center justify-center h-3.5 bg-white text-[7px] font-bold">P</div>
                      <div className="col-span-11 pl-1 flex items-center font-medium">* Action : {report.relatedPerson.actionDetail}</div>
                      <div className="col-span-1 border border-slate-800 text-center flex items-center justify-center h-3.5 bg-white text-[7px] font-bold">R</div>
                      <div className="col-span-11 pl-1 flex items-center font-medium">* Assembly : {report.relatedPerson.assemblyTeam}</div>
                      <div className="col-span-1 border border-slate-800 text-center flex items-center justify-center h-3.5 bg-white text-[7px] font-bold">C</div>
                      <div className="col-span-11 pl-1 flex items-center font-medium">* Dev : {report.relatedPerson.developmentTeam}</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-12 flex-1 border-b-2 border-slate-800">
                  <div className="col-span-4 border-r-2 border-slate-800 flex flex-col">
                    <div className={sectionHeaderStyle}>2. Problem Definition (7W1H)</div>
                    <div className="divide-y divide-slate-800 border-b border-slate-800">
                      {Object.entries(report.sevenW).map(([key, value]) => (
                        <div key={key} className="grid grid-cols-12 min-h-[28px]">
                          <div className="col-span-3 p-1 bg-white border-r border-slate-300 font-bold capitalize flex items-center text-[9px]">{key}</div>
                          <div className="col-span-9 p-1">
                            <textarea className={standardTextStyle} rows={1} value={value} onChange={e => updateField(`sevenW.${key}`, e.target.value)} />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className={sectionHeaderStyle}>3. Containment Actions</div>
                    <div className="p-1.5 flex-1 min-h-[100px] border-b border-slate-800">
                      <textarea className={standardTextStyle} style={{height: '100%'}} value={report.containment} onChange={e => updateField('containment', e.target.value)} placeholder="즉각적인 봉쇄 및 선별 조치 내용을 기술하십시오." />
                    </div>

                    <div className={sectionHeaderStyle}>4. Root Cause Analysis (5-Why)</div>
                    <div className="p-1.5 space-y-4 flex-1 bg-white">
                      <div className="overflow-visible">
                        <div className="font-bold mb-1.5 text-blue-900 text-[9px] border-b border-blue-100 pb-0.5">4-1. Occurrence Cause (왜 발생했는가?)</div>
                        <div className="space-y-1.5">
                          {report.rootCause.whyHappened.map((why, i) => (
                            <div key={i} className="flex gap-1 items-start min-h-[20px]">
                              <span className="w-11 text-blue-700 text-[8.5px] font-bold whitespace-nowrap pt-1">{i+1} Why ></span>
                              <textarea 
                                className="flex-1 border-b border-slate-100 text-[9px] leading-[1.6] outline-none py-0.5 bg-transparent resize-none overflow-hidden whitespace-pre-wrap break-all pb-1" 
                                rows={1}
                                style={{ height: 'auto' }}
                                onInput={(e) => {
                                  (e.target as any).style.height = 'auto';
                                  (e.target as any).style.height = (e.target as any).scrollHeight + 'px';
                                }}
                                value={why} 
                                onChange={e => {
                                  const wh = [...report.rootCause.whyHappened]; wh[i] = e.target.value; updateField('rootCause.whyHappened', wh);
                                }} 
                                placeholder="..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-visible">
                        <div className="font-bold mb-1.5 text-rose-900 text-[9px] border-b border-rose-100 pb-0.5">4-2. Detection Cause (왜 유출되었는가?)</div>
                        <div className="space-y-1.5">
                          {report.rootCause.whyNotDetected.map((why, i) => (
                            <div key={i} className="flex gap-1 items-start min-h-[20px]">
                              <span className="w-11 text-rose-700 text-[8.5px] font-bold whitespace-nowrap pt-1">{i+1} Why ></span>
                              <textarea 
                                className="flex-1 border-b border-slate-100 text-[9px] leading-[1.6] outline-none py-0.5 bg-transparent resize-none overflow-hidden whitespace-pre-wrap break-all pb-1" 
                                rows={1}
                                style={{ height: 'auto' }}
                                onInput={(e) => {
                                  (e.target as any).style.height = 'auto';
                                  (e.target as any).style.height = (e.target as any).scrollHeight + 'px';
                                }}
                                value={why} 
                                onChange={e => {
                                  const wd = [...report.rootCause.whyNotDetected]; wd[i] = e.target.value; updateField('rootCause.whyNotDetected', wd);
                                }} 
                                placeholder="..."
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-8 flex flex-col">
                    <div className={sectionHeaderStyle}>5. Permanent Corrective Actions</div>
                    <table className="w-full text-center border-collapse border-b border-slate-800">
                      <thead className="bg-slate-50 border-b border-slate-400 font-bold text-[8.5px]">
                        <tr className="h-6">
                          <th className="border-r border-slate-400 p-0.5 w-6">No</th>
                          <th className="border-r border-slate-400 p-0.5">Corrective Action Details (대책 상세 내용)</th>
                          <th className="border-r border-slate-400 p-0.5 w-16">PIC</th>
                          <th className="border-r border-slate-400 p-0.5 w-14">Plan Date</th>
                          <th className="p-0.5 w-14">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {report.countermeasures.map((cm, idx) => (
                          <tr key={idx} className="h-14">
                            <td className="border-r border-slate-400 p-0.5 text-[9px] font-bold">{idx+1}</td>
                            <td className="border-r border-slate-400 p-1 text-left">
                               <div className="text-[7px] text-slate-400 mb-0.5">{cm.type === 'Prevent' ? '[발생방지]' : '[검출강화]'}</div>
                               <textarea className={standardTextStyle} rows={2} value={cm.action} onChange={e => {
                                 const ncm = [...report.countermeasures]; ncm[idx].action = e.target.value; updateField('countermeasures', ncm);
                               }} />
                            </td>
                            <td className="border-r border-slate-400 p-0.5">
                               <input className="w-full text-center text-[9px] outline-none" value={cm.owner} onChange={e => {
                                 const ncm = [...report.countermeasures]; ncm[idx].owner = e.target.value; updateField('countermeasures', ncm);
                               }} />
                            </td>
                            <td className="border-r border-slate-400 p-0.5">
                               <input className="w-full text-center text-[9px] outline-none" value={cm.complete} onChange={e => {
                                 const ncm = [...report.countermeasures]; ncm[idx].complete = e.target.value; updateField('countermeasures', ncm);
                               }} />
                            </td>
                            <td className="p-0.5">
                               <select className="bg-transparent text-[8px] font-bold outline-none" value={cm.status} onChange={e => {
                                 const ncm = [...report.countermeasures]; ncm[idx].status = e.target.value; updateField('countermeasures', ncm);
                               }}>
                                 <option value="Plan">○ (Plan)</option>
                                 <option value="Ing">◐ (Progress)</option>
                                 <option value="Done">● (Complete)</option>
                               </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className={sectionHeaderStyle}>6. Verification of Effectiveness</div>
                    <div className="p-2 border-b border-slate-800 bg-white">
                      <table className="w-full border-collapse text-[8.5px]">
                         <thead>
                           <tr className="text-[7px] font-bold text-slate-400 border-b border-slate-100">
                             <th className="text-left pb-1">Verification Items</th>
                             <th className="pb-1 w-10">OK</th>
                             <th className="pb-1 w-10">NG</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-slate-100">
                           {report.verification.map((v, i) => (
                             <tr key={i} className="h-6">
                               <td className="text-left w-full"><input className="w-full outline-none" value={v.item} onChange={e => {
                                 const nv = [...report.verification]; nv[i].item = e.target.value; updateField('verification', nv);
                               }} /></td>
                               <td className="px-2 border-l border-slate-200 text-center font-bold text-emerald-600 cursor-pointer select-none" onClick={() => {
                                 const nv = [...report.verification]; nv[i].yes = !nv[i].yes; if(nv[i].yes) nv[i].no = false; updateField('verification', nv);
                               }}>{v.yes ? 'V' : ''}</td>
                               <td className="px-2 border-l border-slate-200 text-center font-bold text-rose-600 cursor-pointer select-none" onClick={() => {
                                 const nv = [...report.verification]; nv[i].no = !nv[i].no; if(nv[i].yes) nv[i].yes = false; updateField('verification', nv);
                               }}>{v.no ? 'V' : ''}</td>
                             </tr>
                           ))}
                         </tbody>
                      </table>
                    </div>

                    <div className={sectionHeaderStyle}>7. Prevention / Standardization / 8. Final Review</div>
                    <div className="grid grid-cols-2 divide-x divide-slate-800 min-h-[80px]">
                      <div className="p-2 flex flex-col gap-1 border-b border-slate-800 bg-white">
                         <div className="text-[8px] font-bold text-slate-400 uppercase">Review & Standardization</div>
                         <textarea className={standardTextStyle} rows={4} placeholder="유사 기종 수평 전개 및 표준화 방안을 입력하십시오..." value={report.reviewAndConfirm} onChange={e => updateField('reviewAndConfirm', e.target.value)} />
                      </div>
                      <div className="flex flex-col">
                         <div className="grid grid-cols-3 text-center border-b border-slate-400 h-6 bg-slate-50 items-center font-bold text-[8.5px]">
                            <div className="border-r border-slate-400 h-full flex items-center justify-center">Made By</div>
                            <div className="border-r border-slate-400 h-full flex items-center justify-center">Review By</div>
                            <div className="h-full flex items-center justify-center">Approve By</div>
                         </div>
                         <div className="grid grid-cols-3 text-center flex-1 bg-white min-h-[40px]">
                            <div className="border-r border-slate-400 p-1 flex flex-col items-center justify-center">
                              <input className="w-full text-center text-[9px] font-bold" value={report.approvals.madeBy} onChange={e => updateField('approvals.madeBy', e.target.value)} />
                            </div>
                            <div className="border-r border-slate-400 p-1 flex flex-col items-center justify-center">
                              <input className="w-full text-center text-[9px] font-bold" value={report.approvals.reviewBy} onChange={e => updateField('approvals.reviewBy', e.target.value)} />
                            </div>
                            <div className="p-1 flex flex-col items-center justify-center">
                              <input className="w-full text-center text-[9px] font-bold" value={report.approvals.approveBy} onChange={e => updateField('approvals.approveBy', e.target.value)} />
                            </div>
                         </div>
                         <div className="bg-slate-50 p-1 text-center font-bold text-[8.5px] border-t border-slate-800">
                           Report Date: <input className="w-24 bg-transparent text-center" value={report.approvals.date} onChange={e => updateField('approvals.date', e.target.value)} />
                         </div>
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-50 border-b border-slate-800"></div>
                  </div>
                </div>
             </div>
          </div>

          <div className="p-4 bg-slate-100 flex justify-end gap-3 border-t-2 border-slate-800 no-print sticky bottom-0 z-10">
            <button onClick={onClose} className="px-6 py-2 border border-slate-300 rounded text-slate-700 font-bold hover:bg-slate-50 transition-colors text-xs">취소</button>
            <button 
              onClick={handleExportPDF} 
              disabled={isExporting}
              className="px-6 py-2 bg-emerald-600 text-white rounded font-bold hover:bg-emerald-700 transition-colors shadow-md text-xs flex items-center gap-2"
            >
              {isExporting ? (
                <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              )}
              PDF 발행
            </button>
            <button onClick={handleSave} className="px-8 py-2 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition-colors shadow-md text-xs">
              최종 저장 및 전산 등록
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EightDReportModal;
