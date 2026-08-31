import {
    getAllBlogDetail as getAllBlogDetailApi,
    saveBlogDetail as saveBlogDetailApi,
    getBlogDetailById as getBlogDetailByIdApi,
    deleteBlogDetail as deleteBlogDetailApi
} from "../../../helpers/realbackend_helper";

import {
    setBlogLoading,
    setBlogList,
    setBlogError,
    setBlogTotals,
    setBlogDetailsLoading,
    setBlogDetailsSuccess,
    setBlogDetailsError,
    setSelectedBlog,
    setSelectedBlogLoading,
    setSelectedBlogError
} from "./reducer";

/* Get Blog List Api Call */
export const getAllBlogDetail = (data) => async (dispatch) => {
    try {
        dispatch(setBlogLoading(true));
        const response = await getAllBlogDetailApi(data);
        dispatch(setBlogList(response?.resultObject || []));
        dispatch(
            setBlogTotals({
                totalCount: response?.totalCount || 0,
                totalPageCount: response?.totalPageCount || 0
            })
        );
        dispatch(setBlogLoading(false));
    } catch (error) {
        dispatch(setBlogError(error.message));
        dispatch(setBlogLoading(false));
    }
};

/* Save Blog Detail Api Call */
export const saveBlogDetail = (data) => async (dispatch) => {
    try {
        dispatch(setBlogDetailsLoading(true));
        const response = await saveBlogDetailApi(data);
        // Handle different response formats: string, object with message, or object with resultObject
        let successMessage = "Blog saved successfully";
        if (typeof response === 'string') {
            successMessage = response;
        } else if (response?.resultObject) {
            successMessage = response.resultObject;
        } else if (response?.message) {
            successMessage = response.message;
        }
        dispatch(setBlogDetailsSuccess(successMessage));
        dispatch(setBlogDetailsLoading(false));
    } catch (error) {
        dispatch(setBlogDetailsError(error.message));
        dispatch(setBlogDetailsLoading(false));
    }
};

/* Get Blog Detail By ID Api Call */
export const getBlogDetailById = (blogId) => async (dispatch) => {
    try {
        dispatch(setSelectedBlogLoading(true));
        const response = await getBlogDetailByIdApi(blogId);
        // Handle both direct object response and wrapped response
        const blogData = response?.resultObject || response || null;
        dispatch(setSelectedBlog(blogData));
        dispatch(setSelectedBlogLoading(false));
    } catch (error) {
        dispatch(setSelectedBlogError(error.message));
        dispatch(setSelectedBlogLoading(false));
    }
};

/* Delete Blog Detail Api Call */
export const deleteBlogDetail = (data) => async (dispatch) => {
    try {
        dispatch(setBlogDetailsLoading(true));
        const response = await deleteBlogDetailApi(data);
        // Handle different response formats: string, object with message, or object with resultObject
        let successMessage = "Blog deleted successfully";
        if (typeof response === 'string') {
            successMessage = response;
        } else if (response?.resultObject) {
            successMessage = response.resultObject;
        } else if (response?.message) {
            successMessage = response.message;
        }
        dispatch(setBlogDetailsSuccess(successMessage));
        dispatch(setBlogDetailsLoading(false));
    } catch (error) {
        dispatch(setBlogDetailsError(error.message));
        dispatch(setBlogDetailsLoading(false));
    }
};

