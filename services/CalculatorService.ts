
import { CalculationParams, CalculationResults } from '../types';

export const calculateResults = (p: CalculationParams): CalculationResults => {
  // 基础公用值：导高 + 结构高度 (总高度)
  const totalH = p.contactHeight + p.structHeight;

  // --- 公式1: 平腕臂长度 L1 (对应 Excel W 列) ---
  const l1 = p.clearance + (p.slope / 1000) * totalH - p.stagger - (p.outerRailCant * totalH) / p.gauge - p.upperBaseFitting - p.horizInsulator + p.horizExposure;

  // --- 公式2: 斜腕臂长度 L2 (对应 Excel X 列) ---
  const l2_horiz = l1 + p.upperBaseFitting + p.horizInsulator - p.horizExposure - p.clevisToMessenger - (p.baseDistance * p.slope / 1000 + p.lowerBaseFitting);
  const l2_vert = p.baseDistance - p.clevisFitting;
  const l2 = Math.sqrt(Math.pow(l2_horiz, 2) + Math.pow(l2_vert, 2)) - p.inclinedInsulator;

  // --- 公式3: 抬高支平腕臂长度 L3 (对应 Excel Y 列) ---
  const l3_horiz_comp = p.clearance - p.upperBaseFitting - p.elevStagger - (p.outerRailCant * totalH) / p.gauge + (p.slope * totalH) / 1000;
  const l3 = Math.sqrt(Math.pow(l3_horiz_comp, 2) + Math.pow(p.elevRise, 2)) - p.horizInsulator + p.elevHorizExposure;

  // --- 公式4: 抬高支斜腕臂长度 L4 (对应 Excel Z 列) ---
  const Y4 = l3;
  const V4 = p.elevHorizExposure;
  const Q4 = p.clevisToMessenger;
  const E4 = p.horizInsulator;
  const T4 = p.elevRise;
  const I4 = p.baseDistance;
  const M4 = p.slope;
  const G4 = p.lowerBaseFitting;
  const D4 = p.upperBaseFitting;
  const F4 = p.clevisFitting;
  const H4 = p.inclinedInsulator;

  const commonA = Y4 - V4 + E4;
  const commonB = Y4 - V4 - Q4 + E4;

  const horizontalRoot = Math.sqrt(Math.max(0, Math.pow(commonA, 2) - Math.pow(T4, 2)));
  const partX = (commonB * horizontalRoot / commonA) - (I4 * M4 / 1000 + G4) + D4;
  const partY = (T4 * commonB / commonA) + I4 - F4;
  const l4 = Math.sqrt(Math.pow(partX, 2) + Math.pow(partY, 2)) - H4;

  // 按照用户要求，返回四舍五入后的整数值
  return {
    l1: Math.round(l1),
    l2: Math.round(l2),
    l3: Math.round(l3),
    l4: Math.round(l4),
  };
};
