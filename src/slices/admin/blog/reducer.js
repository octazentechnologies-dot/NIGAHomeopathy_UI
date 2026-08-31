import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    blogLoading: false,
    blogList: [],
    blogError: null,
    blogSuccess: null,
    totalCount: 0,
    totalPageCount: 0,
    blogDetailsLoading: false,
    blogDetailsSuccess: null,
    blogDetailsError: null,
    selectedBlog: null,
    selectedBlogLoading: false,
    selectedBlogError: null
};

const BlogSlice = createSlice({
    name: "Blog",
    initialState,
    reducers: {
        setBlogLoading: (state, action) => {
            state.blogLoading = action.payload;
        },
        setBlogList: (state, action) => {
            state.blogList = action.payload;
        },
        setBlogError: (state, action) => {
            state.blogError = action.payload;
        },
        setBlogSuccess: (state, action) => {
            state.blogSuccess = action.payload;
        },
        setBlogTotals: (state, action) => {
            state.totalCount = action.payload?.totalCount || 0;
            state.totalPageCount = action.payload?.totalPageCount || 0;
        },
        setBlogDetailsLoading: (state, action) => {
            state.blogDetailsLoading = action.payload;
        },
        setBlogDetailsSuccess: (state, action) => {
            state.blogDetailsSuccess = action.payload;
        },
        setBlogDetailsError: (state, action) => {
            state.blogDetailsError = action.payload;
        },
        setSelectedBlog: (state, action) => {
            state.selectedBlog = action.payload;
        },
        setSelectedBlogLoading: (state, action) => {
            state.selectedBlogLoading = action.payload;
        },
        setSelectedBlogError: (state, action) => {
            state.selectedBlogError = action.payload;
        }
    }
});

export const {
    setBlogLoading,
    setBlogList,
    setBlogError,
    setBlogSuccess,
    setBlogTotals,
    setBlogDetailsLoading,
    setBlogDetailsSuccess,
    setBlogDetailsError,
    setSelectedBlog,
    setSelectedBlogLoading,
    setSelectedBlogError
} = BlogSlice.actions;

export default BlogSlice.reducer;

