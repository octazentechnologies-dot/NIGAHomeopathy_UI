import { setLabTestLoading, setLabTestList, setLabTestError, setLabTestSuccess, setLabTestDetailsLoading, setLabTestDetailsSuccess, setLabTestDetailsError, setSelectedLabTest, setSelectedLabTestLoading, setSelectedLabTestError } from './reducer';
import { getLabTestList as getLabTestListApi, addEditPatientLabTest as addEditPatientLabTestApi, getPatientLabTestById as getPatientLabTestByIdApi } from '../../../helpers/realbackend_helper';

/* Get Lab Test List Api Call */
export const getLabTestList = (data) => async (dispatch) => {
    try {
        dispatch(setLabTestLoading(true));
        const response = await getLabTestListApi(data);
        dispatch(setLabTestLoading(false));
        dispatch(setLabTestList(response));
    } catch (error) {
        dispatch(setLabTestError(error.message));
        dispatch(setLabTestLoading(false));
    }
};

/* Add/Edit Patient Lab Test Api Call */
export const addEditPatientLabTest = (data) => async (dispatch) => {
    try {
        dispatch(setLabTestDetailsLoading(true));
        const response = await addEditPatientLabTestApi(data);
        // Handle different response formats: string, object with message, or object with resultObject
        let successMessage = "Lab test saved successfully";
        if (typeof response === 'string') {
            successMessage = response;
        } else if (response?.resultObject) {
            successMessage = response.resultObject;
        } else if (response?.message) {
            successMessage = response.message;
        }
        dispatch(setLabTestDetailsSuccess(successMessage));
        dispatch(setLabTestDetailsLoading(false));
    } catch (error) {
        dispatch(setLabTestDetailsError(error.message));
        dispatch(setLabTestDetailsLoading(false));
    }
};

/* Get Patient Lab Test By ID Api Call */
export const getPatientLabTestById = (labTestId) => async (dispatch) => {
    try {
        dispatch(setSelectedLabTestLoading(true));
        const response = await getPatientLabTestByIdApi(labTestId);
        // Handle both direct object response and wrapped response
        const labTestData = response?.resultObject || response || null;
        dispatch(setSelectedLabTest(labTestData));
        dispatch(setSelectedLabTestLoading(false));
    } catch (error) {
        dispatch(setSelectedLabTestError(error.message));
        dispatch(setSelectedLabTestLoading(false));
    }
}; 