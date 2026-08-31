import { setDrugSystemLoading, setDrugSystemList, setDrugSystemError, setDrugSystemSuccess } from './reducer';
import { getDrugSystemList as getDrugSystemListApi, deleteDrugSystem as deleteDrugSystemApi, createDrugSystem as createDrugSystemApi } from '../../../helpers/realbackend_helper';

/* Get DrugSystem List Api Call */
export const getDrugSystemList = (data) => async (dispatch) => {
    console.log("data",data)
    try {
        dispatch(setDrugSystemLoading(true));
        const response = await getDrugSystemListApi(data);
        dispatch(setDrugSystemLoading(false));
        dispatch(setDrugSystemList(response));
    } catch (error) {
        dispatch(setDrugSystemError(error.message));
        dispatch(setDrugSystemLoading(false));
    }
}

/* Create DrugSystem Api Call */
export const createDrugSystem = (data) => async (dispatch) => {
    try {
        dispatch(setDrugSystemLoading(true));
        const response = await createDrugSystemApi(data);
        dispatch(setDrugSystemLoading(false));
        dispatch(setDrugSystemSuccess(response));
        // Refresh the list after successful creation
        dispatch(getDrugSystemList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setDrugSystemError(error.message));
        dispatch(setDrugSystemLoading(false));
    }
}

/* Update DrugSystem Api Call */
export const updateDrugSystem = (data) => async (dispatch) => {
    try {
        dispatch(setDrugSystemLoading(true));
        const response = await createDrugSystemApi(data);
        dispatch(setDrugSystemLoading(false));
        dispatch(setDrugSystemSuccess(response));
        dispatch(getDrugSystemList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setDrugSystemError(error.message));
        dispatch(setDrugSystemLoading(false));
    }
}

/* Delete DrugSystem Api Call */
export const deleteDrugSystem = (data) => async (dispatch) => {
    try {
        dispatch(setDrugSystemLoading(true));
        const response = await deleteDrugSystemApi(data);
        dispatch(setDrugSystemLoading(false));
        dispatch(setDrugSystemSuccess(response));
        dispatch(getDrugSystemList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setDrugSystemError(error.message));
        dispatch(setDrugSystemLoading(false));
    }
} 