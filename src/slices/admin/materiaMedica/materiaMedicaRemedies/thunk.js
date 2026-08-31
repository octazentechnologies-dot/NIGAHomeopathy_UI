
import {
    setMateriaMedicaError,
    setMateriaMedicaSuccess,
    setMateriaMedicaLoading,
    setAuthorsForMateriaMedicaDDL,
    setRemedy,
    setMateriaMedicaRemediesDetails
} from './reducer';

import {
    getMateriaMedica as getMateriaMedicaApi,
    createOrUpdateMateriaMedica as createOrUpdateMateriaMedicaApi,
    deleteMateriaMedica as deleteMateriaMedicaApi,
    getAuthorForMateriaMedicaDDL as getAuthorForMateriaMedicaDDLApi,
    getRemedyDDL as getRemedyDDLApi,
    getRemedies as getRemediesApi,
    getMateriaMedicaRemediesDetails as getMateriaMedicaRemediesDetailsApi
} from '../../../../helpers/realbackend_helper';

/* Get Remedies Api Call */
export const getRemedies = (data) => async (dispatch) => {
    try {
        const response = await getRemediesApi(data);
        dispatch(setRemedy(response));
    } catch (error) {
        dispatch(setMateriaMedicaError(error.message));
    }
};

export const getMateriaMedicaRemediesDetails = (data) => async (dispatch) => {
    try {
        dispatch(setMateriaMedicaLoading(true));
        const response = await getMateriaMedicaRemediesDetailsApi(data);
        dispatch(setMateriaMedicaRemediesDetails(response));
        dispatch(setMateriaMedicaLoading(false));
        return { payload: response };
    } catch (error) {
        dispatch(setMateriaMedicaLoading(false));
        dispatch(setMateriaMedicaError(error.message));
        throw error;
    }
}

