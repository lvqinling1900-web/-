
import { MeasurementPoint, PrismFaceData, ISOResult, CalculatedPoint } from '../types';

export const calculateISO230 = (
  measurements: MeasurementPoint[],
  prismData: PrismFaceData[]
): ISOResult => {
  // 核心：寻找全局零点 (第一个测回的正向 0° 读数)
  // 我们假设 measurements[0] 是 0° 位置
  const globalZeroOffset = measurements[0]?.forwardReadings[0] || 0;

  const points: CalculatedPoint[] = measurements.map((m, i) => {
    const prismError = prismData[i]?.error || 0;
    
    // 修正公式: (原始读数 - 全局零点) + 棱体偏差
    // 注意：棱体偏差是证书给出的差值，需要加回到相对读数上
    const correctedF = m.forwardReadings.map(v => (v - globalZeroOffset) + prismError);
    const correctedR = m.reverseReadings.map(v => (v - globalZeroOffset) + prismError);

    const n = correctedF.length;
    const meanF = correctedF.reduce((a, b) => a + b, 0) / n;
    const meanR = correctedR.reduce((a, b) => a + b, 0) / n;

    const stdF = n > 1 
      ? Math.sqrt(correctedF.reduce((sq, val) => sq + Math.pow(val - meanF, 2), 0) / (n - 1)) 
      : 0;
    const stdR = n > 1 
      ? Math.sqrt(correctedR.reduce((sq, val) => sq + Math.pow(val - meanR, 2), 0) / (n - 1)) 
      : 0;

    return {
      angle: m.targetAngle,
      prismError,
      correctedForwardRuns: correctedF,
      correctedReverseRuns: correctedR,
      meanForward: meanF,
      meanReverse: meanR,
      stdForward: stdF,
      stdReverse: stdR,
      deviationForward: meanF,
      deviationReverse: meanR,
      reversalError: Math.abs(meanF - meanR)
    };
  });

  const upperBandsF = points.map(p => p.meanForward + 2 * p.stdForward);
  const lowerBandsF = points.map(p => p.meanForward - 2 * p.stdForward);
  const upperBandsR = points.map(p => p.meanReverse + 2 * p.stdReverse);
  const lowerBandsR = points.map(p => p.meanReverse - 2 * p.stdReverse);

  // ISO 230-2 指标计算
  const A = Math.max(...upperBandsF, ...upperBandsR) - Math.min(...lowerBandsF, ...lowerBandsR);
  const E = Math.max(...points.map(p => p.meanForward), ...points.map(p => p.meanReverse)) - 
            Math.min(...points.map(p => p.meanForward), ...points.map(p => p.meanReverse));
  
  const R_up = Math.max(...points.map(p => 4 * p.stdForward));
  const R_down = Math.max(...points.map(p => 4 * p.stdReverse));
  const R = Math.max(R_up, R_down);
  
  const B = Math.max(...points.map(p => p.reversalError));
  
  const biMeans = points.map(p => (p.meanForward + p.meanReverse) / 2);
  const M = Math.max(...biMeans) - Math.min(...biMeans);

  return {
    A,
    A_up: Math.max(...upperBandsF) - Math.min(...lowerBandsF),
    A_down: Math.max(...upperBandsR) - Math.min(...lowerBandsR),
    R,
    R_up,
    R_down,
    B,
    E,
    E_up: Math.max(...points.map(p => p.meanForward)) - Math.min(...points.map(p => p.meanForward)),
    E_down: Math.max(...points.map(p => p.meanReverse)) - Math.min(...points.map(p => p.meanReverse)),
    M,
    points
  };
};
