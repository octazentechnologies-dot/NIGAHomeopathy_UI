import {
    setDiagnosisTherapeuticsError,
    setDiagnosisTherapeuticsSuccess,
    setDiagnosisTherapeuticsList,
    setDiagnosisTherapeuticsLoading,
    setDiagnosisListForClinicalPattern
} from './reducer';

import {
    getDiagnosisTherapeuticsDetails as getDiagnosisTherapeuticsDetailsApi,
    getDiagnosisForClinicalPattern as getDiagnosisForClinicalPatternApi,
    getDiagnosisTherapeuticsDetailsById as getDiagnosisTherapeuticsDetailsById,
    diagnosisTherapeuticsDetails as diagnosisTherapeuticsDetailsApi,
    saveDiagnosisTherapeuticsDetail as saveDiagnosisTherapeuticsDetailApi
} from '../../../../helpers/realbackend_helper';

/* Get Diagnosis Therapeutics Details Api Call */
export const getDiagnosisTherapeuticsList = (data) => async (dispatch) => {
    dispatch(setDiagnosisTherapeuticsLoading(true));
    try {
        const response = await getDiagnosisTherapeuticsDetailsApi(data);
        dispatch(setDiagnosisTherapeuticsList(response));
    } catch (error) {
        dispatch(setDiagnosisTherapeuticsError(error.message));
    } finally {
        dispatch(setDiagnosisTherapeuticsLoading(false));
    }
};

/* Get Diagnosis For Clinical Pattern Api Call */
export const getDiagnosisForClinicalPatternList = (data) => async (dispatch) => {
    dispatch(setDiagnosisTherapeuticsLoading(true));
    try {
        const response = await getDiagnosisForClinicalPatternApi(data);
        dispatch(setDiagnosisListForClinicalPattern(response));
    } catch (error) {
        dispatch(setDiagnosisTherapeuticsError(error.message));
    } finally {
        dispatch(setDiagnosisTherapeuticsLoading(false));
    }
};

/* Get Diagnosis Therapeutics Details By Id Api Call */
export const getDiagnosisTherapeuticsById = (data) => async (dispatch) => {
    dispatch(setDiagnosisTherapeuticsLoading(true));
    try {
        const response = await getDiagnosisTherapeuticsDetailsById(data);
        dispatch(setDiagnosisTherapeuticsSuccess(response));
    } catch (error) {
        dispatch(setDiagnosisTherapeuticsError(error.message));
    } finally {
        dispatch(setDiagnosisTherapeuticsLoading(false));
    }
};

/* Save Diagnosis Therapeutics Detail Api Call */
export const saveDiagnosisTherapeuticsDetail = (data) => async (dispatch) => {
    dispatch(setDiagnosisTherapeuticsLoading(true));
    try {
        const response = await saveDiagnosisTherapeuticsDetailApi(data);
        dispatch(setDiagnosisTherapeuticsSuccess(response));
    } catch (error) {
        dispatch(setDiagnosisTherapeuticsError(error.message));
    } finally {
        dispatch(setDiagnosisTherapeuticsLoading(false));
    }
};

