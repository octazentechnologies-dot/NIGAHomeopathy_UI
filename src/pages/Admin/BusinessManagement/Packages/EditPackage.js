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
import { setPackageError, setPackageSuccess } from "../../../../slices/admin/packages/reducer";
import { updatePackage } from "../../../../slices/admin/packages/thunk";

const EditPackage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const selected = location.state?.selectedPackage;

  const { packageSuccess, packageError, packageLoading } = useSelector((state) => state?.Package) || {};

  useEffect(() => {
    if (!selected) {
      navigate("/admin/listpackage");
    }
  }, [selected, navigate]);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      packageName: selected?.packageName ?? selected?.PackageName ?? "",
      caseCount: selected?.caseCount ?? selected?.CaseCount ?? "",
      validityInDays: selected?.validityInDays ?? selected?.ValidityInDays ?? "",
      amount: selected?.amount ?? selected?.Amount ?? "",
    },
    validationSchema: Yup.object({
      packageName: Yup.string().trim().required("Please Enter Package Name"),
      caseCount: Yup.number().typeError("Please Enter Case Count").required("Please Enter Case Count").min(0),
      validityInDays: Yup.number().typeError("Please Enter Validity").required("Please Enter Validity").min(1),
      amount: Yup.number().typeError("Please Enter Amount").required("Please Enter Amount").min(0),
    }),
    onSubmit: (values) => {
      dispatch(
        updatePackage({
          packageId: selected?.packageId ?? selected?.PackageId,
          packageName: values.packageName.trim(),
          caseCount: Number(values.caseCount),
          validityInDays: Number(values.validityInDays),
          amount: Number(values.amount),
        })
      );
    },
  });

  useEffect(() => {
    if (packageSuccess) {
      const timer = setTimeout(() => {
        dispatch(setPackageSuccess(null));
        navigate("/admin/listpackage");
      }, 1500);
      return () => clearTimeout(timer);
    }
    if (packageError) {
      const timer = setTimeout(() => {
        dispatch(setPackageError(null));
      }, 2500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [packageSuccess, packageError, dispatch, navigate]);

  document.title = "Edit Package";

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
                      <h5 className="admin-form-title">Edit Package</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(packageSuccess || packageError) ? (
                      <div className="admin-form-alerts">
                        {packageSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {packageSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {packageError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {packageError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
                      <Col md={6}>
                        <div>
                          <Label htmlFor="packageName" className="form-label">
                            Package Name
                          </Label>
                          <Input
                            name="packageName"
                            type="text"
                            id="packageName"
                            placeholder="e.g. Starter"
                            value={formik.values.packageName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.packageName && !!formik.errors.packageName}
                          />
                          {formik.touched.packageName && formik.errors.packageName ? (
                            <FormFeedback type="invalid">{formik.errors.packageName}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <Label htmlFor="amount" className="form-label">
                            Amount
                          </Label>
                          <Input
                            name="amount"
                            type="number"
                            id="amount"
                            placeholder="e.g. 999"
                            value={formik.values.amount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.amount && !!formik.errors.amount}
                          />
                          {formik.touched.amount && formik.errors.amount ? (
                            <FormFeedback type="invalid">{formik.errors.amount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <Label htmlFor="caseCount" className="form-label">
                            Case Count
                          </Label>
                          <Input
                            name="caseCount"
                            type="number"
                            id="caseCount"
                            placeholder="e.g. 100"
                            value={formik.values.caseCount}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.caseCount && !!formik.errors.caseCount}
                          />
                          {formik.touched.caseCount && formik.errors.caseCount ? (
                            <FormFeedback type="invalid">{formik.errors.caseCount}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                      <Col md={6}>
                        <div>
                          <Label htmlFor="validityInDays" className="form-label">
                            Validity (Days)
                          </Label>
                          <Input
                            name="validityInDays"
                            type="number"
                            id="validityInDays"
                            placeholder="e.g. 365"
                            value={formik.values.validityInDays}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            invalid={formik.touched.validityInDays && !!formik.errors.validityInDays}
                          />
                          {formik.touched.validityInDays && formik.errors.validityInDays ? (
                            <FormFeedback type="invalid">{formik.errors.validityInDays}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listpackage" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new" disabled={packageLoading}>
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

export default EditPackage;
