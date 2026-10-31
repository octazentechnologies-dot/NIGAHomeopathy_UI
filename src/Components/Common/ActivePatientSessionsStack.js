import React, { useMemo } from 'react';
import { HiddenLink } from '../../helpers/hiddenRouteParams';
import { useSelector } from 'react-redux';
import {
  getPatientAvatarColor,
  getPatientInitials,
  getSortedPatientSessions,
} from '../../helpers/patientBoardSessionHelper';

const ActivePatientSessionsStack = () => {
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
            <HiddenLink
              key={session.patientKey || index}
              to={session.resumePath || '/doctor/patientboard'}
              className={`active-patient-sessions-stack__avatar${isActive ? ' is-active' : ''}`}
              style={{ backgroundColor, zIndex: index + 1 }}
              title={displayName}
              aria-label={`Open patient board for ${displayName}`}
            >
              <span>{initials}</span>
            </HiddenLink>
          );
        })}
      </div>
    </div>
  );
};

export default ActivePatientSessionsStack;
