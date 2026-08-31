import React from 'react';
import { useSearchParams } from 'react-router-dom';
import PatientBoard from '../pages/Doctor/PatientBoard/PatientBoard';
import { buildPatientBoardKey } from '../helpers/patientBoardSessionHelper';

const PatientBoardRoute = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');
  const caseId = searchParams.get('caseId');
  const patientAppId = searchParams.get('patientAppId');
  const patientKey = buildPatientBoardKey({ patientId, caseId, patientAppId }) || 'patient-board';

  return <PatientBoard key={patientKey} />;
};

export default PatientBoardRoute;
