import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, Col, Container, Input, Label, Row } from 'reactstrap';
import Swal from 'sweetalert2';
import { login as loginApi } from '../../helpers/realbackend_helper';
import { getAuthSession } from '../../helpers/appointmentSlotHelper';
import {
  clearDoctorScreenLocked,
  setDoctorScreenLocked,
} from '../../helpers/doctorScreenLockHelper';

const buildDisplayName = (data) => {
  if (!data) return 'Doctor';
  const first = data.firstName || data.FirstName || '';
  const middle = data.middleName || data.MiddleName || '';
  const last = data.lastName || data.LastName || '';
  const joined = [first, middle, last].filter(Boolean).join(' ').trim();
  if (joined) return joined;
  return data.displayName || data.DisplayName || data.userName || data.UserName || 'Doctor';
};

const DoctorLockPage = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const { data: authData } = useMemo(() => getAuthSession(), []);

  const displayName = useMemo(() => buildDisplayName(authData), [authData]);
  const loginId = authData?.userName || authData?.UserName || authData?.loginId || '';

  useEffect(() => {
    setDoctorScreenLocked(true);
  }, []);

  const handleUnlock = async (event) => {
    event.preventDefault();
    if (!password.trim()) {
      Swal.fire({
        title: 'Password required',
        text: 'Enter your password to unlock.',
        icon: 'warning',
        timer: 1800,
        showConfirmButton: false,
      });
      return;
    }
    if (!loginId) {
      Swal.fire({
        title: 'Session error',
        text: 'Could not read your login id. Please sign in again.',
        icon: 'error',
      });
      return;
    }

    setBusy(true);
    try {
      const response = await loginApi({
        userName: loginId,
        userPassword: password,
      });
      const body = response?.data ?? response;
      const data = body?.data ?? body?.resultObject ?? body;
      const token = data?.token || data?.Token;
      if (!token) {
        Swal.fire({
          title: 'Incorrect password',
          text: 'The password did not match your account. Try again.',
          icon: 'error',
        });
        return;
      }
      clearDoctorScreenLocked();
      setPassword('');
      navigate('/doctordashboard', { replace: true });
    } catch {
      Swal.fire({
        title: 'Incorrect password',
        text: 'The password did not match your account. Try again.',
        icon: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  document.title = 'Screen locked | Niga Homeocentrum';

  return (
    <div className="auth-page-content mt-lg-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="mt-4">
              <CardBody className="p-4">
                <div className="text-center mt-2">
                  <h5 className="text-primary">Your screen is locked</h5>
                  <p className="text-muted mb-0">Enter your password to continue your session.</p>
                </div>
                <div className="user-thumb text-center mt-4">
                  <span
                    className="rounded-circle img-thumbnail avatar-lg d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary fw-semibold"
                    style={{ width: 96, height: 96, fontSize: '1.75rem' }}
                    aria-hidden="true"
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                  <h5 className="font-size-15 mt-3 mb-0">
                    Dr. {displayName}
                  </h5>
                </div>
                <form className="p-2 mt-4" onSubmit={handleUnlock}>
                  <div className="mb-3">
                    <Label className="form-label" htmlFor="doctorLockPassword">
                      Password
                    </Label>
                    <Input
                      id="doctorLockPassword"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={busy}
                      placeholder="Enter password"
                      required
                    />
                  </div>
                  <div className="mb-2 mt-4 d-grid gap-2">
                    <Button color="primary" type="submit" disabled={busy}>
                      {busy ? 'Unlocking…' : 'Unlock'}
                    </Button>
                    <Button
                      color="light"
                      type="button"
                      disabled={busy}
                      onClick={() => navigate('/doctordashboard', { replace: true })}
                    >
                      Back to dashboard
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DoctorLockPage;
