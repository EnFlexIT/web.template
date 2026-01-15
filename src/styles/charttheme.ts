// src/styles/charttheme.ts
import { VictoryTheme } from "victory";

// optional helper (falls du es weiter nutzen willst)
const rgb = (r: number, g: number, b: number) => `rgb(${r}, ${g}, ${b})`;

const defaultColorScale = [
  rgb(91, 155, 213),
  rgb(237, 125, 49),
  rgb(255, 192, 0),
  rgb(165, 165, 165),
  rgb(68, 114, 196),
  rgb(112, 173, 71),
  rgb(37, 94, 145),
  rgb(158, 72, 14),
  rgb(99, 99, 99),
  rgb(153, 115, 0),
];

const blueScale = ["#728cffff", "#002fffff", "#0020b1ff", "#010102ff", "#000727ff"];

// ✅ Factory: Theme kommt rein, ChartTheme kommt raus
export function createEnFlexChart(theme: any) {
  const c: any = theme?.colors ?? {};

  // Fallbacks, falls Theme Keys anders heißen
  const text = c.text ?? "#111";
  const subText = c.textMuted ?? c.subText ?? c.textSecondary ?? text;
  const border = c.border ?? "rgba(0,0,0,0.12)";
  const highlight = c.highlight ?? "#728cff";
  const bg = c.background ?? "#fff";

  return {
    ...VictoryTheme.clean,

    // ✅ Global Axis / Grid (super wichtig, sonst sieht man in Darkmode nix)
    axis: {
      style: {
        axis: { stroke: border, strokeWidth: 1 },
        grid: { stroke: border, strokeDasharray: "4,6", opacity: 0.55 },
        ticks: { stroke: border, size: 5 },
        tickLabels: { fill: subText, fontSize: 10, padding: 6 },
        axisLabel: { fill: text, fontSize: 11, padding: 28, fontWeight: 600 },
      },
    },

    bar: {
      style: {
        data: {
          fill: highlight,
          opacity: 0.9,
        },
        labels: {
          fontSize: 11,
          fill: text,
        },
      },
      colorScale: defaultColorScale,
    },

    pie: {
      style: {
        labels: { fill: text, fontSize: 11 },
      },
      colorScale: defaultColorScale,
    },

    line: {
      style: {
        data: { stroke: highlight, strokeWidth: 2.5 },
        labels: { fill: text, fontSize: 11 },
      },
    },

    // optional: area theme
    area: {
      style: {
        data: { fill: highlight, opacity: 0.25 },
      },
    },

    // optional: chart background (Victory selbst hat kein "chart bg",
    // aber du kannst das per parent style / container lösen)
    // backgroundColor: bg  // (nur als Hinweis)
  };
}

export function createEnFlexChartBlue(theme: any) {
  const c: any = theme?.colors ?? {};
  const text = c.text ?? "#111";
  const subText = c.textMuted ?? c.subText ?? c.textSecondary ?? text;
  const border = c.border ?? "rgba(0,0,0,0.12)";

  return {
    ...VictoryTheme.clean,
    axis: {
      style: {
        axis: { stroke: border, strokeWidth: 1 },
        grid: { stroke: border, strokeDasharray: "4,6", opacity: 0.55 },
        ticks: { stroke: border, size: 5 },
        tickLabels: { fill: subText, fontSize: 10, padding: 6 },
        axisLabel: { fill: text, fontSize: 11, padding: 28, fontWeight: 600 },
      },
    },
    bar: {
      style: {
        data: { fill: "#251d80ff", opacity: 0.9 },
        labels: { fontSize: 11, fill: text },
      },
      colorScale: blueScale,
    },
    pie: {
      style: { labels: { fill: text, fontSize: 11 } },
      colorScale: blueScale,
    },
    line: {
      style: {
        data: { stroke: "#728cffff", strokeWidth: 2.5 },
        labels: { fill: text, fontSize: 11 },
      },
    },
  };
}
