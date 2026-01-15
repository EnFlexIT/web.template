// src/components/ui-elements/charts/types.ts

export interface BarChartDataPoint {
  label: string;
  value: number;
}

export interface BarChartProps {
  data: BarChartDataPoint[];
  height?: number;
}
