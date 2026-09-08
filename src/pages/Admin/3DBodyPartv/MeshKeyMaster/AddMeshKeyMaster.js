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
  FormFeedback,
  Input,
  Label,
  Row,
} from "reactstrap";
import { Link } from "react-router-dom";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { createMeshKeyMaster } from "../../../../slices/admin/3dbodypart/meshkeymaster/thunk";
import {
  setMeshKeyMasterError,
  setMeshKeyMasterSuccess,
} from "../../../../slices/admin/3dbodypart/meshkeymaster/reducer";

const AddMeshKeyMaster = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser"));
  const { meshKeyMasterSuccess, meshKeyMasterError } = useSelector(
    (state) => state?.MeshKeyMaster || {}
  );

  const formik = useFormik({
    initialValues: { meshKeyName: "" },
    validationSchema: Yup.object({
      meshKeyName: Yup.string().required("Please Enter Mesh Key Name"),
    }),
    onSubmit: (values) => {
      dispatch(
        createMeshKeyMaster({
          ThreeD_BodyPart_MeshKey_Name: values.meshKeyName,
          enteredBy: userDetails?.userId,
        })
      );
    },
  });

  useEffect(() => {
    dispatch(setMeshKeyMasterError(null));
    dispatch(setMeshKeyMasterSuccess(null));
  }, [dispatch]);

  useEffect(() => {
    if (meshKeyMasterSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setMeshKeyMasterSuccess(null));
      }, 2000);
    }
    if (meshKeyMasterError) {
      setTimeout(() => dispatch(setMeshKeyMasterError(null)), 2000);
    }
  }, [meshKeyMasterSuccess, meshKeyMasterError, dispatch, formik]);

  document.title = "Add Mesh Key Master";
  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card className="patient-list-modal admin-existance-list admin-form-card">
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                }}
              >
                <CardHeader className="border-0">
                  <div className="admin-form-toolbar">
                    <h5 className="admin-form-title">New Mesh Key</h5>
                  </div>
                </CardHeader>
                <CardBody>
                  {(meshKeyMasterSuccess || meshKeyMasterError) ? (
                    <div className="admin-form-alerts">
                      {meshKeyMasterSuccess ? (
                        <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                          <i className="ri-checkbox-circle-line label-icon" />
                          {String(meshKeyMasterSuccess)}
                        </UncontrolledAlert>
                      ) : null}
                      {meshKeyMasterError ? (
                        <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                          <i className="ri-error-warning-line label-icon" />
                          {meshKeyMasterError}
                        </UncontrolledAlert>
                      ) : null}
                    </div>
                  ) : null}

                  <Row className="gy-3 admin-form-fields">
                    <Col md={6}>
                      <div>
                        <Label htmlFor="meshKeyName" className="form-label">
                          Mesh Key Name <span className="required">*</span>
                        </Label>
                        <Input
                          name="meshKeyName"
                          id="meshKeyName"
                          value={formik.values.meshKeyName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          invalid={!!(formik.touched.meshKeyName && formik.errors.meshKeyName)}
                        />
                        {formik.touched.meshKeyName && formik.errors.meshKeyName && (
                          <FormFeedback>{formik.errors.meshKeyName}</FormFeedback>
                        )}
                      </div>
                    </Col>
                  </Row>
                </CardBody>
                <CardFooter className="border-0">
                  <div className="d-flex justify-content-end">
                    <div className="admin-form-actions">
                      <Link to="/admin/listmeshkeymaster" className="d-inline-flex">
                        <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                          <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                          Cancel
                        </button>
                      </Link>
                      <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
                        <i className="ri-save-2-line align-middle me-1" aria-hidden="true" />
                        Save
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
  );
};

export default AddMeshKeyMaster;
