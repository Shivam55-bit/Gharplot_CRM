import React from "react";
import { Outlet } from "react-router-dom"; //  Nested route content
import Sidebar from "../Sidebar/Sidebar";
import Header from "../Header/Header";
import "./DashboardLayout.css";

function DashboardLayout() {
  return (
    <div className="dashboard-container">
      <Sidebar />
      <div className="main-content">
        <Header />

        {/* Page content */}
        <main className="">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
