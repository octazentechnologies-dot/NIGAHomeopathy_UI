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
  FormFeedback,
  Input,
  Label,
  Row,
} from "reactstrap";
import { Link } from "react-router-dom";
import Select from "react-select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { createAnatomyHotspot } from "../../../../slices/admin/3dbodypart/hotspots/thunk";
import { getSectionForBodyPart } from "../../../../slices/admin/repertory/bodypart/thunk";
import {
  setAnatomyHotspotError,
  setAnatomyHotspotSuccess,
} from "../../../../slices/admin/3dbodypart/hotspots/reducer";
import { getAdminFormSelectStyles, neutralSelectTheme } from "../../../../helpers/neutralSelectStyles";

const AddHotspots = () => {
  const dispatch = useDispatch();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser"));
  const { anatomyHotspotSuccess, anatomyHotspotError } = useSelector(
    (state) => state?.AnatomyHotspot || {}
  );
  const sectionRaw = useSelector((state) => state?.BodyPart?.sectionForSubSection);

  const sectionArray = useMemo(() => {
    if (Array.isArray(sectionRaw)) return sectionRaw;
    return sectionRaw?.resultObject || sectionRaw?.data || [];
  }, [sectionRaw]);

  const sectionOptions = useMemo(
    () =>
      sectionArray.map((item) => ({
        label: item.sectionName,
        value: item.sectionId,
        sectionName: item.sectionName,
      })),
    [sectionArray]
  );

  const formik = useFormik({
    initialValues: {
      section: null,
      hotspotName: "",
    },
    validationSchema: Yup.object({
      section: Yup.object().nullable().required("Please Select Section Name"),
      hotspotName: Yup.string().required("Please Enter Hotspots Name"),
    }),
    onSubmit: (values) => {
      dispatch(
        createAnatomyHotspot({
          sectionId: values.section?.value,
          sectionName: values.section?.sectionName ?? values.section?.label,
          hotspotName: values.hotspotName,
          enteredBy: userDetails?.userId,
        })
      );
    },
  });

  useEffect(() => {
    dispatch(setAnatomyHotspotError(null));
    dispatch(setAnatomyHotspotSuccess(null));
    dispatch(getSectionForBodyPart());
  }, [dispatch]);

  useEffect(() => {
    if (anatomyHotspotSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setAnatomyHotspotSuccess(null));
      }, 2000);
    }
    if (anatomyHotspotError) {
      setTimeout(() => dispatch(setAnatomyHotspotError(null)), 2000);
    }
  }, [anatomyHotspotSuccess, anatomyHotspotError, dispatch, formik]);

  document.title = "Add Hotspots";
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
                    <h5 className="admin-form-title">New Hotspot</h5>
                  </div>
                </CardHeader>
                <CardBody>
                  {(anatomyHotspotSuccess || anatomyHotspotError) ? (
                    <div className="admin-form-alerts">
                      {anatomyHotspotSuccess ? (
                        <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                          <i className="ri-checkbox-circle-line label-icon" />
                          {String(anatomyHotspotSuccess)}
                        </UncontrolledAlert>
                      ) : null}
                      {anatomyHotspotError ? (
                        <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                          <i className="ri-error-warning-line label-icon" />
                          {anatomyHotspotError}
                        </UncontrolledAlert>
                      ) : null}
                    </div>
                  ) : null}

                  <Row className="gy-3 admin-form-fields">
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
                    <Col md={6}>
                      <div>
                        <Label htmlFor="hotspotName" className="form-label">
                          Hotspots Name <span className="required">*</span>
                        </Label>
                        <Input
                          name="hotspotName"
                          id="hotspotName"
                          value={formik.values.hotspotName}
                          onChange={formik.handleChange}
                          onBlur={formik.handleBlur}
                          placeholder="Enter hotspot name"
                          invalid={!!(formik.touched.hotspotName && formik.errors.hotspotName)}
                        />
                        {formik.touched.hotspotName && formik.errors.hotspotName && (
                          <FormFeedback>{formik.errors.hotspotName}</FormFeedback>
                        )}
                      </div>
                    </Col>
                  </Row>
                </CardBody>
                <CardFooter className="border-0">
                  <div className="d-flex justify-content-end">
                    <div className="admin-form-actions">
                      <Link to="/admin/list3dhotspots" className="d-inline-flex">
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

export default AddHotspots;
