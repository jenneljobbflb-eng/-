
import { CalculationParams } from './types';

export const DEFAULT_PARAMS: CalculationParams = {
  pillarNo: '例子',
  outerRailCant: 0,
  gauge: 1435,
  upperBaseFitting: 220,
  horizInsulator: 790,
  clevisFitting: 74,
  lowerBaseFitting: 220,
  inclinedInsulator: 790,
  baseDistance: 1800,
  contactHeight: 6450,
  structHeight: 1320,
  stagger: 300,
  slope: 25,
  clearance: 3114,
  steadyArmLength: 1000,
  steadyArmSlope: 0.25, // 1/4
  clevisToMessenger: 300,
  horizExposure: 300,
  steadyTubeExposure: 300,
  elevRise: 500,
  elevStagger: 100,
  elevHorizExposure: 300,
};

// 所有的参数键值对，用于 CSV 解析
export const CSV_HEADER_MAP: Record<string, keyof CalculationParams> = {
  "支柱编号": "pillarNo",
  "外轨超高": "outerRailCant",
  "轨距": "gauge",
  "上底座扣料": "upperBaseFitting",
  "平腕臂绝缘子扣料": "horizInsulator",
  "套管双耳扣料": "clevisFitting",
  "下底座扣料": "lowerBaseFitting",
  "斜腕臂绝缘子扣料": "inclinedInsulator",
  "上下底座间距": "baseDistance",
  "导高": "contactHeight",
  "结构高度": "structHeight",
  "拉出值": "stagger",
  "支柱斜率": "slope",
  "限界": "clearance",
  "定位器长度": "steadyArmLength",
  "定位器坡度": "steadyArmSlope",
  "套管双耳距承力索座": "clevisToMessenger",
  "平腕臂外露": "horizExposure",
  "定位管外露": "steadyTubeExposure",
  "抬高支抬高值": "elevRise",
  "抬高支拉出值": "elevStagger",
  "抬高支平腕臂外露": "elevHorizExposure"
};

export const FORMULA_DEPENDENCIES: Record<string, string[]> = {
  l1: ['clearance', 'slope', 'contactHeight', 'structHeight', 'stagger', 'outerRailCant', 'gauge', 'upperBaseFitting', 'horizInsulator', 'horizExposure'],
  l2: ['clearance', 'slope', 'contactHeight', 'structHeight', 'stagger', 'outerRailCant', 'gauge', 'upperBaseFitting', 'horizInsulator', 'horizExposure', 'clevisToMessenger', 'baseDistance', 'lowerBaseFitting', 'clevisFitting', 'inclinedInsulator'],
  l3: ['clearance', 'upperBaseFitting', 'elevStagger', 'outerRailCant', 'contactHeight', 'structHeight', 'gauge', 'slope', 'elevRise', 'horizInsulator', 'elevHorizExposure'],
  l4: ['clearance', 'upperBaseFitting', 'elevStagger', 'outerRailCant', 'contactHeight', 'structHeight', 'gauge', 'slope', 'elevRise', 'horizInsulator', 'elevHorizExposure', 'clevisToMessenger', 'baseDistance', 'lowerBaseFitting', 'clevisFitting', 'inclinedInsulator']
};

export const INPUT_GROUPS = [
  {
    title: '基础与轨道信息',
    fields: [
      { key: 'pillarNo', label: '支柱编号', type: 'text' },
      { key: 'gauge', label: '轨距 (mm)', type: 'number' },
      { key: 'outerRailCant', label: '外轨超高 (mm)', type: 'number' },
    ]
  },
  {
    title: '几何参数',
    fields: [
      { key: 'clearance', label: '限界 (mm)', type: 'number' },
      { key: 'contactHeight', label: '导高 (mm)', type: 'number' },
      { key: 'structHeight', label: '结构高度 (mm)', type: 'number' },
      { key: 'stagger', label: '拉出值 (mm)', type: 'number' },
      { key: 'slope', label: '支柱斜率 (‰)', type: 'number' },
    ]
  },
  {
    title: '扣料与间距参数',
    fields: [
      { key: 'upperBaseFitting', label: '上底座扣料 (mm)', type: 'number' },
      { key: 'lowerBaseFitting', label: '下底座扣料 (mm)', type: 'number' },
      { key: 'horizInsulator', label: '平腕臂绝缘子扣料 (mm)', type: 'number' },
      { key: 'inclinedInsulator', label: '斜腕臂绝缘子扣料 (mm)', type: 'number' },
      { key: 'clevisFitting', label: '套管双耳扣料 (mm)', type: 'number' },
      { key: 'baseDistance', label: '上下底座间距 (mm)', type: 'number' },
      { key: 'clevisToMessenger', label: '双耳距承力索座 (mm)', type: 'number' },
    ]
  },
  {
    title: '定位与抬高支参数',
    fields: [
      { key: 'horizExposure', label: '平腕臂外露 (mm)', type: 'number' },
      { key: 'steadyTubeExposure', label: '定位管外露 (mm)', type: 'number' },
      { key: 'elevRise', label: '抬高支抬高值 (mm)', type: 'number' },
      { key: 'elevStagger', label: '抬高支拉出值 (mm)', type: 'number' },
      { key: 'elevHorizExposure', label: '抬高支平腕臂外露 (mm)', type: 'number' },
    ]
  }
];
