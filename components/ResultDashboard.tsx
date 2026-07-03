
import React, { useMemo } from 'react';
import { ISOResult } from '../types';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine, 
  Line,
  ComposedChart,
  Label,
  Legend,
  ReferenceArea
} from 'recharts';
import { Printer, FileSpreadsheet } from 'lucide-react';

interface Props {
  results: ISOResult;
}

// 颜色定义
const COLOR_F = '#1e40af'; // 正向 - 深蓝
const COLOR_R = '#dc2626'; // 反向 - 鲜红
const COLOR_BI = '#020617'; // 双向平均 - 纯黑
const COLOR_BAND = '#64748b'; // 区间线 - 灰

const ResultDashboard: React.FC<Props> = ({ results }) => {
  const chartData = useMemo(() => {
    return results.points.map(p => ({
      angle: p.angle,
      meanF: Number(p.meanForward.toFixed(3)),
      meanR: Number(p.meanReverse.toFixed(3)),
      meanBi: Number(((p.meanForward + p.meanReverse) / 2).toFixed(3)),
      upperF: Number((p.meanForward + 2 * p.stdForward).toFixed(3)),
      lowerF: Number((p.meanForward - 2 * p.stdForward).toFixed(3)),
      upperR: Number((p.meanReverse + 2 * p.stdReverse).toFixed(3)),
      lowerR: Number((p.meanReverse - 2 * p.stdReverse).toFixed(3)),
    }));
  }, [results]);

  const isoBounds = useMemo(() => {
    const allValues = results.points.flatMap(p => [
      p.meanForward + 2 * p.stdForward,
      p.meanForward - 2 * p.stdForward,
      p.meanReverse + 2 * p.stdReverse,
      p.meanReverse - 2 * p.stdReverse
    ]);

    return {
      min: Math.min(...allValues),
      max: Math.max(...allValues),
      A_max: Math.max(...results.points.map(p => Math.max(p.meanForward + 2 * p.stdForward, p.meanReverse + 2 * p.stdReverse))),
      A_min: Math.min(...results.points.map(p => Math.min(p.meanForward - 2 * p.stdForward, p.meanReverse - 2 * p.stdReverse))),
    };
  }, [results]);

  const yDomain = useMemo(() => {
    const range = isoBounds.max - isoBounds.min;
    if (range === 0) return [isoBounds.min - 1, isoBounds.max + 1];
    const padding = range * 0.08; // 8% 紧凑缓冲
    return [
      Number((isoBounds.min - padding).toFixed(2)),
      Number((isoBounds.max + padding).toFixed(2))
    ];
  }, [isoBounds]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4 no-print">
          <h3 className="text-lg font-bold text-slate-800">ISO 230-2 精度特性分布图</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded text-xs font-bold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> 导出
            </button>
            <button onClick={() => window.print()} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-bold shadow-md flex items-center gap-2">
              <Printer className="w-4 h-4" /> 打印报告
            </button>
          </div>
        </div>

        <div className="h-[550px] w-full bg-white relative">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 20, right: 20, left: 30, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={true} />
              
              <XAxis 
                dataKey="angle" 
                type="number" 
                domain={[0, 360]} 
                ticks={[0, 45, 90, 135, 180, 225, 270, 315, 360]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              
              <YAxis domain={yDomain} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} allowDecimals={true}>
                <Label 
                  value="偏差 Deviation (arcsec)" 
                  angle={-90} 
                  position="insideLeft" 
                  offset={-15}
                  style={{ textAnchor: 'middle', fontSize: '12px', fontWeight: 600, fill: '#475569' }} 
                />
              </YAxis>

              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                formatter={(value: number, name: string) => [`${value.toFixed(3)} "`, name]}
              />

              <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={1} />

              {/* A 指标范围标注 */}
              <ReferenceLine segment={[{ x: 350, y: isoBounds.A_min }, { x: 360, y: isoBounds.A_min }]} stroke={COLOR_F} strokeWidth={1} strokeDasharray="3 3" />
              <ReferenceLine segment={[{ x: 350, y: isoBounds.A_max }, { x: 360, y: isoBounds.A_max }]} stroke={COLOR_F} strokeWidth={1} strokeDasharray="3 3" />
              <ReferenceArea {...({ x1: 357, x2: 360, y1: isoBounds.A_min, y2: isoBounds.A_max, fill: COLOR_F, fillOpacity: 0.1 } as any)}>
                <Label value={`A:${results.A.toFixed(2)}"`} position="left" offset={10} style={{ fontSize: '11px', fontWeight: 'bold', fill: COLOR_F }} />
              </ReferenceArea>

              {/* 正向平均线 - 实线 */}
              <Line name="x̄i↑" dataKey="meanF" stroke={COLOR_F} strokeWidth={2} dot={{ r: 3, fill: COLOR_F }} type="linear" />
              
              {/* 反向平均线 - 虚线 */}
              <Line name="x̄i↓" dataKey="meanR" stroke={COLOR_R} strokeWidth={2} strokeDasharray="8 4" dot={{ r: 3, fill: COLOR_R }} type="linear" />
              
              {/* 置信区间 - 点划线 */}
              <Line name="x̄i ± 2s" dataKey="upperF" stroke={COLOR_BAND} strokeWidth={1} strokeDasharray="10 4 2 4" dot={false} type="linear" strokeOpacity={0.6} />
              <Line dataKey="lowerF" stroke={COLOR_BAND} strokeWidth={1} strokeDasharray="10 4 2 4" dot={false} type="linear" strokeOpacity={0.6} />
              <Line dataKey="upperR" stroke={COLOR_BAND} strokeWidth={1} strokeDasharray="10 4 2 4" dot={false} type="linear" strokeOpacity={0.6} />
              <Line dataKey="lowerR" stroke={COLOR_BAND} strokeWidth={1} strokeDasharray="10 4 2 4" dot={false} type="linear" strokeOpacity={0.6} />
              
              {/* 双向平均线 - 加粗实线 */}
              <Line name="x̄i" dataKey="meanBi" stroke={COLOR_BI} strokeWidth={3} dot={false} type="linear" />

              <Legend verticalAlign="bottom" align="center" height={40} wrapperStyle={{ fontSize: '12px', paddingTop: '20px', fontFamily: 'serif' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 核心指标展示 (移至底部) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 no-print">
        {[
          { label: '双向定位精度 A', val: results.A, color: 'text-blue-700', bg: 'bg-blue-50' },
          { label: '定位偏差 E', val: results.E, color: 'text-slate-700', bg: 'bg-slate-50' },
          { label: '双向重复精度 R', val: results.R, color: 'text-indigo-700', bg: 'bg-indigo-50' },
          { label: '反向差值 B', val: results.B, color: 'text-red-700', bg: 'bg-red-50' },
          { label: '平均偏差 M', val: results.M, color: 'text-emerald-700', bg: 'bg-emerald-50' },
        ].map((item, i) => (
          <div key={i} className={`${item.bg} border border-slate-200 p-5 rounded-xl shadow-sm flex flex-col justify-center`}>
            <p className="text-base font-bold text-slate-900 mb-2">{item.label}</p>
            <p className={`text-3xl font-black font-mono ${item.color} flex items-start`}>
              <span className="leading-none">{item.val.toFixed(1)}</span>
              <span className="text-lg font-bold opacity-70 ml-0.5 leading-none">"</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResultDashboard;
