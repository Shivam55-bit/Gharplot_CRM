import React from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useAdmin } from "../../context/AdminContext";
import "./PropertyCharts.css";
import "bootstrap/dist/css/bootstrap.min.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const PropertyCharts = () => {
  const { subCategoryCounts, loading, error } = useAdmin();

  // Show loading state
  if (loading) {
    return (
      <div className="container m-0">
        <div className="row g-4 justify-content-center align-items-center">
          <div className="col-12 text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading chart data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container m-0">
        <div className="row g-4 justify-content-center align-items-center">
          <div className="col-12 text-center">
            <div className="alert alert-danger">
              <h5>Error Loading Charts</h5>
              <p>Failed to load chart data: {error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get data from API (note: API uses "Residential" and "Commercial" with capital letters)
  const residentialData = subCategoryCounts.Residential || [];
  const commercialData = subCategoryCounts.Commercial || [];

  console.log("Residential data from API:", residentialData);
  console.log("Commercial data from API:", commercialData);

  // Transform data to match chart structure (name -> type, capitalize first letter)
  const getTransformedResidentialData = () => {
    return residentialData.map(item => ({
      type: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      count: item.count
    }));
  };

  const getTransformedCommercialData = () => {
    return commercialData.map(item => ({
      type: item.name.charAt(0).toUpperCase() + item.name.slice(1),
      count: item.count
    }));
  };

  const transformedResidentialData = getTransformedResidentialData();
  const transformedCommercialData = getTransformedCommercialData();

  // Check if data is empty
  if (transformedResidentialData.length === 0 && transformedCommercialData.length === 0) {
    return (
      <div className="container m-0">
        <div className="row g-4 justify-content-center align-items-center">
          <div className="col-12 text-center">
            <div className="alert alert-info">
              <h5>No Property Data Available</h5>
              <p>Chart data will appear here once properties are added to the system.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- RESIDENTIAL (Bar Chart) ----------------
  const getResidentialChartData = () => {
    return {
      labels: transformedResidentialData.map((item) => item.type),
      datasets: [
        {
          label: "Residential Properties",
          data: transformedResidentialData.map((item) => item.count),
          backgroundColor: "rgba(68, 161, 224, 0.9)",
          borderRadius: 6,
          barThickness: 30,
          hoverBackgroundColor: "rgba(15, 76, 117, 0.9)",
        },
      ],
    };
  };

  const residentialChartData = getResidentialChartData();

  const residentialOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#ccc",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#555", stepSize: 2 },
        grid: { color: "rgba(0,0,0,0.05)" },
      },
      x: {
        ticks: { color: "#555" },
        grid: { display: false },
      },
    },
  };

  // ---------------- COMMERCIAL (Ring / Doughnut Chart) ----------------
  const getCommercialChartData = () => {
    return {
      labels: transformedCommercialData.map((item) => item.type),
      datasets: [
        {
          label: "Commercial Properties",
          data: transformedCommercialData.map((item) => item.count),
          backgroundColor: [
            "#F97316",
            "#EF4444",
            "#0EA5E9",
            "#22C55E",
            "#EAB308",
          ],
          borderWidth: 4,
          borderColor: "#fff",
          hoverOffset: 12,
        },
      ],
    };
  };

  const commercialChartData = getCommercialChartData();

  const commercialOptions = {
    cutout: "70%", // Creates the ring effect
    plugins: {
      legend: {
        position: "right",
        labels: { color: "#000", font: { size: 13, weight: "bold" } },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#000",
        bodyColor: "#000",
        borderColor: "#ccc",
        borderWidth: 1,
        callbacks: {
          label: (tooltipItem) =>
            `${tooltipItem.label}: ${tooltipItem.raw} units`,
        },
      },
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200,
    },
    maintainAspectRatio: false,
  };

  return (
    <div className="container property-charts-container">
      <div className="row g-4 justify-content-center align-items-stretch">
        {/* ----------- RESIDENTIAL BAR CHART ----------- */}
        {transformedResidentialData.length > 0 && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-3 h-100 position-relative">
              <div className="chart-heading residential-heading">
                Residential Properties
              </div>
              <div className="card-body pt-4 c-chart" style={{ height: "350px" }}>
                <Bar data={residentialChartData} options={residentialOptions} />
              </div>
            </div>
          </div>
        )}

        {/* ----------- COMMERCIAL RING CHART ----------- */}
        {transformedCommercialData.length > 0 && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-3 h-100 position-relative">
              <div className="chart-heading commercial-heading">
                Commercial Properties
              </div>
              <div className="card-body pt-4 d-flex align-items-center justify-content-center c-chart" style={{ height: "350px" }}>
                <Doughnut
                  data={commercialChartData}
                  options={commercialOptions}
                />
              </div>
            </div>
          </div>
        )}

        {/* Show message if specific category is empty */}
        {transformedResidentialData.length === 0 && transformedCommercialData.length > 0 && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-3 h-100 position-relative">
              <div className="card-body d-flex align-items-center justify-content-center" style={{ height: "350px" }}>
                <div className="text-center text-muted">
                  <h5>No Residential Properties</h5>
                  <p>Residential property data will appear here once added.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {transformedCommercialData.length === 0 && transformedResidentialData.length > 0 && (
          <div className="col-md-6">
            <div className="card shadow-sm border-0 rounded-3 h-100 position-relative">
              <div className="card-body d-flex align-items-center justify-content-center" style={{ height: "350px" }}>
                <div className="text-center text-muted">
                  <h5>No Commercial Properties</h5>
                  <p>Commercial property data will appear here once added.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyCharts;