
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calculator, RotateCcw, CheckCircle2, Info, Layers, User, FileUp, FileDown, Table as TableIcon, Download, Hash, AlertTriangle } from 'lucide-react';
import * as XLSX from 'https://esm.sh/xlsx';
import { CalculationParams, CalculationResults } from './types';
import { DEFAULT_PARAMS, INPUT_GROUPS, FORMULA_DEPENDENCIES, CSV_HEADER_MAP } from './constants';
import { calculateResults } from './services/CalculatorService';

const App: React.FC = () => {
  // 核心状态
  const [params, setParams] = useState<CalculationParams>(() => {
    const saved = localStorage.getItem('ocs_calc_params');
    return saved ? JSON.parse(saved) : DEFAULT_PARAMS;
  });

  const [calcMode, setCalcMode] = useState<'single' | 'batch'>('single');
  const [activeFormula, setActiveFormula] = useState<string>('l1');
  const [batchData, setBatchData] = useState<(CalculationParams & CalculationResults)[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 实时持久化存储单点参数
  useEffect(() => {
    localStorage.setItem('ocs_calc_params', JSON.stringify(params));
  }, [params]);

  const singleResults = useMemo(() => calculateResults(params), [params]);

  const handleInputChange = (key: keyof CalculationParams, value: string | number) => {
    setParams(prev => ({
      ...prev,
      [key]: typeof value === 'string' && !isNaN(Number(value)) && key !== 'pillarNo' ? Number(value) : value
    }));
  };

  const resetParams = () => {
    if (confirm('确定要重置当前参数吗？')) {
      setParams(DEFAULT_PARAMS);
    }
  };

  // 批量计算逻辑（支持 CSV, XLSX, XLS）
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // 转换为 JSON 数组，header: 1 表示返回二维数组
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rows.length < 2) {
          alert('文件格式不正确或无有效数据行');
          return;
        }

        const headers = (rows[0] as string[]).map(h => String(h || '').trim());
        const dataRows = rows.slice(1);
        
        let skippedCount = 0;
        const parsedData: (CalculationParams & CalculationResults)[] = [];

        dataRows.forEach((row, rowIndex) => {
          // 检查是否为空行
          if (!row || row.length === 0 || row.every(cell => cell === null || cell === undefined || cell === '')) return;

          // 创建一个新的参数对象，基于默认值，确保所有字段都存在
          const rowParams: CalculationParams = { ...DEFAULT_PARAMS };
          let hasValidData = false;

          headers.forEach((header, index) => {
            const key = CSV_HEADER_MAP[header];
            if (key) {
              const rawVal = row[index];
              if (key === 'pillarNo') {
                rowParams[key] = rawVal ? String(rawVal).trim() : `未命名_${rowIndex + 1}`;
                hasValidData = true;
              } else {
                const numVal = Number(rawVal);
                if (!isNaN(numVal) && rawVal !== null && rawVal !== undefined && rawVal !== '') {
                  (rowParams as any)[key] = numVal;
                  hasValidData = true;
                }
              }
            }
          });

          if (hasValidData) {
            const results = calculateResults(rowParams);
            parsedData.push({ ...rowParams, ...results });
          } else {
            skippedCount++;
          }
        });

        if (parsedData.length === 0) {
          alert('未能解析出任何有效计算数据，请检查表头名称是否与模板一致。');
        } else {
          setBatchData(parsedData);
          if (skippedCount > 0) {
            alert(`导入完成。成功: ${parsedData.length} 条，跳过: ${skippedCount} 条（数据无效或格式错误）。`);
          } else {
            alert(`成功导入并计算 ${parsedData.length} 条数据。`);
          }
        }
      } catch (error) {
        console.error('File parsing error:', error);
        alert('文件解析失败，请确保文件格式正确（CSV 或 Excel）。');
      }
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = () => {
    // 创建一个简单的 Excel 模板
    const headers = Object.keys(CSV_HEADER_MAP);
    const data = [headers, Object.values(DEFAULT_PARAMS)];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "计算模板");
    XLSX.writeFile(wb, "接触网腕臂计算模板.xlsx");
  };

  const exportBatchResults = () => {
    if (batchData.length === 0) return alert('暂无批量计算数据');
    
    const exportHeaders = [
      ...Object.keys(CSV_HEADER_MAP), 
      '平腕臂长度 (mm)', 
      '斜腕臂长度 (mm)', 
      '抬高支平腕臂长度 (mm)', 
      '抬高支斜腕臂长度 (mm)'
    ];
    const exportRows = batchData.map(d => [
      d.pillarNo, d.outerRailCant, d.gauge, d.upperBaseFitting, d.horizInsulator, d.clevisFitting, 
      d.lowerBaseFitting, d.inclinedInsulator, d.baseDistance, d.contactHeight, d.structHeight, 
      d.stagger, d.slope, d.clearance, d.steadyArmLength, d.steadyArmSlope, d.clevisToMessenger, 
      d.horizExposure, d.steadyTubeExposure, d.elevRise, d.elevStagger, d.elevHorizExposure,
      d.l1, d.l2, d.l3, d.l4
    ]);

    const ws = XLSX.utils.aoa_to_sheet([exportHeaders, ...exportRows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "计算结果");
    XLSX.writeFile(wb, `批量计算结果_${new Date().getTime()}.xlsx`);
  };

  const formulaLabels = [
    { id: 'l1', name: '1. 平腕臂计算', key: 'l1', color: 'bg-blue-600', activeBorder: 'border-blue-600' },
    { id: 'l2', name: '2. 斜腕臂计算', key: 'l2', color: 'bg-green-600', activeBorder: 'border-green-600' },
    { id: 'l3', name: '3. 抬高支平腕臂', key: 'l3', color: 'bg-orange-600', activeBorder: 'border-orange-600' },
    { id: 'l4', name: '4. 抬高支斜腕臂', key: 'l4', color: 'bg-purple-600', activeBorder: 'border-purple-600' },
  ];

  const highlightedFields = FORMULA_DEPENDENCIES[activeFormula] || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      {/* 顶部状态栏 */}
      <header className="bg-slate-800 text-white p-4 shadow-md flex justify-between items-center shrink-0 z-20">
        <div className="flex items-center gap-2">
          <Calculator className="w-6 h-6 text-blue-400" />
          <h1 className="text-xl font-bold tracking-tight">接触网腕臂计算系统</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            自动持久化已开启
          </div>
          <button onClick={resetParams} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-md transition-colors text-sm flex items-center gap-1">
            <RotateCcw className="w-4 h-4" /> 重置
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* 左侧：模式切换与选项 (深灰色背景) */}
        <aside className="w-72 bg-slate-900 text-slate-300 border-r border-slate-800 overflow-y-auto p-4 flex flex-col shrink-0 shadow-sm z-10">
          <div className="flex p-1 bg-slate-800 rounded-lg mb-6">
            <button 
              onClick={() => setCalcMode('single')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${calcMode === 'single' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <User className="w-4 h-4" /> 单点计算
            </button>
            <button 
              onClick={() => setCalcMode('batch')}
              className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${calcMode === 'batch' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-400'}`}
            >
              <Layers className="w-4 h-4" /> 批量计算
            </button>
          </div>

          {calcMode === 'single' ? (
            <div className="space-y-4">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">公式导航</h2>
              <div className="space-y-2">
                {formulaLabels.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFormula(f.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 font-bold ${
                      activeFormula === f.id 
                        ? `${f.activeBorder} bg-slate-800 text-white shadow-sm ring-1 ring-slate-700` 
                        : 'border-transparent bg-slate-800/40 hover:bg-slate-800 text-slate-500 border-slate-800'
                    }`}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-900/30 mt-4">
                <div className="flex items-start gap-2 text-blue-300 text-xs leading-relaxed">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <p>选中公式后，右侧相关参数将高亮显示。计算结果展示在右侧顶部区域。</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">批量处理操作</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl font-bold transition-all shadow-md shadow-blue-900/20"
                >
                  <FileUp className="w-5 h-5" /> 导入数据 (Excel/CSV)
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv, .xlsx, .xls" className="hidden" />
                
                <button 
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center gap-2 border-2 border-slate-800 hover:border-slate-700 hover:bg-slate-800 p-4 rounded-xl font-bold transition-all text-slate-400 hover:text-slate-200"
                >
                  <Download className="w-5 h-5" /> 下载 Excel 模板
                </button>

                <button 
                  onClick={exportBatchResults}
                  disabled={batchData.length === 0}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white p-4 rounded-xl font-bold transition-all disabled:opacity-20 disabled:bg-slate-800 shadow-md shadow-green-900/20"
                >
                  <FileDown className="w-5 h-5" /> 导出计算结果
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* 右侧：主内容区域 */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 relative">
          {calcMode === 'single' ? (
            <div className="max-w-5xl mx-auto p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              
              {/* 单点结果汇总展示区 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {formulaLabels.map((f) => (
                  <div 
                    key={f.id}
                    className={`bg-white p-4 rounded-2xl shadow-sm border-t-4 ${activeFormula === f.id ? f.activeBorder.replace('border-', 'border-') : 'border-slate-200'} transition-all`}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{f.name.split('. ')[1]}</p>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-2xl font-black ${activeFormula === f.id ? 'text-slate-900' : 'text-slate-400'}`}>
                        {singleResults[f.key as keyof typeof singleResults]}
                      </span>
                      <span className="text-xs font-bold text-slate-300">mm</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 支柱信息概览 */}
              <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xl">
                    <Hash className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">正在编辑支柱</h3>
                    <p className="text-2xl font-black text-slate-800">{params.pillarNo || "未命名"}</p>
                  </div>
                </div>
                <div className="hidden sm:block text-right">
                  <p className="text-xs text-slate-400 font-medium">公式关联状态</p>
                  <p className={`text-sm font-bold ${formulaLabels.find(f => f.id === activeFormula)?.color.replace('bg-', 'text-')}`}>
                    {formulaLabels.find(f => f.id === activeFormula)?.name} 已选中
                  </p>
                </div>
              </div>

              {/* 输入参数分组 */}
              {INPUT_GROUPS.map((group, idx) => (
                <section key={idx} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-1 bg-blue-600 rounded-full"></div>
                    <h3 className="font-bold text-slate-700">{group.title}</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.fields.map(field => {
                      const isHighlighted = highlightedFields.includes(field.key);
                      return (
                        <div 
                          key={field.key} 
                          className={`p-3 rounded-xl border transition-all duration-300 ${
                            isHighlighted 
                              ? 'bg-white border-blue-400 shadow-[0_0_15px_-3px_rgba(59,130,246,0.3)] ring-1 ring-blue-100' 
                              : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <label className="block text-xs font-bold text-slate-500 mb-2 px-1">
                            {field.label}
                          </label>
                          <input 
                            type={field.type}
                            value={params[field.key as keyof CalculationParams]}
                            onChange={(e) => handleInputChange(field.key as keyof CalculationParams, e.target.value)}
                            className="w-full bg-transparent border-b border-slate-100 focus:border-blue-500 py-1 px-1 outline-none text-slate-800 font-medium transition-colors"
                          />
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col p-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="flex-1 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-500" />
                    批量计算数据表 {batchData.length > 0 && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">共 {batchData.length} 条</span>}
                  </h3>
                </div>
                
                <div className="flex-1 overflow-auto">
                  {batchData.length > 0 ? (
                    <table className="w-full text-left border-collapse min-w-[1200px]">
                      <thead className="sticky top-0 bg-slate-800 text-white text-xs z-10">
                        <tr>
                          <th className="p-3 font-bold">支柱编号</th>
                          <th className="p-3 font-bold bg-blue-700 text-center text-white">平腕臂长度 (mm)</th>
                          <th className="p-3 font-bold bg-green-700 text-center text-white">斜腕臂长度 (mm)</th>
                          <th className="p-3 font-bold bg-orange-700 text-center text-white">抬高支平腕臂长度 (mm)</th>
                          <th className="p-3 font-bold bg-purple-700 text-center text-white">抬高支斜腕臂长度 (mm)</th>
                          <th className="p-3 font-bold opacity-70">限界</th>
                          <th className="p-3 font-bold opacity-70">导高</th>
                          <th className="p-3 font-bold opacity-70 text-right px-6">状态</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm">
                        {batchData.map((row, i) => (
                          <tr key={i} className="border-b border-slate-100 hover:bg-blue-50 transition-colors">
                            <td className="p-3 font-black text-slate-800">{row.pillarNo}</td>
                            <td className="p-3 font-black text-blue-600 text-center text-lg">{row.l1}</td>
                            <td className="p-3 font-black text-green-600 text-center text-lg">{row.l2}</td>
                            <td className="p-3 font-black text-orange-600 text-center text-lg">{row.l3}</td>
                            <td className="p-3 font-black text-purple-600 text-center text-lg">{row.l4}</td>
                            <td className="p-3 text-slate-500">{row.clearance}</td>
                            <td className="p-3 text-slate-500">{row.contactHeight}</td>
                            <td className="p-3 text-slate-400 text-xs italic text-right px-6">计算完成</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 p-12">
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center border-2 border-dashed border-slate-200">
                        <FileUp className="w-10 h-10" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-slate-600">暂无批量数据</p>
                        <p className="text-xs">支持 .csv, .xlsx, .xls 格式</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
