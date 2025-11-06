import { VictoryTheme } from "victory";

const colors = [
      rgb(91, 155, 213),
      rgb(237, 125, 49),
      rgb(255, 192, 0),
      rgb(165, 165, 165),
      rgb(68, 114, 196),
      rgb(112, 173, 71),
      rgb(37, 94, 145),
      rgb(158, 72, 14),
      rgb(99, 99, 99),
      rgb(153, 115, 0)
    ];

const colorsblue = [
      "#728cffff",
      "#002fffff",
      "#0020b1ff",
      "#010102ff",
      "#000727ff",
    ];

export const EnFlexChart = {
  ...VictoryTheme.clean,
  bar: {
    style: {
      data: { fill: "#728cffff" },
      labels: {
        fontsize: 12,
        fill: "#3828eeff",
      },
    },
    colorScale: colors,
  },
  pie: {
    style: {},
    colorScale: colors,
  },
  line: {
    style: {
      data: { stroke: "#728cffff", strokeWidth: 3 },
    },
  },
};

export const EnFlexChartBlue = {
  ...VictoryTheme.clean,
  bar: {
    style: {
      data: { fill: "#251d80ff" },
      labels: {
        fontsize: 12,
        fill: "#090629ff",
      },
    },
    colorScale: colorsblue,
  },
  pie: {
    style: {},
    colorScale: colorsblue,
  },
  line: {
    style: {
      data: { stroke: "#728cffff", strokeWidth: 3 },
    },
  },
};
