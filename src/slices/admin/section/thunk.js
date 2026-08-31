/* Created on Date:12/02/25 By Pranav */

import { setSectionLoading, setSectionList, setSectionError, setSectionSuccess } from './reducer';

import {
    getSectionList as getSectionListApi,
    createOrUpdateSection as createOrUpdateSectionApi,
    deleteSection as deleteSectionApi
} from '../../../helpers/realbackend_helper';

/* Get Section List Api Call */
export const getSectionList = (data) => async (dispatch) => {
    try {
        const response = await getSectionListApi(data);
        dispatch(setSectionLoading(false));
        dispatch(setSectionList(response));
    } catch (sectionError) {
        dispatch(setSectionError(sectionError.message));
    }
}

/* Create Section Api Call */
export const createSection = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateSectionApi(data);
        dispatch(setSectionSuccess(response));
        dispatch(getSectionList
            ({
                PageNumber: 1,
                PageSize: 10
            }));
    } catch (sectionError) {
        dispatch(setSectionError(sectionError).message);
    }
}

/* Update Section Api Call*/
export const updateSection = (data) => async (dispatch) => {
    try {
        const response = await createOrUpdateSectionApi(data);
        dispatch(setSectionSuccess(response));
        dispatch(getSectionList
            ({
                PageNumber: 1,
                PageSize: 10
            }));
    } catch (sectionError) {
        dispatch(setSectionError(sectionError.message));
    }
}

/* Delete Section Api Call */
export const deleteSection = (data) => async (dispatch) => {
    try {
        const response = await deleteSectionApi(data);
        dispatch(setSectionSuccess(response));
        dispatch(getSectionList
            ({
                PageNumber: 1,
                PageSize: 10
            }));
    } catch (sectionError) {
        dispatch(setSectionError(sectionError.message));
    }
}