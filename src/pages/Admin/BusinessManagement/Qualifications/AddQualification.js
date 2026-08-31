import React, { useEffect } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Col,
  Container,
  UncontrolledAlert,
  Input,
  Label,
  Row,
  Button,
  FormFeedback,
  Spinner,
} from "reactstrap";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useDispatch, useSelector } from "react-redux";
import { setQualificationError, setQualificationSuccess } from "../../../../slices/admin/qualifications/reducer";
import { createQualification } from "../../../../slices/admin/qualifications/thunk";

const AddQualification = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const { qualificationSuccess, qualificationError, qualificationLoading } = useSelector((state) => state?.Qualification || {});

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      qualificationName: "",
      qualificationAlias: "",
      description: "",
      degreeLevel: "",
    },
    validationSchema: Yup.object({
      qualificationName: Yup.string().trim().required("Please Enter Qualification Name"),
      qualificationAlias: Yup.string().trim().required("Please Enter Qualification Alias"),
      description: Yup.string().trim(),
      degreeLevel: Yup.string().trim(),
    }),
    onSubmit: (values) => {
      dispatch(
        createQualification({
          qualificationId: 0,
          qualificationName: values.qualificationName.trim(),
          qualificationAlias: values.qualificationAlias.trim(),
          description: values.description?.trim() || "",
          degreeLevel: values.degreeLevel?.trim() || "",
          enteredBy: userDetails?.userName || userDetails?.data?.userName || "Admin",
          changedBy: null,
          deleteStatus: false,
        })
      );
    },
  });

  useEffect(() => {
    if (qualificationSuccess) {
      const timer = setTimeout(() => {
        formik.resetForm();
        dispatch(setQualificationSuccess(null));
      }, 2000);
      return () => clearTimeout(timer);
    }
    if (qualificationError) {
      const timer = setTimeout(() => {
        dispatch(setQualificationError(null));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [qualificationSuccess, qualificationError, dispatch]);

  document.title = "Add Qualification";

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {qualificationSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {qualificationSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {qualificationError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {qualificationError}
                    </UncontrolledAlert>
                  ) : null}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    formik.handleSubmit();
                    return false;
                  }}
                >
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Qualification</h4>
                  </CardHeader>

                  <CardBody>
                    <Row className="gy-4">
                      <Col md={6}>
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
                      </Col>
                      <Col md={6}>
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
                      </Col>
                      <Col md={6}>
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
                      </Col>
                      <Col md={6}>
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
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter>
                    <Row className="g-4">
                      <Col className="col-sm" />
                      <Col className="col-sm-auto">
                        <div className="d-inline-flex gap-2">
                          <Link to="/admin/listqualification">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit" disabled={qualificationLoading}>
                            {qualificationLoading ? <Spinner size="sm" className="me-2" /> : null}
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </CardFooter>
                </form>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default AddQualification;
