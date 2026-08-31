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
  Button,
} from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import Select from "react-select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { updateAnatomyHotspot } from "../../../../slices/admin/3dbodypart/hotspots/thunk";
import { getSectionForBodyPart } from "../../../../slices/admin/repertory/bodypart/thunk";
import {
  setAnatomyHotspotError,
  setAnatomyHotspotSuccess,
} from "../../../../slices/admin/3dbodypart/hotspots/reducer";

const selectStyles = (hasError) => ({
  control: (base) => ({
    ...base,
    borderColor: hasError ? "#f06548" : base.borderColor,
    "&:hover": {
      borderColor: hasError ? "#f06548" : base.borderColor,
    },
  }),
});

const buildSectionOptions = (list) =>
  (list || []).map((item) => ({
    label: item.sectionName,
    value: item.sectionId,
    sectionName: item.sectionName,
  }));

const resolveSectionOption = (options, selected) => {
  if (!options?.length) return null;
  const id = selected.sectionId;
  if (id != null && id !== "") {
    const byId = options.find((o) => String(o.value) === String(id));
    if (byId) return byId;
  }
  const name = selected.sectionName;
  if (name) {
    return options.find((o) => o.sectionName === name || o.label === name) || null;
  }
  return null;
};

const EditHotspots = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser"));
  const selected = location.state?.selectedHotspot || {};
  const { anatomyHotspotSuccess, anatomyHotspotError } = useSelector(
    (state) => state?.AnatomyHotspot || {}
  );
  const sectionRaw = useSelector((state) => state?.BodyPart?.sectionForSubSection);

  const sectionArray = useMemo(() => {
    if (Array.isArray(sectionRaw)) return sectionRaw;
    return sectionRaw?.resultObject || sectionRaw?.data || [];
  }, [sectionRaw]);

  const sectionOptions = useMemo(
    () => buildSectionOptions(sectionArray),
    [sectionArray]
  );

  const initialSection = useMemo(
    () => resolveSectionOption(sectionOptions, selected),
    [sectionOptions, selected]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      section: initialSection,
      hotspotName: selected.hotspotName || selected.hotspotsName || "",
    },
    validationSchema: Yup.object({
      section: Yup.object().nullable().required("Please Select Section Name"),
      hotspotName: Yup.string().required("Please Enter Hotspots Name"),
    }),
    onSubmit: (values) => {
      dispatch(
        updateAnatomyHotspot({
          ...selected,
          sectionHotspotId: selected.hotspotId ?? selected.anatomyHotspotId,
          sectionId: values.section?.value,
          sectionName: values.section?.sectionName ?? values.section?.label,
          hotspotName: values.hotspotName,
          changedBy: userDetails?.userId,
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
      setTimeout(() => dispatch(setAnatomyHotspotSuccess(null)), 2000);
    }
    if (anatomyHotspotError) {
      setTimeout(() => dispatch(setAnatomyHotspotError(null)), 2000);
    }
  }, [anatomyHotspotSuccess, anatomyHotspotError, dispatch]);

  document.title = "Edit Hotspots";
  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <div className="p-2">
                {anatomyHotspotSuccess && (
                  <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                    {String(anatomyHotspotSuccess)}
                  </UncontrolledAlert>
                )}
                {anatomyHotspotError && (
                  <UncontrolledAlert color="danger" className="alert-label-icon label-arrow">
                    {anatomyHotspotError}
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
                  <h4 className="card-title mb-0">Edit Hotspot</h4>
                </CardHeader>
                <CardBody>
                  <Row className="gy-4">
                    <Col md={6}>
                      <Label className="form-label">
                        Section Name <span className="required">*</span>
                      </Label>
                      <Select
                        name="section"
                        value={formik.values.section}
                        onChange={(option) => formik.setFieldValue("section", option)}
                        onBlur={() => formik.setFieldTouched("section", true)}
                        options={sectionOptions}
                        isSearchable
                        isClearable
                        placeholder="Search section..."
                        noOptionsMessage={() => "No sections found"}
                        styles={selectStyles(
                          formik.touched.section && formik.errors.section
                        )}
                      />
                      {formik.touched.section && formik.errors.section && (
                        <div className="invalid-feedback d-block">{formik.errors.section}</div>
                      )}
                    </Col>
                    <Col md={6}>
                      <Label className="form-label">
                        Hotspots Name <span className="required">*</span>
                      </Label>
                      <Input
                        name="hotspotName"
                        value={formik.values.hotspotName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        placeholder="Enter hotspot name"
                        invalid={!!(formik.touched.hotspotName && formik.errors.hotspotName)}
                      />
                      {formik.touched.hotspotName && formik.errors.hotspotName && (
                        <FormFeedback>{formik.errors.hotspotName}</FormFeedback>
                      )}
                    </Col>
                  </Row>
                </CardBody>
                <CardFooter>
                  <div className="d-inline-flex gap-2 justify-content-end w-100">
                    <Link to="/admin/list3dhotspots">
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

export default EditHotspots;
