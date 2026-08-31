import React, { useEffect, useMemo, useState } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert, Button } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Spinner } from 'reactstrap';
import Select from "react-select";
import makeAnimated from "react-select/animated";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createAllopathicDrug } from "../../../../slices/admin/allopathicdrug/thunk";
import { getDrugGroupList } from "../../../../slices/admin/druggroup/thunk";
import { setAllopathicDrugSuccess, setAllopathicDrugError } from "../../../../slices/admin/allopathicdrug/reducer";

const AddAllopathicDrug = () => {
  const dispatch = useDispatch();

  // Redux state
  const { drugGroupList, drugGroupLoading } = useSelector((state) => state?.DrugGroup);
  const { allopathicDrugSuccess, allopathicDrugError } = useSelector((state) => state?.AllopathicDrug);

  // Format drug group options for Select component
  const drugGroupOptions = useMemo(() => {
    return drugGroupList?.resultObject?.map((group) => ({
      label: group.drugGroupName,
      value: group.drugGroupId,
    })) || [];
  }, [drugGroupList]);

  const formik = useFormik({
    initialValues: {
      drugGroupId: null,
      allopathicDrugName: '',
      seriousSideEffectName: '',
      otherSideEffectName: '',
      adverseReactionName: '',
      adverseReactionModelList: [],
      otherSideEffectModelList: [],
      seriousSideEffectModelList: [],
    },
    validationSchema: Yup.object({
      allopathicDrugName: Yup.string().required("Please Enter Allopathic Drug Name"),
      drugGroupId: Yup.object().shape({
        value: Yup.string().required("Please Select Drug Group"),
      }).nullable().required("Please Select Drug Group"),
    }),
    onSubmit: (values) => {
      dispatch(createAllopathicDrug({
        drugGroupId: values.drugGroupId.value,
        allopathicDrugName: values.allopathicDrugName,
        adverseReactionModelList: values.adverseReactionModelList,
        otherSideEffectModelList: values.otherSideEffectModelList,
        seriousSideEffectModelList: values.seriousSideEffectModelList,
        deleteStatus: false,
      }));
    }
  });

  const handleAddDrugEffect = () => {
    const { seriousSideEffectName, otherSideEffectName, adverseReactionName } = formik.values;

    // Create new arrays with existing items plus new items if they exist
    const newSeriousSideEffects = seriousSideEffectName ? [
      ...formik.values.seriousSideEffectModelList,
      {
        seriousSideEffectId: formik.values.seriousSideEffectModelList.length === 0 ? 1 : formik.values.seriousSideEffectModelList[formik.values.seriousSideEffectModelList.length - 1].seriousSideEffectId + 1,
        seriousSideEffectName: seriousSideEffectName
      }
    ] : formik.values.seriousSideEffectModelList;

    const newOtherSideEffects = otherSideEffectName ? [
      ...formik.values.otherSideEffectModelList,
      {
        otherSideEffectId: formik.values.otherSideEffectModelList.length === 0 ? 1 : formik.values.otherSideEffectModelList[formik.values.otherSideEffectModelList.length - 1].otherSideEffectId + 1,
        otherSideEffectName: otherSideEffectName
      }
    ] : formik.values.otherSideEffectModelList;

    const newAdverseReactions = adverseReactionName ? [
      ...formik.values.adverseReactionModelList,
      {
        adverseReactionId: formik.values.adverseReactionModelList.length === 0 ? 1 : formik.values.adverseReactionModelList[formik.values.adverseReactionModelList.length - 1].adverseReactionId + 1,
        adverseReactionName: adverseReactionName
      }
    ] : formik.values.adverseReactionModelList;

    // Update formik values
    formik.setValues({
      ...formik.values,
      seriousSideEffectModelList: newSeriousSideEffects,
      otherSideEffectModelList: newOtherSideEffects,
      adverseReactionModelList: newAdverseReactions,
      // Clear input fields after adding
      seriousSideEffectName: '',
      otherSideEffectName: '',
      adverseReactionName: ''
    });
  };

  const handleDeleteSeriousSideEffect = (seriousSideEffectId) => {
    const updatedList = formik.values.seriousSideEffectModelList.filter(
      item => item.seriousSideEffectId !== seriousSideEffectId
    );
    formik.setFieldValue('seriousSideEffectModelList', updatedList);
  };

  const handleDeleteOtherSideEffect = (otherSideEffectId) => {
    const updatedList = formik.values.otherSideEffectModelList.filter(
      item => item.otherSideEffectId !== otherSideEffectId
    );
    formik.setFieldValue('otherSideEffectModelList', updatedList);
  };

  const handleDeleteAdverseReaction = (adverseReactionId) => {
    const updatedList = formik.values.adverseReactionModelList.filter(
      item => item.adverseReactionId !== adverseReactionId
    );
    formik.setFieldValue('adverseReactionModelList', updatedList);
  };

  useEffect(() => {
    dispatch(getDrugGroupList());
  }, [dispatch]);

  useEffect(() => {
    if (allopathicDrugSuccess) {
      setTimeout(() => {
        formik.resetForm();
        dispatch(setAllopathicDrugSuccess(null));
      }, 2000);
    }
    if (allopathicDrugError) {
      setTimeout(() => {
        dispatch(setAllopathicDrugError(null));
      }, 2000);
    }
  }, [allopathicDrugSuccess, allopathicDrugError]);

  document.title = "Add Allopathic Drug";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card>
                <div className="p-2">
                  {allopathicDrugSuccess ? (
                    <UncontrolledAlert color="success" className="alert-label-icon label-arrow" style={{ marginTop: "13px" }}>
                      <i className="ri-notification-off-line label-icon"></i>
                      {allopathicDrugSuccess}
                    </UncontrolledAlert>
                  ) : null}
                  {allopathicDrugError ? (
                    <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-xl-0" style={{ marginTop: "13px" }}>
                      <i className="ri-error-warning-line label-icon"></i>
                      {allopathicDrugError}
                    </UncontrolledAlert>
                  ) : null}
                </div>
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="align-items-center d-flex">
                    <h4 className="card-title mb-0 flex-grow-1">New Allopathic Drug</h4>
                  </CardHeader>

                  <CardBody className="card-body">
                    <div className="live-preview">
                      <Row className="gy-4">
                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="allopathicDrugName" className="form-label">Allopathic Drug Name <span className="required">*</span></Label>
                            <Input
                              name='allopathicDrugName'
                              type="text"
                              value={formik.values.allopathicDrugName}
                              onChange={formik.handleChange}
                              onBlur={formik.handleBlur}
                              className="form-control"
                              id="allopathicDrugName"
                              placeholder="Enter Allopathic Drug Name"
                              invalid={formik.touched.allopathicDrugName && formik.errors.allopathicDrugName ? true : false}
                            />
                            {formik.touched.allopathicDrugName && formik.errors.allopathicDrugName ? (
                              <FormFeedback type="invalid">{formik.errors.allopathicDrugName}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>

                        <Col xxl={6} md={6}>
                          <div>
                            <Label htmlFor="drugGroupId" className="form-label">
                              Drug Group <span className="required">*</span>
                            </Label>
                            <Select
                              name="drugGroupId"
                              value={formik.values.drugGroupId}
                              onChange={(selectedOption) => formik.setFieldValue("drugGroupId", selectedOption)}
                              options={drugGroupOptions}
                              isLoading={drugGroupLoading}
                              onBlur={() => formik.setFieldTouched("drugGroupId", true)}
                              className={formik.touched.drugGroupId && formik.errors.drugGroupId ? "is-invalid" : ""}
                              styles={{
                                control: (base, state) => ({
                                  ...base,
                                  borderColor: formik.touched.drugGroupId && formik.errors.drugGroupId ? "red" : base.borderColor,
                                  "&:hover": {
                                    borderColor: formik.touched.drugGroupId && formik.errors.drugGroupId ? "red" : base.borderColor,
                                  },
                                }),
                              }}
                            />
                            {formik.touched.drugGroupId && formik.errors.drugGroupId ? (
                              <FormFeedback type="invalid">{formik.errors.drugGroupId}</FormFeedback>
                            ) : null}
                          </div>
                        </Col>
                      </Row>

                      <hr />

                      <Row className="g-4">
                        <Col className="col-sm">
                          <h4 className="card-title mb-0 flex-grow-1">Allopathic Drug Details</h4>
                        </Col>
                        <Col className="col-sm-auto">
                          <div className="d-inline-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-soft-info btn-sm"
                              onClick={handleAddDrugEffect}
                            >
                              <i className="ri-add-line align-middle"></i> Add Drug Effect
                            </button>
                          </div>
                        </Col>
                      </Row>

                      <Row className='mt-3'>
                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="seriousSideEffectName" className="form-label">Serious Side Effect</Label>
                            <Input
                              name='seriousSideEffectName'
                              type="text"
                              value={formik.values.seriousSideEffectName}
                              onChange={formik.handleChange}
                              className="form-control"
                              id="seriousSideEffectName"
                              placeholder="Enter Serious Side Effect"
                            />
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="otherSideEffectName" className="form-label">Other Side Effect</Label>
                            <Input
                              name='otherSideEffectName'
                              type="text"
                              value={formik.values.otherSideEffectName}
                              onChange={formik.handleChange}
                              className="form-control"
                              id="otherSideEffectName"
                              placeholder="Enter Other Side Effect"
                            />
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label htmlFor="adverseReactionName" className="form-label">Adverse Side Effect</Label>
                            <Input
                              name='adverseReactionName'
                              type="text"
                              value={formik.values.adverseReactionName}
                              onChange={formik.handleChange}
                              className="form-control"
                              id="adverseReactionName"
                              placeholder="Enter Adverse Side Effect"
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row className="mt-3">
                        <Col xxl={4} md={4}>
                          <div>
                            <Label className="form-label">Serious Side Effects</Label>
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th style={{ width: '10%' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {formik.values.seriousSideEffectModelList.map((effect, index) => (
                                    <tr key={index}>
                                      <td>{effect.seriousSideEffectName}</td>
                                      <td className="text-center">
                                        <Button
                                          color="danger"
                                          size="sm"
                                          onClick={() => handleDeleteSeriousSideEffect(effect.seriousSideEffectId)}
                                        >
                                          <i className="ri-delete-bin-5-line" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label className="form-label">Other Side Effects</Label>
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th style={{ width: '10%' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {formik.values.otherSideEffectModelList.map((effect, index) => (
                                    <tr key={index}>
                                      <td>{effect.otherSideEffectName}</td>
                                      <td className="text-center">
                                        <Button
                                          color="danger"
                                          size="sm"
                                          onClick={() => handleDeleteOtherSideEffect(effect.otherSideEffectId)}
                                        >
                                          <i className="ri-delete-bin-5-line" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </Col>

                        <Col xxl={4} md={4}>
                          <div>
                            <Label className="form-label">Adverse Reactions</Label>
                            <div className="table-responsive">
                              <table className="table table-bordered">
                                <thead>
                                  <tr>
                                    <th>Name</th>
                                    <th style={{ width: '10%' }}>Action</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {formik.values.adverseReactionModelList.map((reaction, index) => (
                                    <tr key={index}>
                                      <td>{reaction.adverseReactionName}</td>
                                      <td className="text-center">
                                        <Button
                                          color="danger"
                                          size="sm"
                                          onClick={() => handleDeleteAdverseReaction(reaction.adverseReactionId)}
                                        >
                                          <i className="ri-delete-bin-5-line" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </div>
                  </CardBody>

                  <CardFooter className="gap-2">
                    <Row className="g-4">
                      <Col className="col-sm">
                        <div className="d-flex justify-content-sm-start">
                        </div>
                      </Col>
                      <Col className="col-sm-auto">
                        <div className="d-inline-flex gap-2">
                          <Link to="/admin/listallopathicdrug">
                            <Button color="danger" className="btn-label">
                              <i className="ri-close-fill label-icon align-middle fs-16 me-2"></i> Cancel
                            </Button>
                          </Link>
                          <Button color="success" className="btn-label" type="submit">
                            <i className="ri-save-2-line label-icon align-middle fs-16 me-2"></i> Save
                          </Button>
                        </div>
                      </Col>
                    </Row>
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

export default AddAllopathicDrug;