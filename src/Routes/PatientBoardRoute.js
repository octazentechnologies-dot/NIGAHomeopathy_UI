import React from 'react';
import PatientBoard from '../pages/Doctor/PatientBoard/PatientBoard';
import { buildPatientBoardKey } from '../helpers/patientBoardSessionHelper';
import { useHiddenSearchParams } from '../helpers/hiddenRouteParams';

const PatientBoardRoute = () => {
  const [searchParams] = useHiddenSearchParams();
  const patientId = searchParams.get('patientId');
  const caseId = searchParams.get('caseId');
  const patientAppId = searchParams.get('patientAppId');
  const patientKey = buildPatientBoardKey({ patientId, caseId, patientAppId }) || 'patient-board';

  return <PatientBoard key={patientKey} />;
};

export default PatientBoardRoute;
