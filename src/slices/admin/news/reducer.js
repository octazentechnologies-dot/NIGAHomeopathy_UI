import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    newsLoading: false,
    newsList: [],
    newsError: null,
    newsSuccess: null,
    totalCount: 0,
    totalPageCount: 0,
    newsCategoriesLoading: false,
    newsCategoriesList: [],
    newsCategoriesError: null,
    newsCategoriesSuccess: null,
    newsDetailsLoading: false,
    newsDetailsList: [],
    newsDetailsError: null,
    newsDetailsSuccess: null
};

const NewsSlice = createSlice({
    name: "News",
    initialState,
    reducers: {
        setNewsLoading: (state, action) => {
            state.newsLoading = action.payload;
        },
        setNewsList: (state, action) => {
            state.newsList = action.payload;
        },
        setNewsError: (state, action) => {
            state.newsError = action.payload;
        },
        setNewsSuccess: (state, action) => {
            state.newsSuccess = action.payload;
        },
        setNewsTotals: (state, action) => {
            state.totalCount = action.payload?.totalCount || 0;
            state.totalPageCount = action.payload?.totalPageCount || 0;
        },
        setNewsCategoriesLoading: (state, action) => {
            state.newsCategoriesLoading = action.payload;
        },
        setNewsCategoriesList: (state, action) => {
            state.newsCategoriesList = action.payload;
        },
        setNewsCategoriesError: (state, action) => {
            state.newsCategoriesError = action.payload;
        },
        setNewsCategoriesSuccess: (state, action) => {
            state.newsCategoriesSuccess = action.payload;
        },
        setNewsDetailsLoading: (state, action) => {
            state.newsDetailsLoading = action.payload;
        },
        setNewsDetailsList: (state, action) => {
            state.newsDetailsList = action.payload;
        },
        setNewsDetailsError: (state, action) => {
            state.newsDetailsError = action.payload;
        },
        setNewsDetailsSuccess: (state, action) => {
            state.newsDetailsSuccess = action.payload;
        }
    }
});

export const {
    setNewsLoading,
    setNewsList,
    setNewsError,
    setNewsSuccess,
    setNewsTotals,
    setNewsCategoriesLoading,
    setNewsCategoriesList,
    setNewsCategoriesError,
    setNewsCategoriesSuccess,
    setNewsDetailsLoading,
    setNewsDetailsList,
    setNewsDetailsError,
    setNewsDetailsSuccess,
} = NewsSlice.actions;

export default NewsSlice.reducer;