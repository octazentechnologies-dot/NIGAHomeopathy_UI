import React from "react";
import ReactApexChart from "react-apexcharts";
import getChartColorsArray from "../../../Components/Common/ChartsDynamicColor";
import ReactEcharts from "echarts-for-react";
import {
    PATIENT_STATS_STATUS_LABELS,
    PATIENT_STATS_CHART_COLORS,
} from "./patientStatsChartsHelper";

const patientStatsLegendBase = {
    type: "scroll",
    left: "center",
    itemWidth: 10,
    itemHeight: 10,
    itemGap: 12,
    textStyle: {
        color: "#858d98",
        fontSize: 11,
    },
};

const doughnutLegend = {
    ...patientStatsLegendBase,
    orient: "horizontal",
    bottom: 0,
    width: "92%",
};

const barLegend = {
    ...patientStatsLegendBase,
    orient: "horizontal",
    top: 0,
    width: "96%",
};

const buildPatientBarSeries = (name, data, isFirst) => ({
    name,
    type: "bar",
    barMaxWidth: 20,
    ...(isFirst ? { barGap: "18%" } : {}),
    itemStyle: {
        borderRadius: [4, 4, 0, 0],
    },
    label: {
        show: true,
        position: "top",
        distance: 4,
        fontSize: 11,
        fontWeight: 500,
        color: "#495057",
        formatter: (params) => (Number(params.value) > 0 ? params.value : ""),
    },
    emphasis: { focus: "series" },
    data,
});

const RevenueCharts = ({ dataColors, series }) => {
  var linechartcustomerColors = getChartColorsArray(dataColors);

  var options = {
    chart: {
      height: 370,
      type: "line",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      dashArray: [0, 0, 8],
      width: [2, 0, 2.2],
    },
    fill: {
      opacity: [0.1, 0.9, 1],
    },
    markers: {
      size: [0, 0, 0],
      strokeWidth: 2,
      hover: {
        size: 4,
      },
    },
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      axisTicks: {
        show: false,
      },
      axisBorder: {
        show: false,
      },
    },
    grid: {
      show: true,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: false,
        },
      },
      padding: {
        top: 0,
        right: -2,
        bottom: 15,
        left: 10,
      },
    },
    legend: {
      show: true,
      horizontalAlign: "center",
      offsetX: 0,
      offsetY: -5,
      markers: {
        width: 9,
        height: 9,
        radius: 6,
      },
      itemMargin: {
        horizontal: 10,
        vertical: 0,
      },
    },
    plotOptions: {
      bar: {
        columnWidth: "30%",
        barHeight: "70%",
      },
    },
    colors: linechartcustomerColors,
    tooltip: {
      shared: true,
      y: [
        {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0);
            }
            return y;
          },
        },
        {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return "$" + y.toFixed(2) + "k";
            }
            return y;
          },
        },
        {
          formatter: function (y) {
            if (typeof y !== "undefined") {
              return y.toFixed(0) + " Sales";
            }
            return y;
          },
        },
      ],
    },
  };
  return (
    <React.Fragment>
      <ReactApexChart dir="ltr"
        options={options}
        series={series}
        type="line"
        height="370"
        className="apex-charts"
      />
    </React.Fragment>
  );
};

const StoreVisitsCharts = ({ colors = PATIENT_STATS_CHART_COLORS, series }) => {
  const chartSeries = series && Array.isArray(series) ? series : [0, 0, 0, 0, 0, 0];
  const total = chartSeries.reduce((sum, value) => sum + (Number(value) || 0), 0);
  const pieData = PATIENT_STATS_STATUS_LABELS.map((name, index) => ({
    value: chartSeries[index] ?? 0,
    name,
  }));

  const option = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} ({d}%)",
    },
    legend: {
      ...doughnutLegend,
      data: PATIENT_STATS_STATUS_LABELS,
    },
    color: colors,
    series: [
      {
        name: "Patient Stats",
        type: "pie",
        center: ["50%", "42%"],
        radius: ["44%", "68%"],
        avoidLabelOverlap: true,
        itemStyle: {
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: {
          show: false,
        },
        emphasis: {
          scale: true,
          scaleSize: 8,
          itemStyle: {
            shadowBlur: 12,
            shadowColor: "rgba(15, 34, 58, 0.12)",
          },
        },
        labelLine: {
          show: false,
        },
        data: pieData,
      },
    ],
    graphic: total > 0 ? [{
      type: "text",
      left: "center",
      top: "38%",
      style: {
        text: `${total}`,
        textAlign: "center",
        fill: "#495057",
        fontSize: 22,
        fontWeight: 600,
        fontFamily: "Poppins, sans-serif",
      },
    }, {
      type: "text",
      left: "center",
      top: "46%",
      style: {
        text: "Total",
        textAlign: "center",
        fill: "#858d98",
        fontSize: 11,
        fontFamily: "Poppins, sans-serif",
      },
    }] : [],
    textStyle: {
      fontFamily: "Poppins, sans-serif",
    },
  };

  return (
    <React.Fragment>
      <ReactEcharts
        className="patient-stats-chart patient-stats-doughnut-chart"
        style={{ height: "300px" }}
        option={option}
      />
    </React.Fragment>
  );
};


