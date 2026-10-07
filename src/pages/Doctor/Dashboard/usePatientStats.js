import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPatientStatsCharts } from '../../../slices/doctor/dashboard/thunk';
import { invalidatePatientStatsCharts } from '../../../slices/doctor/dashboard/reducer';
import { buildPatientStatsCacheKey } from './patientStatsChartsHelper';

const AUTO_REFRESH_MS = 2 * 60 * 1000;
const REFRESH_ON_FOCUS_AFTER_MS = 60 * 1000;
const CHANGE_DEBOUNCE_MS = 800;

const appointmentListSignature = (list) =>
    (Array.isArray(list) ? list : [])
        .map((a) => [
            a?.patientAppId ?? a?.patientAppID ?? a?.PatientAppId ?? '',
            a?.status ?? a?.Status ?? '',
            a?.appointmentDate ?? a?.AppointmentDate ?? '',
            a?.appointmentTime ?? a?.AppointmentTime ?? '',
        ].join(':'))
        .join('|');

/**
 * Patient stats for one dashboard chart card. Data comes from the API and is reloaded when the
 * dashboard counts or today's appointment list change (status change, new, cancelled or
 * rescheduled appointment), every two minutes while the tab is visible, and on returning to the tab.
 */
const usePatientStats = (filter) => {
    const dispatch = useDispatch();
    const cacheKey = buildPatientStatsCacheKey(filter);
    const stats = useSelector((state) => state?.DoctorDashboard?.patientStatsChartsByKey?.[cacheKey]);
    const counts = useSelector((state) => state?.DoctorDashboard?.counts);
    const appointmentList = useSelector((state) => state?.DoctorDashboard?.appointmentList);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const lastLoadedAtRef = useRef(0);
    const mountedRef = useRef(true);

    useEffect(() => {
        mountedRef.current = true;
        return () => {
            mountedRef.current = false;
        };
    }, []);

    const { period, fromDate, toDate } = filter;

    const load = useCallback(async ({ force = false } = {}) => {
        setLoading(true);
        setError(null);
        try {
            await dispatch(fetchPatientStatsCharts({ period, fromDate, toDate, cacheKey, force }));
            lastLoadedAtRef.current = Date.now();
        } catch (err) {
            if (mountedRef.current) setError(err);
        } finally {
            if (mountedRef.current) setLoading(false);
        }
    }, [dispatch, period, fromDate, toDate, cacheKey]);

    const reloadAfterChange = useCallback(() => {
        dispatch(invalidatePatientStatsCharts());
        load();
    }, [dispatch, load]);

    useEffect(() => {
        load();
    }, [load]);

    const countsSignature = counts ? JSON.stringify(counts) : '';
    const listSignature = appointmentListSignature(appointmentList);
    const previousRef = useRef({ counts: countsSignature, list: listSignature });

    useEffect(() => {
        const previous = previousRef.current;
        previousRef.current = { counts: countsSignature, list: listSignature };
        // The first load of counts or of the list is not a change.
        const countsChanged = previous.counts !== '' && previous.counts !== countsSignature;
        const listChanged = previous.list !== '' && previous.list !== listSignature;
        if (!countsChanged && !listChanged) return undefined;
        const timer = setTimeout(reloadAfterChange, CHANGE_DEBOUNCE_MS);
        return () => clearTimeout(timer);
    }, [countsSignature, listSignature, reloadAfterChange]);

    useEffect(() => {
        const isVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';
        const timer = setInterval(() => {
            if (isVisible()) reloadAfterChange();
        }, AUTO_REFRESH_MS);
        const onVisibilityChange = () => {
            if (isVisible() && Date.now() - lastLoadedAtRef.current > REFRESH_ON_FOCUS_AFTER_MS) {
                reloadAfterChange();
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            clearInterval(timer);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [reloadAfterChange]);

    const refresh = useCallback(() => load({ force: true }), [load]);

    return { stats, loading, error, refresh };
};

export default usePatientStats;
