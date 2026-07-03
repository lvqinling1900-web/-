
export interface PrismFaceData {
  face: number;
  targetAngle: number;
  error: number; // 棱体自身偏差 (arcsec)
}

export interface Reading {
  forward: number[]; // 多次往返测量值 (arcsec)
  reverse: number[];
}

export interface MeasurementPoint {
  face: number;
  targetAngle: number;
  forwardReadings: number[];
  reverseReadings: number[];
}

export interface ISOResult {
  A: number; // 双向定位精度
  A_up: number; // 正向定位精度
  A_down: number; // 反向定位精度
  R: number; // 双向重复定位精度
  R_up: number; // 正向重复定位精度
  R_down: number; // 反向重复定位精度
  B: number; // 反向差值 (回程误差)
  E: number; // 定位偏差
  E_up: number;
  E_down: number;
  M: number; // Mean bi-directional positioning error
  points: CalculatedPoint[];
}

export interface CalculatedPoint {
  angle: number;
  prismError: number;
  correctedForwardRuns: number[];
  correctedReverseRuns: number[];
  meanForward: number;
  meanReverse: number;
  stdForward: number;
  stdReverse: number;
  deviationForward: number;
  deviationReverse: number;
  reversalError: number;
}
