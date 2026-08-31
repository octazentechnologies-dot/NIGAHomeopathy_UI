import {
    getAllNews as getAllNewsApi,
    getAllNewsCategories as getAllNewsCategoriesApi,
    saveNewsDetails as saveNewsDetailsApi,
    updateNewsDetails as updateNewsDetailsApi,
    getNewsDetailsById as getNewsDetailsByIdApi,
    deleteNewsDetails as deleteNewsDetailsApi
} from "../../../helpers/realbackend_helper";

import {
    setNewsLoading,
    setNewsList,
    setNewsError,
    setNewsTotals,
    setNewsCategoriesLoading,
    setNewsCategoriesList,
    setNewsCategoriesError,
    setNewsCategoriesSuccess,
    setNewsDetailsLoading,
    setNewsDetailsList,
    setNewsDetailsError,
    setNewsDetailsSuccess
} from "./reducer";

/* Get News List Api Call */
export const getAllNews = (data) => async (dispatch) => {
    try {
        dispatch(setNewsLoading(true));
        const response = await getAllNewsApi(data);
        dispatch(setNewsList(response?.resultObject || []));
        dispatch(
            setNewsTotals({
                totalCount: response?.totalCount || 0,
                totalPageCount: response?.totalPageCount || 0
            })
        );
        dispatch(setNewsLoading(false));
    } catch (error) {
        dispatch(setNewsError(error.message));
        dispatch(setNewsLoading(false));
    }
};

/* Get News Categories List Api Call */
export const getAllNewsCategories = (data) => async (dispatch) => {
    try {
        dispatch(setNewsCategoriesLoading(true));
        const response = await getAllNewsCategoriesApi(data);
        dispatch(setNewsCategoriesList(response || []));
        dispatch(setNewsCategoriesLoading(false));
    } catch (error) {
        dispatch(setNewsCategoriesError(error.message));
        dispatch(setNewsCategoriesLoading(false));
    }
};

/* Save News Details Api Call */
export const saveNewsDetails = (data) => async (dispatch) => {
    try {
        dispatch(setNewsDetailsLoading(true));
        const response = await saveNewsDetailsApi(data);
        dispatch(setNewsDetailsSuccess(response?.resultObject || response?.message || "News saved successfully"));
        dispatch(setNewsDetailsLoading(false));
    } catch (error) {
        dispatch(setNewsDetailsError(error.message));
        dispatch(setNewsDetailsLoading(false));
    }
};

/* Update News Details Api Call */
export const updateNewsDetails = (data) => async (dispatch) => {
    try {
        dispatch(setNewsDetailsLoading(true));
        const response = await updateNewsDetailsApi(data);
        dispatch(setNewsDetailsSuccess(response?.resultObject || response?.message || "News updated successfully"));
        dispatch(setNewsDetailsLoading(false));
    } catch (error) {
        dispatch(setNewsDetailsError(error.message));
        dispatch(setNewsDetailsLoading(false));
    }
};

/* Get News Details By ID Api Call */
export const getNewsDetailsById = (data) => async (dispatch) => {
    try {
        dispatch(setNewsDetailsLoading(true));
        const response = await getNewsDetailsByIdApi(data);
        // Handle both direct object response and wrapped response
        const newsData = response?.resultObject || response || null;
        dispatch(setNewsDetailsList(newsData));
        dispatch(setNewsDetailsLoading(false));
    } catch (error) {
        dispatch(setNewsDetailsError(error.message));
        dispatch(setNewsDetailsLoading(false));
    }
};

/* Delete News Details Api Call */
export const deleteNewsDetails = (data) => async (dispatch) => {
    try {
        dispatch(setNewsDetailsLoading(true));
        const response = await deleteNewsDetailsApi(data);
        dispatch(setNewsDetailsSuccess(response?.resultObject || response?.message || "News deleted successfully"));
        dispatch(setNewsDetailsLoading(false));
    } catch (error) {
        dispatch(setNewsDetailsError(error.message));
        dispatch(setNewsDetailsLoading(false));
    }
};