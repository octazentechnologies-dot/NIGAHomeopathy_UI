import React, { useEffect, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Col,
  Container,
  UncontrolledAlert,
  Form,
  Label,
  Row,
} from "reactstrap";
import { Link } from "react-router-dom";
import Select from "react-select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { createAnatomySectionMaster } from "../../../../slices/admin/3dbodypart/sectionmaster/thunk";
import { getMeshKeyMastersList } from "../../../../slices/admin/3dbodypart/meshkeymaster/thunk";
import { getSectionForBodyPart } from "../../../../slices/admin/repertory/bodypart/thunk";
import {
  setAnatomySectionMasterError,
  setAnatomySectionMasterSuccess,
} from "../../../../slices/admin/3dbodypart/sectionmaster/reducer";
import { getAdminFormSelectStyles, neutralSelectTheme } from "../../../../helpers/neutralSelectStyles";

const AddSectionMaster = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser"));
  const { anatomySectionMasterSuccess, anatomySectionMasterError } = useSelector(
    (state) => state?.AnatomySectionMaster || {}
  );
  const meshKeyList = useSelector(
    (state) => state?.MeshKeyMaster?.meshKeyMasterList?.resultObject
  );

  console.log("meshKeyList", meshKeyList);
  const sectionRaw = useSelector((state) => state?.BodyPart?.sectionForSubSection);

  const sectionArray = useMemo(() => {
    if (Array.isArray(sectionRaw)) return sectionRaw;
    return sectionRaw?.resultObject || sectionRaw?.data || [];
  }, [sectionRaw]);

  const meshKeyOptions = useMemo(
    () =>
      (meshKeyList || []).map((item) => ({
        label: item.ThreeD_BodyPart_MeshKey_Name,
        value: item.ThreeD_BodyPart_MeshKeyID ?? item.ThreeD_BodyPart_MeshKeyID,
      })),
    [meshKeyList]
  );

  const sectionOptions = useMemo(
    () =>
      sectionArray.map((item) => ({
        label: item.sectionName,
        value: item.sectionId,
      })),
    [sectionArray]
  );

  const formik = useFormik({
    initialValues: {
      meshKey: null,
      section: null,
    },
    validationSchema: Yup.object({
      meshKey: Yup.object().nullable().required("Please Select Mesh Key Name"),
      section: Yup.object().nullable().required("Please Select Section Name"),
    }),
    onSubmit: (values) => {
      dispatch(
        createAnatomySectionMaster({
          ThreeD_BodyPart_MeshKeyID: values.meshKey?.value,
          ThreeDBodyPartSectionID: values.section?.value,
          enteredBy: userDetails?.userId,
        })
      );
    },
  });

  useEffect(() => {
    dispatch(setAnatomySectionMasterError(null));
    dispatch(setAnatomySectionMasterSuccess(null));
    dispatch(getMeshKeyMastersList({ PageNumber: 1, PageSize: 10 }));
    dispatch(getSectionForBodyPart());
  }, [dispatch]);

  useEffect(() => {
    if (anatomySectionMasterSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setAnatomySectionMasterSuccess(null));
      }, 2000);
    }
    if (anatomySectionMasterError) {
      setTimeout(() => dispatch(setAnatomySectionMasterError(null)), 2000);
    }
  }, [anatomySectionMasterSuccess, anatomySectionMasterError, dispatch, formik]);

  document.title = "Add Section Master";
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
                    <h5 className="admin-form-title">New Section</h5>
                  </div>
                </CardHeader>
                <CardBody>
                  {(anatomySectionMasterSuccess || anatomySectionMasterError) ? (
                    <div className="admin-form-alerts">
                      {anatomySectionMasterSuccess ? (
                        <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                          <i className="ri-checkbox-circle-line label-icon" />
                          {String(anatomySectionMasterSuccess)}
                        </UncontrolledAlert>
                      ) : null}
                      {anatomySectionMasterError ? (
                        <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                          <i className="ri-error-warning-line label-icon" />
                          {anatomySectionMasterError}
                        </UncontrolledAlert>
                      ) : null}
                    </div>
                  ) : null}

                  <Row className="gy-3 admin-form-fields">
                    <Col md={6}>
                      <div>
                        <Label className="form-label">
                          Mesh Key Name <span className="required">*</span>
                        </Label>
                        <Select
                          name="meshKey"
                          classNamePrefix="admin-form-select"
                          theme={neutralSelectTheme}
                          value={formik.values.meshKey}
                          onChange={(option) => formik.setFieldValue("meshKey", option)}
                          onBlur={() => formik.setFieldTouched("meshKey", true)}
                          options={meshKeyOptions}
                          isSearchable
                          isClearable
                          placeholder="Search mesh key..."
                          noOptionsMessage={() => "No mesh keys found. Add them in Mesh Key Master."}
                          styles={getAdminFormSelectStyles({
                            invalid: Boolean(formik.touched.meshKey && formik.errors.meshKey),
                          })}
                        />
                        {formik.touched.meshKey && formik.errors.meshKey && (
                          <div className="invalid-feedback d-block">{formik.errors.meshKey}</div>
                        )}
                      </div>
                    </Col>
                    <Col md={6}>
                      <div>
                        <Label className="form-label">
                          Section Name <span className="required">*</span>
                        </Label>
                        <Select
                          name="section"
                          classNamePrefix="admin-form-select"
                          theme={neutralSelectTheme}
                          value={formik.values.section}
                          onChange={(option) => formik.setFieldValue("section", option)}
                          onBlur={() => formik.setFieldTouched("section", true)}
                          options={sectionOptions}
                          isSearchable
                          isClearable
                          placeholder="Search section..."
                          noOptionsMessage={() => "No sections found"}
                          styles={getAdminFormSelectStyles({
                            invalid: Boolean(formik.touched.section && formik.errors.section),
                          })}
                        />
                        {formik.touched.section && formik.errors.section && (
                          <div className="invalid-feedback d-block">{formik.errors.section}</div>
                        )}
                      </div>
                    </Col>
                  </Row>
                </CardBody>
                <CardFooter className="border-0">
                  <div className="d-flex justify-content-end">
                    <div className="admin-form-actions">
                      <Link to="/admin/list3dsectionmaster" className="d-inline-flex">
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

export default AddSectionMaster;