// Bar chart — clean grouped bars; values on top, details in tooltip
const BarLabelChart = ({ colors = PATIENT_STATS_CHART_COLORS, seriesData }) => {
    const emptySeriesData = {
        waiting: [],
        walkIn: [],
        notArrived: [],
        eConsult: [],
        remaining: [],
        completed: [],
        months: [],
    };

    const resolved = {
        waiting: (seriesData && seriesData.waiting) || emptySeriesData.waiting,
        walkIn: (seriesData && (seriesData.walkIn || seriesData.walkin)) || emptySeriesData.walkIn,
        notArrived: (seriesData && (seriesData.notArrived || seriesData.notarrived)) || emptySeriesData.notArrived,
        eConsult: (seriesData && (seriesData.eConsult || seriesData.econsult)) || emptySeriesData.eConsult,
        remaining: (seriesData && seriesData.remaining) || emptySeriesData.remaining,
        completed: (seriesData && seriesData.completed) || emptySeriesData.completed,
        months: (seriesData && seriesData.months) || emptySeriesData.months,
    };

    const seriesEntries = [
        ["WAITING", resolved.waiting],
        ["WALK-IN", resolved.walkIn],
        ["NOT ARRIVED", resolved.notArrived],
        ["E-CONSULT", resolved.eConsult],
        ["REMAINING", resolved.remaining],
        ["COMPLETED", resolved.completed],
    ];

    const option = {
        grid: {
            left: "2%",
            right: "10%",
            bottom: "4%",
            top: "18%",
            containLabel: true,
        },
        tooltip: {
            trigger: "axis",
            axisPointer: {
                type: "shadow",
            },
            confine: true,
        },
        legend: {
            ...barLegend,
            data: PATIENT_STATS_STATUS_LABELS,
        },
        color: colors,
        toolbox: {
            show: true,
            orient: "vertical",
            right: 6,
            top: "middle",
            itemSize: 14,
            itemGap: 10,
            showTitle: true,
            iconStyle: {
                borderColor: "#878a99",
                borderWidth: 1,
            },
            emphasis: {
                iconStyle: {
                    borderColor: "#25a0e2",
                },
            },
            tooltip: {
                show: true,
                backgroundColor: "rgba(15, 34, 58, 0.9)",
                borderWidth: 0,
                textStyle: {
                    color: "#fff",
                    fontSize: 11,
                },
            },
            feature: {
                dataView: {
                    show: true,
                    readOnly: false,
                    title: "Data",
                    lang: ["Data View", "Close", "Refresh"],
                    backgroundColor: "#fff",
                    textareaColor: "#fff",
                    textareaBorderColor: "#e9ebec",
                    textColor: "#495057",
                    buttonColor: "#25a0e2",
                    buttonTextColor: "#fff",
                },
                magicType: {
                    show: true,
                    type: ["line", "bar", "stack"],
                    title: {
                        line: "Line",
                        bar: "Bar",
                        stack: "Stack",
                    },
                },
                restore: {
                    show: true,
                    title: "Restore",
                },
                saveAsImage: {
                    show: true,
                    title: "Save",
                    type: "png",
                    pixelRatio: 2,
                    backgroundColor: "#fff",
                },
            },
        },
        xAxis: [{
            type: "category",
            axisTick: { show: false },
            axisLabel: {
                color: "#858d98",
                fontSize: 11,
                margin: 10,
            },
            data: resolved.months,
            axisLine: {
                lineStyle: { color: "#e9ebec" },
            },
        }],
        yAxis: {
            type: "value",
            minInterval: 1,
            axisLabel: {
                color: "#858d98",
                fontSize: 11,
            },
            axisLine: { show: false },
            splitLine: {
                lineStyle: {
                    color: "rgba(133, 141, 152, 0.12)",
                },
            },
        },
        textStyle: {
            fontFamily: "Poppins, sans-serif",
        },
        series: seriesEntries.map(([name, data], index) =>
            buildPatientBarSeries(name, data, index === 0)
        ),
    };

    return (
        <React.Fragment>
            <ReactEcharts
                className="patient-stats-chart patient-stats-bar-chart"
                style={{ height: "320px" }}
                option={option}
            />
        </React.Fragment>
    );
};

export { RevenueCharts, StoreVisitsCharts, BarLabelChart };
