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
  Button,
} from "reactstrap";
import { Link, useLocation } from "react-router-dom";
import Select from "react-select";
import * as Yup from "yup";
import { useFormik } from "formik";
import { useSelector, useDispatch } from "react-redux";
import { updateAnatomySectionMaster } from "../../../../slices/admin/3dbodypart/sectionmaster/thunk";
import { getMeshKeyMastersList } from "../../../../slices/admin/3dbodypart/meshkeymaster/thunk";
import { getSectionForBodyPart } from "../../../../slices/admin/repertory/bodypart/thunk";
import {
  setAnatomySectionMasterError,
  setAnatomySectionMasterSuccess,
} from "../../../../slices/admin/3dbodypart/sectionmaster/reducer";

const selectStyles = (hasError) => ({
  control: (base) => ({
    ...base,
    borderColor: hasError ? "#f06548" : base.borderColor,
    "&:hover": {
      borderColor: hasError ? "#f06548" : base.borderColor,
    },
  }),
});

const resolveOption = (options, { id, name }) => {
  if (!options?.length) return null;
  if (id != null && id !== "") {
    const byId = options.find((o) => String(o.value) === String(id));
    if (byId) return byId;
  }
  if (name) {
    return options.find((o) => o.label === name) || null;
  }
  return null;
};

const EditSectionMaster = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const userDetails = JSON.parse(sessionStorage.getItem("authUser"));
  const selected = location.state?.selectedSection || {};
  const { anatomySectionMasterSuccess, anatomySectionMasterError } = useSelector(
    (state) => state?.AnatomySectionMaster || {}
  );
  const meshKeyList = useSelector(
    (state) => state?.MeshKeyMaster?.meshKeyMasterList?.resultObject
  );
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

  const initialMeshKey = useMemo(
    () =>
      resolveOption(meshKeyOptions, {
        id: selected.ThreeD_BodyPart_MeshKeyID ?? selected.ThreeD_BodyPart_MeshKeyID,
        name: selected.ThreeD_BodyPart_MeshKey_Name,
      }),
    [meshKeyOptions, selected]
  );

  const initialSection = useMemo(
    () =>
      resolveOption(sectionOptions, {
        id: selected.ThreeDBodyPartSectionID,
        name: selected.SectionName,
      }),
    [sectionOptions, selected]
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      meshKey: initialMeshKey,
      section: initialSection,
    },
    validationSchema: Yup.object({
      meshKey: Yup.object().nullable().required("Please Select Mesh Key Name"),
      section: Yup.object().nullable().required("Please Select Section Name"),
    }),
    onSubmit: (values) => {
      dispatch(
        updateAnatomySectionMaster({
          ...selected,
          ThreeDBodyPartSectionMasterID: selected.ThreeDBodyPartSectionMasterID,
          ThreeD_BodyPart_MeshKeyID: values.meshKey?.value,
          ThreeDBodyPartSectionID: values.section?.value,
          changedBy: userDetails?.userId,
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
      setTimeout(() => dispatch(setAnatomySectionMasterSuccess(null)), 2000);
    }
    if (anatomySectionMasterError) {
      setTimeout(() => dispatch(setAnatomySectionMasterError(null)), 2000);
    }
  }, [anatomySectionMasterSuccess, anatomySectionMasterError, dispatch]);

  document.title = "Edit Section Master";
  return (
    <div className="page-content">
      <Container fluid>
        <Row>
          <Col lg={12}>
            <Card>
              <div className="p-2">
                {anatomySectionMasterSuccess && (
                  <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                    {String(anatomySectionMasterSuccess)}
                  </UncontrolledAlert>
                )}
                {anatomySectionMasterError && (
                  <UncontrolledAlert color="danger" className="alert-label-icon label-arrow">
                    {anatomySectionMasterError}
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
                  <h4 className="card-title mb-0">Edit Section</h4>
                </CardHeader>
                <CardBody>
                  <Row className="gy-4">
                    <Col md={6}>
                      <Label className="form-label">
                        Mesh Key Name <span className="required">*</span>
                      </Label>
                      <Select
                        name="meshKey"
                        value={formik.values.meshKey}
                        onChange={(option) => formik.setFieldValue("meshKey", option)}
                        onBlur={() => formik.setFieldTouched("meshKey", true)}
                        options={meshKeyOptions}
                        isSearchable
                        isClearable
                        placeholder="Search mesh key..."
                        noOptionsMessage={() => "No mesh keys found. Add them in Mesh Key Master."}
                        styles={selectStyles(
                          formik.touched.meshKey && formik.errors.meshKey
                        )}
                      />
                      {formik.touched.meshKey && formik.errors.meshKey && (
                        <div className="invalid-feedback d-block">{formik.errors.meshKey}</div>
                      )}
                    </Col>
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
                  </Row>
                </CardBody>
                <CardFooter>
                  <div className="d-inline-flex gap-2 justify-content-end w-100">
                    <Link to="/admin/list3dsectionmaster">
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

export default EditSectionMaster;
