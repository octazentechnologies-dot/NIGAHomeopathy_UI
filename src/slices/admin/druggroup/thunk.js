import { setDrugGroupLoading, setDrugGroupList, setDrugGroupError, setDrugGroupSuccess, setSelectedDrugGroup } from './reducer';
import { getDrugGroupList as getDrugGroupListApi, addDrugGroup as addDrugGroupApi, deleteDrugGroup as deleteDrugGroupApi, updateDrugGroup as updateDrugGroupApi, getDrugGroupById as getDrugGroupByIdApi } from '../../../helpers/realbackend_helper';

/* Get DrugGroup List Api Call */
export const getDrugGroupList = (data) => async (dispatch) => {
    try {
        dispatch(setDrugGroupLoading(true));
        const response = await getDrugGroupListApi(data);
        dispatch(setDrugGroupLoading(false));
        dispatch(setDrugGroupList(response));
    } catch (error) {
        dispatch(setDrugGroupError(error.message));
        dispatch(setDrugGroupLoading(false));
    }
}

/* Add DrugGroup Api Call */
export const addDrugGroup = (data) => async (dispatch) => {
    try {
        dispatch(setDrugGroupLoading(true));
        const response = await addDrugGroupApi(data);
        dispatch(setDrugGroupLoading(false));
        dispatch(setDrugGroupSuccess(response));
        return response;
    } catch (error) {
        dispatch(setDrugGroupError(error.message));
        dispatch(setDrugGroupLoading(false));
        throw error;
    }
}

/* Delete DrugGroup Api Call */
export const deleteDrugGroup = (data) => async (dispatch) => {
    try {
        dispatch(setDrugGroupLoading(true));
        const response = await deleteDrugGroupApi(data);
        dispatch(setDrugGroupLoading(false));
        dispatch(setDrugGroupSuccess(response));
        dispatch(getDrugGroupList({ PageNumber: 1, PageSize: 10 }));
        return response;
    } catch (error) {
        dispatch(setDrugGroupError(error.message));
        dispatch(setDrugGroupLoading(false));
        throw error;
    }
}

/* Update DrugGroup Api Call */
export const updateDrugGroup = (data) => async (dispatch) => {
    try {
        dispatch(setDrugGroupLoading(true));
        const response = await updateDrugGroupApi(data);
        dispatch(setDrugGroupLoading(false));
        dispatch(setDrugGroupSuccess(response));
        dispatch(getDrugGroupList({ PageNumber: 1, PageSize: 10 }));
        return response;
    } catch (error) {
        dispatch(setDrugGroupError(error.message));
        dispatch(setDrugGroupLoading(false));
        throw error;
    }
}

/* Get DrugGroup by ID Api Call */
export const getDrugGroupById = (id) => async (dispatch) => {
    try {
        dispatch(setDrugGroupLoading(true));
        const response = await getDrugGroupByIdApi(id);
        dispatch(setDrugGroupLoading(false));
        dispatch(setSelectedDrugGroup(response));
        return response;
    } catch (error) {
        dispatch(setDrugGroupError(error.message));
        dispatch(setDrugGroupLoading(false));
        throw error;
    }
} 