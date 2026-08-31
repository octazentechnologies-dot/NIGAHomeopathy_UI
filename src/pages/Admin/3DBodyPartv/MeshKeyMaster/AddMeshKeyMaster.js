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
  Button,
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
            <Card>
              <div className="p-2">
                {meshKeyMasterSuccess && (
                  <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                    <i className="ri-notification-off-line label-icon" />
                    {String(meshKeyMasterSuccess)}
                  </UncontrolledAlert>
                )}
                {meshKeyMasterError && (
                  <UncontrolledAlert color="danger" className="alert-label-icon label-arrow">
                    <i className="ri-error-warning-line label-icon" />
                    {meshKeyMasterError}
                  </UncontrolledAlert>
                )}
              </div>
              <Form
                onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                }}
              >
                <CardHeader>
                  <h4 className="card-title mb-0">New Mesh Key</h4>
                </CardHeader>
                <CardBody>
                  <Row className="gy-4">
                    <Col md={6}>
                      <Label>
                        Mesh Key Name <span className="required">*</span>
                      </Label>
                      <Input
                        name="meshKeyName"
                        value={formik.values.meshKeyName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        invalid={!!(formik.touched.meshKeyName && formik.errors.meshKeyName)}
                      />
                      {formik.touched.meshKeyName && formik.errors.meshKeyName && (
                        <FormFeedback>{formik.errors.meshKeyName}</FormFeedback>
                      )}
                    </Col>
                  </Row>
                </CardBody>
                <CardFooter>
                  <div className="d-inline-flex gap-2 justify-content-end w-100">
                    <Link to="/admin/listmeshkeymaster">
                      <Button color="danger" className="btn-label">
                        <i className="ri-close-fill label-icon align-middle fs-16 me-2" /> Cancel
                      </Button>
                    </Link>
                    <Button color="success" className="btn-label" type="submit">
                      <i className="ri-save-2-line label-icon align-middle fs-16 me-2" /> Save
                    </Button>
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
