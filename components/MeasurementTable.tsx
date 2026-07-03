
import React from 'react';
import { MeasurementPoint } from '../types';
import { Clipboard } from 'lucide-react';

interface Props {
  measurements: MeasurementPoint[];
  onChange: (faceIdx: number, type: 'forward' | 'reverse', runIdx: number, value: number) => void;
  onBulkPaste: () => void;
  numRuns: number;
}

const MeasurementTable: React.FC<Props> = ({ measurements, onChange, onBulkPaste, numRuns }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <span className="text-sm font-bold text-slate-700">原始测量读数录入</span>
        <button 
          onClick={onBulkPaste}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded text-xs font-bold transition-all shadow-sm"
          title="从剪贴板粘贴 Excel 矩阵数据"
        >
          <Clipboard className="w-3.5 h-3.5" />
          批量粘贴读数
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse data-table">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="px-4 py-4 font-bold border-r border-slate-200" rowSpan={2}>角度位置</th>
              <th className="px-4 py-2 text-center border-b border-r border-slate-200 bg-blue-50/50 text-blue-700" colSpan={numRuns}>正向读数 (Forward)</th>
              <th className="px-4 py-2 text-center border-b bg-red-50/50 text-red-700" colSpan={numRuns}>反向读数 (Reverse)</th>
            </tr>
            <tr className="bg-slate-50/50">
              {[...Array(numRuns)].map((_, i) => (
                <th key={`fh-${i}`} className="px-2 py-2 text-center border-r border-slate-200 font-bold">R{i+1}</th>
              ))}
              {[...Array(numRuns)].map((_, i) => (
                <th key={`rh-${i}`} className="px-2 py-2 text-center border-r border-slate-200 last:border-r-0 font-bold">R{i+1}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {measurements.map((m, faceIdx) => (
              <tr key={m.face} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2 font-bold text-slate-700 border-r border-slate-200 bg-slate-50/30">{m.targetAngle}°</td>
                {m.forwardReadings.map((val, runIdx) => (
                  <td key={`f-${faceIdx}-${runIdx}`} className="px-1 py-1 border-r border-slate-200">
                    <input
                      type="number"
                      step="0.01"
                      value={val}
                      onChange={(e) => onChange(faceIdx, 'forward', runIdx, parseFloat(e.target.value) || 0)}
                      className="text-center font-mono font-bold text-blue-600"
                    />
                  </td>
                ))}
                {m.reverseReadings.map((val, runIdx) => (
                  <td key={`r-${faceIdx}-${runIdx}`} className="px-1 py-1 border-r border-slate-200 last:border-r-0">
                    <input
                      type="number"
                      step="0.01"
                      value={val}
                      onChange={(e) => onChange(faceIdx, 'reverse', runIdx, parseFloat(e.target.value) || 0)}
                      className="text-center font-mono font-bold text-red-600"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MeasurementTable;
