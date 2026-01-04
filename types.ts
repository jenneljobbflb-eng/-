
export interface CalculationParams {
  pillarNo: string;           // 支柱编号
  outerRailCant: number;      // 外轨超高
  gauge: number;              // 轨距
  upperBaseFitting: number;   // 上底座扣料
  horizInsulator: number;     // 平腕臂绝缘子扣料
  clevisFitting: number;      // 套管双耳扣料
  lowerBaseFitting: number;   // 下底座扣料
  inclinedInsulator: number;  // 斜腕臂绝缘子扣料
  baseDistance: number;       // 上下底座间距
  contactHeight: number;      // 导高
  structHeight: number;       // 结构高度
  stagger: number;            // 拉出值
  slope: number;              // 支柱斜率
  clearance: number;          // 限界
  steadyArmLength: number;    // 定位器长度
  steadyArmSlope: number;     // 定位器坡度
  clevisToMessenger: number;  // 套管双耳距承力索座
  horizExposure: number;      // 平腕臂外露
  steadyTubeExposure: number; // 定位管外露
  elevRise: number;           // 抬高支抬高值
  elevStagger: number;        // 抬高支拉出值
  elevHorizExposure: number;  // 抬高支平腕臂外露
}

export interface CalculationResults {
  l1: number; // 平腕臂长度
  l2: number; // 斜腕臂长度
  l3: number; // 抬高支平腕臂长度
  l4: number; // 抬高支斜腕臂长度
}
