import { setAllopathicDrugLoading, setAllopathicDrugList, setAllopathicDrugError, setAllopathicDrugSuccess, setSelectedAllopathicDrug } from './reducer';
import {
    getAllopathicDrug as getAllopathicDrugApi,
    deleteAllopathicDrug as deleteAllopathicDrugApi,
    createAllopathicDrug as createAllopathicDrugApi,
    updateAllopathicDrug as updateAllopathicDrugApi,
    getAllopathicDrugById as getAllopathicDrugByIdApi
} from '../../../helpers/realbackend_helper';

/* Get AllopathicDrug List Api Call */
export const getAllopathicDrugList = (data) => async (dispatch) => {
    try {
        dispatch(setAllopathicDrugLoading(true));
        const response = await getAllopathicDrugApi(data);
        dispatch(setAllopathicDrugLoading(false));
        dispatch(setAllopathicDrugList(response));
    } catch (error) {
        dispatch(setAllopathicDrugError(error.message));
        dispatch(setAllopathicDrugLoading(false));
    }
}

/* Get AllopathicDrug By Id Api Call */
export const getAllopathicDrugById = (id) => async (dispatch) => {
    try {
        dispatch(setAllopathicDrugLoading(true));
        const response = await getAllopathicDrugByIdApi(id);
        dispatch(setAllopathicDrugLoading(false));
        dispatch(setSelectedAllopathicDrug(response));
    } catch (error) {
        dispatch(setAllopathicDrugError(error.message));
        dispatch(setAllopathicDrugLoading(false));
    }
}

/* Create AllopathicDrug Api Call */
export const createAllopathicDrug = (data) => async (dispatch) => {
    try {
        debugger;
        dispatch(setAllopathicDrugLoading(true));
        console.log("data", data);
        const response = await createAllopathicDrugApi(data);
        dispatch(setAllopathicDrugLoading(false));
        dispatch(setAllopathicDrugSuccess(response));
        dispatch(getAllopathicDrugList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setAllopathicDrugError(error.message));
        dispatch(setAllopathicDrugLoading(false));
    }
}

/* Update AllopathicDrug Api Call */
export const updateAllopathicDrug = (data) => async (dispatch) => {
    try {
        dispatch(setAllopathicDrugLoading(true));
        const response = await updateAllopathicDrugApi(data);
        dispatch(setAllopathicDrugLoading(false));
        dispatch(setAllopathicDrugSuccess(response));
        dispatch(getAllopathicDrugList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setAllopathicDrugError(error.message));
        dispatch(setAllopathicDrugLoading(false));
    }
}

/* Delete AllopathicDrug Api Call */
export const deleteAllopathicDrug = (data) => async (dispatch) => {
    try {
        dispatch(setAllopathicDrugLoading(true));
        const response = await deleteAllopathicDrugApi(data);
        dispatch(setAllopathicDrugLoading(false));
        dispatch(setAllopathicDrugSuccess(response));
        dispatch(getAllopathicDrugList({ PageNumber: 1, PageSize: 10 }));
    } catch (error) {
        dispatch(setAllopathicDrugError(error.message));
        dispatch(setAllopathicDrugLoading(false));
    }
} 