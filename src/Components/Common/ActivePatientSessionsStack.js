import React, { useMemo, useCallback } from 'react';
import { HiddenLink } from '../../helpers/hiddenRouteParams';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getPatientAvatarColor,
  getPatientInitials,
  getSortedPatientSessions,
} from '../../helpers/patientBoardSessionHelper';
import { completePatientBoardSession } from '../../slices/doctor/patientBoardSession/reducer';

const isPatientBoardPath = (pathname = '') =>
  String(pathname).includes('/patientboard') || String(pathname).includes('patientboard');

const ActivePatientSessionsStack = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const sessions = useSelector((state) => state?.PatientBoardSession?.sessions) ?? [];
  const activePatientKey = useSelector((state) => state?.PatientBoardSession?.activePatientKey);

  const sortedSessions = useMemo(() => {
    const uniqueByKey = new Map();
    getSortedPatientSessions(sessions).forEach((session) => {
      if (session?.patientKey) {
        uniqueByKey.set(session.patientKey, session);
      }
    });
    return Array.from(uniqueByKey.values());
  }, [sessions]);

  const handleRemoveSession = useCallback(
    (event, session) => {
      event.preventDefault();
      event.stopPropagation();

      const patientKey = session?.patientKey;
      if (!patientKey) {
        return;
      }

      const removingCurrentBoard =
        isPatientBoardPath(location.pathname) &&
        (patientKey === activePatientKey ||
          (session.resumePath &&
            location.search &&
            String(session.resumePath).includes(location.search.replace(/^\?/, ''))));

      dispatch(completePatientBoardSession(patientKey));

      if (removingCurrentBoard) {
        navigate('/doctordashboard');
      }
    },
    [activePatientKey, dispatch, location.pathname, location.search, navigate]
  );

  if (!sortedSessions.length) {
    return null;
  }

  return (
    <div className="ms-1 header-item active-patient-sessions-stack" aria-label="Active patient sessions">
      <div className="active-patient-sessions-stack__avatars">
        {sortedSessions.map((session, index) => {
          const displayName = String(session.patientName || 'Patient').trim();
          const initials = getPatientInitials(displayName);
          const backgroundColor = getPatientAvatarColor(displayName);
          const isActive = session.patientKey === activePatientKey;

          return (
            <div
              key={session.patientKey || index}
              className={`active-patient-sessions-stack__item${isActive ? ' is-active' : ''}`}
              style={{ zIndex: index + 1 }}
            >
              <HiddenLink
                to={session.resumePath || '/doctor/patientboard'}
                className={`active-patient-sessions-stack__avatar${isActive ? ' is-active' : ''}`}
                style={{ backgroundColor }}
                title={displayName}
                aria-label={`Open patient board for ${displayName}`}
              >
                <span>{initials}</span>
              </HiddenLink>
              <button
                type="button"
                className="active-patient-sessions-stack__remove"
                title={`Remove ${displayName} from open cases`}
                aria-label={`Remove ${displayName} from open cases`}
                onClick={(event) => handleRemoveSession(event, session)}
              >
                <i className="ri-close-line" aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivePatientSessionsStack;
