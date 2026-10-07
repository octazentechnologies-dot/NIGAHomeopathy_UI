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
  const userDetails = JSON.parse(sessionStorage.getItem("authUser") || "{}");
  const selected = location.state?.selectedPackage;

  const { packageSuccess, packageError, packageLoading } = useSelector((state) => state?.Package || {});

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
      caseCount: Yup.number().typeError("Must be a number").required("Please Enter Case Count").min(0),
      validityInDays: Yup.number().typeError("Must be a number").required("Please Enter Validity").min(1),
      amount: Yup.number().typeError("Must be a number").required("Please Enter Amount").min(0),
    }),
    onSubmit: (values) => {
      dispatch(
        updatePackage({
          packageId: selected?.packageId ?? selected?.PackageId,
          packageName: values.packageName.trim(),
          caseCount: Number(values.caseCount),
          validityInDays: Number(values.validityInDays),
          amount: Number(values.amount),
          changedBy: userDetails?.userName || userDetails?.data?.userName || "Admin",
          deleteStatus: false,
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
              <Card>
                <div className="p-2">
                  {packageSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {packageSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {packageError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {packageError}
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
                    <h4 className="card-title mb-0 flex-grow-1">Edit Package</h4>
                    <Link to="/admin/listpackage" className="btn btn-soft-secondary btn-sm">
                      Back to List
                    </Link>
                  </CardHeader>

                  <CardBody>
                    <Row className="gy-4">
                      <Col md={6}>
                        <Label htmlFor="packageName" className="form-label">
                          Package Name
                        </Label>
                        <Input
                          name="packageName"
                          type="text"
                          id="packageName"
                          value={formik.values.packageName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          invalid={formik.touched.packageName && !!formik.errors.packageName}
                        />
                        {formik.touched.packageName && formik.errors.packageName ? (
                          <FormFeedback type="invalid">{formik.errors.packageName}</FormFeedback>
                        ) : null}
                      </Col>
                      <Col md={6}>
                        <Label htmlFor="caseCount" className="form-label">
                          Case Count
                        </Label>
                        <Input
                          name="caseCount"
                          type="number"
                          id="caseCount"
                          value={formik.values.caseCount}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          invalid={formik.touched.caseCount && !!formik.errors.caseCount}
                        />
                        {formik.touched.caseCount && formik.errors.caseCount ? (
                          <FormFeedback type="invalid">{formik.errors.caseCount}</FormFeedback>
                        ) : null}
                      </Col>
                      <Col md={6}>
                        <Label htmlFor="validityInDays" className="form-label">
                          Validity (Days)
                        </Label>
                        <Input
                          name="validityInDays"
                          type="number"
                          id="validityInDays"
                          value={formik.values.validityInDays}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          invalid={formik.touched.validityInDays && !!formik.errors.validityInDays}
                        />
                        {formik.touched.validityInDays && formik.errors.validityInDays ? (
                          <FormFeedback type="invalid">{formik.errors.validityInDays}</FormFeedback>
                        ) : null}
                      </Col>
                      <Col md={6}>
                        <Label htmlFor="amount" className="form-label">
                          Amount
                        </Label>
                        <Input
                          name="amount"
                          type="number"
                          step="0.01"
                          id="amount"
                          value={formik.values.amount}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          invalid={formik.touched.amount && !!formik.errors.amount}
                        />
                        {formik.touched.amount && formik.errors.amount ? (
                          <FormFeedback type="invalid">{formik.errors.amount}</FormFeedback>
                        ) : null}
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter>
                    <div className="hstack gap-2 justify-content-end">
                      <Button color="light" type="button" onClick={() => navigate("/admin/listpackage")}>
                        Cancel
                      </Button>
                      <Button color="success" type="submit" disabled={packageLoading}>
                        {packageLoading ? <Spinner size="sm" className="me-1" /> : null}
                        Update
                      </Button>
                    </div>
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

export default EditPackage;
