
import React from 'react';
import { PrismFaceData } from '../types';
import { Clipboard } from 'lucide-react';

interface Props {
  data: PrismFaceData[];
  onChange: (index: number, error: number) => void;
  onBulkPaste: () => void;
}

const PrismTable: React.FC<Props> = ({ data, onChange, onBulkPaste }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <span className="text-sm font-bold text-slate-700">棱体误差明细 (24面)</span>
        <button 
          onClick={onBulkPaste}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 rounded text-xs font-bold transition-all shadow-sm"
          title="从剪贴板粘贴 Excel 数据"
        >
          <Clipboard className="w-3.5 h-3.5" />
          批量粘贴误差值
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse data-table">
          <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 font-bold">棱体面号</th>
              <th className="px-6 py-3 font-bold">目标角度 (°)</th>
              <th className="px-6 py-3 font-bold">修正偏差 (arcsec)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item, idx) => (
              <tr key={item.face} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-3 font-mono text-slate-500 font-semibold">{item.face}</td>
                <td className="px-6 py-3 font-semibold">{item.targetAngle}°</td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    step="0.01"
                    value={item.error}
                    onChange={(e) => onChange(idx, parseFloat(e.target.value) || 0)}
                    className="max-w-[150px] font-mono font-bold text-blue-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PrismTable;
