
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PrismFaceData, MeasurementPoint, ISOResult } from './types';
import PrismTable from './components/PrismTable';
import MeasurementTable from './components/MeasurementTable';
import ResultDashboard from './components/ResultDashboard';
import { calculateISO230 } from './services/isoCalculator';
import { analyzeTestResults } from './services/geminiService';
import { 
  ClipboardCheck, BarChart3, ChevronRight, Activity, 
  Cpu, FileText, Layers, Database, X, Upload, CheckCircle2,
  AlertCircle
} from 'lucide-react';

const NUM_FACES = 24;
const PRISM_ERRORS = [
  0.0, 0.0, 0.4, 0.2, 0.2, 0.4, -0.3, -0.3, -0.3, 0.6,
  0.5, -0.4, -0.4, 0.1, 0.0, -0.3, 0.1, -0.5, -0.6, -0.5,
  0.2, -0.5, -0.7, 0.2
];

const INITIAL_PRISM_DATA: PrismFaceData[] = Array.from({ length: NUM_FACES }, (_, i) => ({
  face: i + 1,
  targetAngle: i * 15,
  error: PRISM_ERRORS[i] ?? 0
}));

const INITIAL_MEASUREMENTS: (numRuns: number) => MeasurementPoint[] = (numRuns) => 
  Array.from({ length: NUM_FACES }, (_, i) => ({
    face: i + 1,
    targetAngle: i * 15,
    forwardReadings: Array(numRuns).fill(0),
    reverseReadings: Array(numRuns).fill(0)
  }));

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'config' | 'measure' | 'results'>('config');
  const [numRuns, setNumRuns] = useState(5);
  const [prismData, setPrismData] = useState<PrismFaceData[]>(INITIAL_PRISM_DATA);
  const [measurements, setMeasurements] = useState<MeasurementPoint[]>(INITIAL_MEASUREMENTS(5));
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // 导入对话框状态
  const [importType, setImportType] = useState<'prism' | 'reading' | null>(null);
  const [importText, setImportText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMeasurements(prev => prev.map(m => ({
      ...m,
      forwardReadings: m.forwardReadings.length === numRuns ? [...m.forwardReadings] : Array(numRuns).fill(0),
      reverseReadings: m.reverseReadings.length === numRuns ? [...m.reverseReadings] : Array(numRuns).fill(0)
    })));
  }, [numRuns]);

  const results = useMemo(() => calculateISO230(measurements, prismData), [measurements, prismData]);

  // 核心：处理准直仪 0-345-0 序列导入
  const processReadingImport = (text: string) => {
    const allNumbers = text.match(/-?\d+(\.\d+)?/g)?.map(Number) || [];
    if (allNumbers.length === 0) {
      alert("未能在输入中找到有效数值。");
      return;
    }

    setMeasurements(prev => {
      const next = [...prev];
      let pointer = 0;
      let runsProcessed = 0;

      // 准直仪通常一测回 48 个点 (24 正 + 24 反)
      while (pointer < allNumbers.length && runsProcessed < numRuns) {
        // 处理正向序列 (0 -> 345)
        for (let i = 0; i < NUM_FACES; i++) {
          if (pointer < allNumbers.length) {
            next[i].forwardReadings[runsProcessed] = allNumbers[pointer++];
          }
        }
        // 处理反向序列 (345 -> 0)
        for (let i = NUM_FACES - 1; i >= 0; i--) {
          if (pointer < allNumbers.length) {
            next[i].reverseReadings[runsProcessed] = allNumbers[pointer++];
          }
        }
        runsProcessed++;
      }
      return next;
    });

    alert(`成功按 0-345-0 序列导入了 ${Math.min(Math.ceil(allNumbers.length / 48), numRuns)} 个测回的数据！`);
    setImportType(null);
    setImportText('');
  };

  const processPrismImport = (text: string) => {
    const lines = text.trim().split(/\r?\n/);
    let count = 0;
    setPrismData(prev => {
      const next = [...prev];
      lines.forEach((line, i) => {
        const nums = line.match(/-?\d+(\.\d+)?/g);
        if (nums && nums.length > 0 && i < next.length) {
          next[i] = { ...next[i], error: parseFloat(nums[nums.length - 1]) };
          count++;
        }
      });
      return next;
    });
    alert(`已导入 ${count} 条棱体偏差修正值。`);
    setImportType(null);
    setImportText('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importType === 'prism') processPrismImport(content);
      else if (importType === 'reading') processReadingImport(content);
    };
    reader.readAsText(file);
  };

  // Fix: Added missing handlePrismChange function to update prism data
  const handlePrismChange = (index: number, error: number) => {
    setPrismData(prev => prev.map((item, idx) => 
      idx === index ? { ...item, error } : item
    ));
  };

  const handleMeasurementChange = (faceIdx: number, type: 'forward' | 'reverse', runIdx: number, value: number) => {
    setMeasurements(prev => prev.map((m, idx) => {
      if (idx === faceIdx) {
        const newM = { ...m };
        if (type === 'forward') {
          const newF = [...m.forwardReadings];
          newF[runIdx] = value;
          newM.forwardReadings = newF;
        } else {
          const newR = [...m.reverseReadings];
          newR[runIdx] = value;
          newM.reverseReadings = newR;
        }
        return newM;
      }
      return m;
    }));
  };

  const loadDemoData = () => {
    const demoPrism = prismData.map((d, i) => ({ ...d, error: Number((Math.sin(i * 0.5) * 0.5).toFixed(2)) }));
    const demoMeas = measurements.map((m, i) => ({
      ...m,
      forwardReadings: m.forwardReadings.map(() => Number((10 + Math.sin(i * 0.4) * 5 + Math.random() * 0.5).toFixed(2))),
      reverseReadings: m.reverseReadings.map(() => Number((11 + Math.sin(i * 0.4) * 5 + Math.random() * 0.5).toFixed(2)))
    }));
    setPrismData(demoPrism);
    setMeasurements(demoMeas);
    setActiveTab('results');
  };

  const handleGenerateReport = async () => {
    setIsAnalyzing(true);
    setAiReport(null);
    try {
      const report = await analyzeTestResults(results);
      setAiReport(report);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 no-print">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            直驱转台精度测试系统 <span className="text-slate-400 font-normal text-sm ml-2">ISO 230-2 标准</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-md border border-slate-200">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-semibold">测回数:</span>
            <select 
              value={numRuns} 
              onChange={(e) => setNumRuns(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold outline-none cursor-pointer"
            >
              {[1, 2, 3, 5, 10].map(v => <option key={v} value={v}>{v} 次</option>)}
            </select>
          </div>
          <button onClick={loadDemoData} className="px-4 py-1.5 bg-slate-800 text-white rounded-md text-xs font-semibold hover:bg-slate-700 transition-colors">加载演示数据</button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 bg-slate-50 border-r border-slate-200 p-4 shrink-0 no-print">
          <nav className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">检定流程</p>
            {[
              { id: 'config', icon: Database, label: '棱体偏差修正' },
              { id: 'measure', icon: ClipboardCheck, label: '测量读数录入' },
              { id: 'results', icon: BarChart3, label: '报告与仪表盘' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${activeTab === tab.id ? 'bg-white shadow-sm border border-slate-200 text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm font-semibold">{tab.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-8 bg-white">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'config' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">棱体证书数据</h2>
                  <p className="text-slate-500 text-sm">请录入棱体修正偏差值。系统会自动将其应用到后续测量数据中。</p>
                </div>
                <PrismTable 
                  data={prismData} 
                  onChange={handlePrismChange} 
                  onBulkPaste={() => setImportType('prism')} 
                />
                <div className="flex justify-end">
                  <button onClick={() => setActiveTab('measure')} className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold text-sm flex items-center gap-2 hover:bg-blue-700">
                    下一步：录入测量读数 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'measure' && (
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">准直仪读数录入</h2>
                    <p className="text-slate-500 text-sm">当前序列: 0° → 345° (正) → 345° → 0° (反)。系统已开启首点零位补偿。</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-[11px] text-amber-800 font-medium">基准零点: {measurements[0].forwardReadings[0].toFixed(2)}" (第1测回 0°)</span>
                  </div>
                </div>
                <MeasurementTable 
                  measurements={measurements} 
                  onChange={handleMeasurementChange} 
                  onBulkPaste={() => setImportType('reading')} 
                  numRuns={numRuns} 
                />
                <div className="flex justify-end">
                  <button onClick={() => setActiveTab('results')} className="px-6 py-2 bg-blue-600 text-white rounded-md font-bold text-sm flex items-center gap-2 hover:bg-blue-700">
                    计算精度报告 <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'results' && (
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">检定结果分析</h2>
                    <p className="text-slate-500 text-sm font-mono tracking-tighter">ISO 230-2:2014 COMPLIANT</p>
                  </div>
                  <button 
                    onClick={handleGenerateReport} 
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-md font-bold text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Cpu className={isAnalyzing ? 'animate-spin' : ''} />
                    {isAnalyzing ? '正在处理...' : 'AI 专家分析报告'}
                  </button>
                </div>
                <ResultDashboard results={results} />
                {aiReport && (
                  <div className="mt-8 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-2 mb-4 text-blue-600">
                      <FileText className="w-5 h-5" />
                      <h3 className="font-bold underline underline-offset-4">AI 专家诊断结论</h3>
                    </div>
                    <div className="text-slate-700 text-sm leading-relaxed whitespace-pre-line prose max-w-none">
                      {aiReport}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* 统一导入模态框 */}
      {importType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800">批量导入{importType === 'prism' ? '棱体修正' : '准直仪读数'}</h3>
              </div>
              <button onClick={() => setImportType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="flex gap-4">
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-slate-600 hover:text-blue-600"
                >
                  <Upload className="w-5 h-5" />
                  <span className="text-sm font-bold">选择 CSV/TXT 文件</span>
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".csv,.txt" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>

              <div className="relative">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder={importType === 'prism' ? "粘贴棱体偏差数据..." : "在此粘贴准直仪采集序列 (自动识别 0-345-0)..."}
                  className="w-full h-48 p-4 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none bg-slate-50/50"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  {importType === 'reading' 
                    ? "系统将按 1-24(正) 然后 24-1(反) 的顺序解析数据流，每个测回 48 个点。多测回数据将自动排队填充。"
                    : "系统会提取每行末尾的数字作为 24 个面的修正值。"}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setImportType(null)} className="px-4 py-2 text-sm font-bold text-slate-500">取消</button>
              <button 
                onClick={() => importType === 'prism' ? processPrismImport(importText) : processReadingImport(importText)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700"
              >
                立即导入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
