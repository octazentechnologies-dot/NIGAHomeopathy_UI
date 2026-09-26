import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  allRevenueData,
  monthRevenueData,
  halfYearRevenueData,
  yearRevenueData,
} from "../../common/data/dashboardEcommerce";

const localRevenue = {
  all: allRevenueData,
  month: monthRevenueData,
  halfyear: halfYearRevenueData,
  year: yearRevenueData,
};

/** Velzon sample chart only — do not call /allRevenue-data on New-API (404 emails). */
export const getRevenueChartsData = createAsyncThunk("dashboardEcommerce/getRevenueChartsData", async (data) => {
  return localRevenue[data] || allRevenueData;
});
