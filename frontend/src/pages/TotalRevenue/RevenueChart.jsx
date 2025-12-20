import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./RevenueChart.css";
import { useAdmin } from "../../context/AdminContext";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function RevenueChart() {
  const { revenueData, growthData, loading, error } = useAdmin();

  const formatCurrency = (amount) => `₹${(amount / 100000).toFixed(1)}L`;

  const hasSalesData = revenueData?.dailyRevenue?.length > 0;
  const hasGrowthData = growthData?.monthlyRevenue?.length > 0;

  // ✅ Fixed Sales Data Function (uses actual API data)
  const getSalesData = () => {
    if (!hasSalesData) return { labels: [], datasets: [] };

    const sortedData = [...revenueData.dailyRevenue].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    const labels = sortedData.map(item =>
      new Date(item.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );

    const totalRevenueData = sortedData.map(item => Number(item.totalRevenue) / 100000);
    const residentialData = sortedData.map(item => Number(item.residentialRevenue) / 100000);
    const commercialData = sortedData.map(item => Number(item.commercialRevenue) / 100000);

    return {
      labels,
      datasets: [
        {
          label: "Total Revenue",
          data: totalRevenueData,
          borderColor: "#3b82f6",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: "#3b82f6",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Residential",
          data: residentialData,
          borderColor: "#10b981",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: "#10b981",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: "Commercial",
          data: commercialData,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.1)",
          borderWidth: 3,
          fill: false,
          tension: 0.4,
          pointBackgroundColor: "#f59e0b",
          pointBorderColor: "#ffffff",
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
      ],
    };
  };

  const getGrowthChartData = () => {
    return {
      labels: ["Total Revenue", "Residential", "Commercial"],
      datasets: [
        {
          label: "Revenue (in Crores)",
          data: hasGrowthData
            ? [
                Number(growthData.totalRevenue || 0) / 10000000,
                Number(growthData.residentialRevenue || 0) / 10000000,
                Number(growthData.commercialRevenue || 0) / 10000000,
              ]
            : [0, 0, 0],
          backgroundColor: ["#667eea", "#10b981", "#f59e0b"],
          borderRadius: 12,
          barThickness: 40,
        },
      ],
    };
  };

  const getIndicators = () => {
    return [
      {
        title: "Total Sales",
        value: formatCurrency(revenueData?.totalRevenue || 0),
        change: "3.05% ↑",
        positive: true,
        icon: "coins",
      },
      {
        title: "Residential Sales",
        value: formatCurrency(revenueData?.residentialRevenue || 0),
        change: "2.8% ↑",
        positive: true,
        icon: "profit",
      },
      {
        title: "Commercial Sales",
        value: formatCurrency(revenueData?.commercialRevenue || 0),
        change: "3.3% ↑",
        positive: true,
        icon: "cost",
      },
    ];
  };

  const salesOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: "top" },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ₹${context.parsed.y}L`,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          autoSkip: false,
          maxTicksLimit: undefined,
          maxRotation: 0,
          minRotation: 0,
          callback: function(value, index, values) {
            // Show all labels without skipping
            return this.getLabelForValue(value);
          }
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}L`,
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
        borderCapStyle: "round",
        borderJoinStyle: "round",
      },
      point: {
        radius: 4,
        hitRadius: 10,
        hoverRadius: 6,
      },
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
  };

  const growthOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.y;
            return `₹${value.toFixed(2)} Cr`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `₹${value}Cr`,
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="dashboard-overview container py-4 mt-4 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading revenue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-overview container py-4 mt-4">
        <div className="alert alert-danger">
          <h4 className="alert-heading">Error Loading Revenue Data</h4>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const salesData = getSalesData();
  const growthChartData = getGrowthChartData();
  const indicators = getIndicators();

  const revenueAmounts = (
    <div className="mt-3 d-flex justify-content-around text-center">
      <div>
        <div className="fw-bold" style={{ color: "#667eea", fontSize: "1.1rem" }}>
          ₹{(growthData?.totalRevenue / 10000000 || 0).toFixed(2)}Cr
        </div>
        <small className="text-muted">Total Revenue</small>
      </div>
      <div>
        <div className="fw-bold" style={{ color: "#10b981", fontSize: "1.1rem" }}>
          ₹{(growthData?.residentialRevenue / 10000000 || 0).toFixed(2)}Cr
        </div>
        <small className="text-muted">Residential</small>
      </div>
      <div>
        <div className="fw-bold" style={{ color: "#f59e0b", fontSize: "1.1rem" }}>
          ₹{(growthData?.commercialRevenue / 10000000 || 0).toFixed(2)}Cr
        </div>
        <small className="text-muted">Commercial</small>
      </div>
    </div>
  );

  return (
    <div className="dashboard-overview container py-4 mt-0">
      <div className="row gx-4 gy-4 align-items-stretch">
        <div className="col-12 col-xl-7">
          <div className="chart-container-wrapper p-0" style={{ boxShadow: '0 4px 12px rgba(16, 24, 40, 0.18)', borderRadius: '12px', border: '1px solid rgba(17, 24, 39, 0.08)' }}>
            <div className="p-4 d-flex flex-column">
              <h5 className="card-title mb-3">Sales Statistics</h5>
              <div className="flex-fill mb-3 chart-area" style={{ height: "300px" }}>
                <Line data={salesData} options={salesOptions} />
              </div>
              <div className="indicators d-flex justify-content-between mt-2 flex-wrap">
                {indicators.map((ind, idx) => (
                  <div key={idx} className="d-flex align-items-center gap-3 mb-2">
                    <div className="icon-box"></div>
                    <div>
                      <small className="text-muted">{ind.title}</small>
                      <div className="d-flex align-items-baseline gap-2">
                        <div className="fw-bold fs-6">{ind.value}</div>
                        <div className={ind.positive ? "text-success small" : "text-danger small"}>
                          {ind.change}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-5">
          <div className="chart-container-wrapper p-0" style={{ boxShadow: '0 4px 12px rgba(16, 24, 40, 0.18)', borderRadius: '12px', border: '1px solid rgba(17, 24, 39, 0.08)' }}>
            <div className="p-4 d-flex flex-column">
              <h5 className="card-title mb-3">Growth Statistics</h5>
              <div className="flex-fill chart-area" style={{ height: "300px" }}>
                <Bar data={growthChartData} options={growthOptions} />
              </div>
              {revenueAmounts}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RevenueChart;
