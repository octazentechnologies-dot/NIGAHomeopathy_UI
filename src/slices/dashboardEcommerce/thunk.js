import { createAsyncThunk } from "@reduxjs/toolkit";
//Include Both Helper File with needed methods
import {
  getAllRevenueData as getAllRevenueDataApi,
  getMonthRevenueData as getMonthRevenueDataApi,
  getHalfYearRevenueData as getHalfYearRevenueDataApi,
  getYearRevenueData as getYearRevenueDataApi
} from "../../helpers/fakebackend_helper";

export const getRevenueChartsData = createAsyncThunk("dashboardEcommerce/getRevenueChartsData", async (data) => {
  try {
    var response;
    if (data === "all") {
      response = getAllRevenueDataApi(data);
    }
    if (data === "month") {
      response = getMonthRevenueDataApi(data);
    }
    if (data === "halfyear") {
      response = getHalfYearRevenueDataApi(data);
    }
    if (data === "year") {
      response = getYearRevenueDataApi(data);
    }
    return response;
  } catch (error) {
    // Return mock data if API endpoint doesn't exist
    console.warn("Revenue API endpoint not available, using mock data:", error);
    return {
      result: [
        { name: "Orders", data: [28, 40, 36, 52, 38, 60, 55] },
        { name: "Earnings", data: [35, 41, 67, 22, 43, 21, 41] }
      ]
    };
  }
});