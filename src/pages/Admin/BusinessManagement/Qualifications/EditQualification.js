import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Col,
  Container,
  UncontrolledAlert,
  Form,
  Input,
  Label,
  Row,
  FormFeedback,
} from "reactstrap";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { setQualificationError, setQualificationSuccess } from "../../../../slices/admin/qualifications/reducer";
import { updateQualification } from "../../../../slices/admin/qualifications/thunk";

const EditQualification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const selected = location.state?.selectedQualification;

  const { qualificationSuccess, qualificationError, qualificationLoading } = useSelector((state) => state?.Qualification || {});

  useEffect(() => {
    if (!selected) {
      navigate("/admin/listqualification");
    }
  }, [selected, navigate]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      qualificationName: selected?.qualificationName ?? selected?.QualificationName ?? "",
      qualificationAlias: selected?.qualificationAlias ?? selected?.QualificationAlias ?? "",
      description: selected?.description ?? selected?.Description ?? "",
      degreeLevel: selected?.degreeLevel ?? selected?.DegreeLevel ?? "",
    },
    validationSchema: Yup.object({
      qualificationName: Yup.string().trim().required("Please Enter Qualification Name"),
      qualificationAlias: Yup.string().trim().required("Please Enter Qualification Alias"),
      description: Yup.string().trim(),
      degreeLevel: Yup.string().trim(),
    }),
    onSubmit: (values) => {
      dispatch(
        updateQualification({
          qualificationId: selected?.qualificationId ?? selected?.QualificationId,
          qualificationName: values.qualificationName.trim(),
          qualificationAlias: values.qualificationAlias.trim(),
          description: values.description?.trim() || "",
          degreeLevel: values.degreeLevel?.trim() || "",
          changedBy: userDetails?.userName || userDetails?.data?.userName || "Admin",
          deleteStatus: false,
        })
      );
    },
  });

  useEffect(() => {
    if (qualificationSuccess) {
      const timer = setTimeout(() => {
        dispatch(setQualificationSuccess(null));
        navigate("/admin/listqualification");
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (qualificationError) {
      const timer = setTimeout(() => {
        dispatch(setQualificationError(null));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [qualificationSuccess, qualificationError, dispatch, navigate]);

  document.title = "Edit Qualification";

  if (!selected) {
    return null;
  }

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form
                  onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                    return false;
                  }}
                >
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">Edit Qualification</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(qualificationSuccess || qualificationError) ? (
                      <div className="admin-form-alerts">
                        {qualificationSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {qualificationSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {qualificationError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {qualificationError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col md={6}>
                        <div>
                          <Label htmlFor="qualificationName" className="form-label">
                            Qualification Name
                          </Label>
                          <Input
                            name="qualificationName"
                            type="text"
                            id="qualificationName"
                            placeholder="e.g. BHMS"
                            value={formik.values.qualificationName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.qualificationName && !!formik.errors.qualificationName}
                          />
                          {formik.touched.qualificationName && formik.errors.qualificationName ? (
                            <FormFeedback type="invalid">{formik.errors.qualificationName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <Label htmlFor="qualificationAlias" className="form-label">
                            Qualification Alias
                          </Label>
                          <Input
                            name="qualificationAlias"
                            type="text"
                            id="qualificationAlias"
                            placeholder="Short alias"
                            value={formik.values.qualificationAlias}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.qualificationAlias && !!formik.errors.qualificationAlias}
                          />
                          {formik.touched.qualificationAlias && formik.errors.qualificationAlias ? (
                            <FormFeedback type="invalid">{formik.errors.qualificationAlias}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <Label htmlFor="degreeLevel" className="form-label">
                            Degree Level
                          </Label>
                          <Input
                            name="degreeLevel"
                            type="text"
                            id="degreeLevel"
                            placeholder="e.g. UG / PG / Diploma"
                            value={formik.values.degreeLevel}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <Label htmlFor="description" className="form-label">
                            Description
                          </Label>
                          <Input
                            name="description"
                            type="text"
                            id="description"
                            placeholder="Optional description"
                            value={formik.values.description}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                          />
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listqualification" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new" disabled={qualificationLoading}>
                          <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                          Update
                        </button>
                      </div>
                    </div>
                  </CardFooter>
                </Form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default EditQualification;
