import axios from "axios";
import config from "../../../../config";
import { listPublicArticles, getPublicArticle } from "../../../../helpers/publicBookingApi";

const API_BASE = config.api.API_URL;

export const unwrapList = (response) => {
    const payload = response?.data;
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload?.resultObject)) {
        return payload.resultObject;
    }
    if (Array.isArray(payload?.data)) {
        return payload.data;
    }
    return [];
};

export const unwrapItem = (response) => {
    const payload = response?.data;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return null;
    }
    if (payload.resultObject && typeof payload.resultObject === "object" && !Array.isArray(payload.resultObject)) {
        return payload.resultObject;
    }
    return payload;
};

export const getPackages = () => axios.get(`${API_BASE}/package`).then((res) => unwrapList(res));

export const getAllBlogs = async () => {
    try {
        const publicList = await listPublicArticles({ pageNumber: 1, pageSize: 100 });
        if (Array.isArray(publicList) && publicList.length) {
            return publicList.map((item) => ({
                blogId: item.blogId ?? item.BlogId,
                blogHead: item.blogHead ?? item.BlogHead,
                blogSubHead: item.blogSubHead ?? item.BlogSubHead,
                blogDate: item.blogDate ?? item.BlogDate,
                blogImage1: item.blogImage1 ?? item.BlogImage1,
                blogDescription: item.blogSubHead ?? item.BlogSubHead,
            }));
        }
    } catch {
        // fall through to classic BlogDetail
    }

    try {
        const list = unwrapList(await axios.get(`${API_BASE}/BlogDetail/GetAllBlogDetail`));
        if (list.length) {
            return list;
        }
    } catch {
        // fall through to paginated endpoint
    }

    try {
        return unwrapList(
            await axios.get(`${API_BASE}/Pagination/GetAllBlogDetail`, {
                params: { PageNumber: 1, PageSize: 100 },
            })
        );
    } catch {
        return [];
    }
};

export const getBlogById = async (blogId) => {
    try {
        const item = await getPublicArticle(blogId);
        if (item) {
            return {
                blogId: item.blogId ?? item.BlogId,
                blogHead: item.blogHead ?? item.BlogHead,
                blogSubHead: item.blogSubHead ?? item.BlogSubHead,
                blogDate: item.blogDate ?? item.BlogDate,
                blogImage1: item.blogImage1 ?? item.BlogImage1,
                blogImage2: item.blogImage2 ?? item.BlogImage2,
                blogDetails1: item.body ?? item.Body ?? item.blogDetails ?? item.BlogDetails,
            };
        }
    } catch {
        // classic fallback
    }
    return axios.get(`${API_BASE}/BlogDetail/GetBlogDetailById/${blogId}`).then(unwrapItem);
};

export const getNewsCategories = () =>
    axios.get(`${API_BASE}/NewsCategory/GetAllNewsCategory`).then(unwrapList);

export const getNewsByCategory = (categoryId) =>
    axios.get(`${API_BASE}/NewsDetail/GetNewsDetailsbyCategoryId/${categoryId}`).then(unwrapList);

export const getNewsById = (newsId) =>
    axios.get(`${API_BASE}/NewsDetail/GetNewsDetailsbyId/${newsId}`).then(unwrapItem);

export const submitEnquiry = (payload) =>
    axios.post(`${API_BASE}/EnquiryDetail`, payload);
