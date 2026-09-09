import React, { useEffect, useMemo } from 'react';
import BreadCrumb from '../../../../Components/Common/BreadCrumb';
import { Card, CardHeader, CardBody, CardFooter, Col, Container, Form, FormFeedback, Input, Label, Row, UncontrolledAlert } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import Select from "react-select";

// Formik Validation
import * as Yup from "yup";
import { useFormik } from "formik";

//redux
import { useSelector, useDispatch } from "react-redux";
import { updateAllopathicDrug, getAllopathicDrugById } from "../../../../slices/admin/allopathicdrug/thunk";
import { getDrugGroupList } from "../../../../slices/admin/druggroup/thunk";
import { setAllopathicDrugSuccess, setAllopathicDrugError } from "../../../../slices/admin/allopathicdrug/reducer";
import { deleteSeriousSideEffect, deleteOtherSideEffect, deleteAdverseReaction } from "../../../../helpers/realbackend_helper";
import { getAdminFormSelectStyles, neutralSelectTheme } from '../../../../helpers/neutralSelectStyles';

const EditAllopathicDrug = () => {
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state
  const { drugGroupList, drugGroupLoading } = useSelector((state) => state?.DrugGroup);
  const { allopathicDrugSuccess, allopathicDrugError, selectedAllopathicDrug } = useSelector((state) => state?.AllopathicDrug);

  // Format drug group options for Select component
  const drugGroupOptions = useMemo(() => {
    return drugGroupList?.resultObject?.map((group) => ({
      label: group.drugGroupName,
      value: group.drugGroupId,
    })) || [];
  }, [drugGroupList]);

  console.log(selectedAllopathicDrug?.adverseReactionModelList)
  console.log(selectedAllopathicDrug?.otherSideEffectModelList)
  console.log(selectedAllopathicDrug?.seriousSideEffectModelList)
  console.log(Date.now().toString())

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      allopathicDrugId: selectedAllopathicDrug?.allopathicDrugId || '',
      drugGroupId: drugGroupOptions.find((group) => group.value === selectedAllopathicDrug?.drugGroupId) || null,
      allopathicDrugName: selectedAllopathicDrug?.allopathicDrugName || '',
      seriousSideEffectName: '',
      otherSideEffectName: '',
      adverseReactionName: '',
      adverseReactionModelList: selectedAllopathicDrug?.adverseReactionModelList || [],
      otherSideEffectModelList: selectedAllopathicDrug?.otherSideEffectModelList || [],
      seriousSideEffectModelList: selectedAllopathicDrug?.seriousSideEffectModelList || [],
    },
    validationSchema: Yup.object({
      allopathicDrugName: Yup.string().required("Please Enter Allopathic Drug Name"),
      drugGroupId: Yup.object().shape({
        value: Yup.string().required("Please Select Drug Group"),
      }).nullable().required("Please Select Drug Group"),
    }),
    onSubmit: (values) => {
      // Helper function to check if an item is new (not yet saved to database)
      // Existing items from database have allopathicDrugId field
      // New items added via handleAddDrugEffect only have the ID and name fields
      const isNewItem = (item, idFieldName) => {
        // If the item has allopathicDrugId, it's an existing item from database
        if (item.allopathicDrugId !== undefined) return false;
        // If there's no ID at all, it's new
        if (!item[idFieldName]) return true;
        // Check if ID is a temporary ID (string from Date.now().toString() or very large number)
        const id = item[idFieldName];
        if (typeof id === 'string') {
          const numId = parseInt(id, 10);
          // If it's a numeric string > 1 trillion, it's likely a timestamp (temporary)
          if (!isNaN(numId) && numId > 1000000000000) return true;
        }
        // If it's a very large number, it's likely a timestamp (temporary)
        if (typeof id === 'number' && id > 1000000000000) return true;
        // Otherwise, it's an existing item
        return false;
      };

      // Transform adverse reaction list
      const transformedAdverseReactionList = values.adverseReactionModelList.map((item) => {
        if (isNewItem(item, 'adverseReactionId')) {
          // New item - only send name
          return {
            adverseReactionName: item.adverseReactionName
          };
        } else {
          // Existing item - send full object
          return {
            adverseReactionId: item.adverseReactionId,
            adverseReactionName: item.adverseReactionName,
            allopathicDrugId: values.allopathicDrugId,
            allopathicDrugName: values.allopathicDrugName,
            deleteStatus: item.deleteStatus !== undefined ? item.deleteStatus : false
          };
        }
      });

      // Transform other side effect list
      const transformedOtherSideEffectList = values.otherSideEffectModelList.map((item) => {
        if (isNewItem(item, 'otherSideEffectId')) {
          // New item - only send name
          return {
            otherSideEffectName: item.otherSideEffectName
          };
        } else {
          // Existing item - send full object
          return {
            otherSideEffectId: item.otherSideEffectId,
            otherSideEffectName: item.otherSideEffectName,
            allopathicDrugId: values.allopathicDrugId,
            allopathicDrugName: values.allopathicDrugName,
            deleteStatus: item.deleteStatus !== undefined ? item.deleteStatus : false
          };
        }
      });

      // Transform serious side effect list
      const transformedSeriousSideEffectList = values.seriousSideEffectModelList.map((item) => {
        if (isNewItem(item, 'seriousSideEffectId')) {
          // New item - only send name
          return {
            seriousSideEffectName: item.seriousSideEffectName
          };
        } else {
          // Existing item - send full object
          return {
            seriousSideEffectId: item.seriousSideEffectId,
            seriousSideEffectName: item.seriousSideEffectName,
            allopathicDrugId: values.allopathicDrugId,
            allopathicDrugName: values.allopathicDrugName,
            deleteStatus: item.deleteStatus !== undefined ? item.deleteStatus : false
          };
        }
      });

      dispatch(updateAllopathicDrug({
        allopathicDrugId: values.allopathicDrugId,
        drugGroupId: values.drugGroupId.value,
        allopathicDrugName: values.allopathicDrugName,
        adverseReactionModelList: transformedAdverseReactionList,
        otherSideEffectModelList: transformedOtherSideEffectList,
        seriousSideEffectModelList: transformedSeriousSideEffectList,
      }));
    }
  });

  // Handle delete operations
  const handleDeleteSeriousSideEffect = async (seriousSideEffectId) => {
    try {
      const updatedList = formik.values.seriousSideEffectModelList.filter(
        item => item.seriousSideEffectId !== seriousSideEffectId
      );
      formik.setFieldValue('seriousSideEffectModelList', updatedList);
      await deleteSeriousSideEffect({ seriousSideEffectId });
      // Refresh the drug data after successful deletion
      dispatch(getAllopathicDrugById(selectedAllopathicDrug.allopathicDrugId));
    } catch (error) {
      dispatch(setAllopathicDrugError(error.message));
    }
  };

  const handleDeleteOtherSideEffect = async (otherSideEffectId) => {
    try {
      const updatedList = formik.values.otherSideEffectModelList.filter(
        item => item.otherSideEffectId !== otherSideEffectId
      );
      formik.setFieldValue('otherSideEffectModelList', updatedList);
      await deleteOtherSideEffect({ otherSideEffectId });
      // Refresh the drug data after successful deletion
      dispatch(getAllopathicDrugById(selectedAllopathicDrug.allopathicDrugId));
    } catch (error) {
      dispatch(setAllopathicDrugError(error.message));
    }
  };

  const handleDeleteAdverseReaction = async (adverseReactionId) => {
    try {
      const updatedList = formik.values.adverseReactionModelList.filter(
        item => item.adverseReactionId !== adverseReactionId
      );
      formik.setFieldValue('adverseReactionModelList', updatedList);
      await deleteAdverseReaction({ adverseReactionId });
      // Refresh the drug data after successful deletion
      dispatch(getAllopathicDrugById(selectedAllopathicDrug.allopathicDrugId));
    } catch (error) {
      dispatch(setAllopathicDrugError(error.message));
    }
  };

  const handleAddDrugEffect = () => {
    const { seriousSideEffectName, otherSideEffectName, adverseReactionName } = formik.values;

    // Create new arrays with existing items plus new items if they exist
    const newSeriousSideEffects = seriousSideEffectName ? [
      ...formik.values.seriousSideEffectModelList,
      {
        seriousSideEffectId: Date.now().toString(), // Temporary ID for new items
        seriousSideEffectName: seriousSideEffectName
      }
    ] : formik.values.seriousSideEffectModelList;

    const newOtherSideEffects = otherSideEffectName ? [
      ...formik.values.otherSideEffectModelList,
      {
        otherSideEffectId: Date.now().toString(), // Temporary ID for new items
        otherSideEffectName: otherSideEffectName
      }
    ] : formik.values.otherSideEffectModelList;

    const newAdverseReactions = adverseReactionName ? [
      ...formik.values.adverseReactionModelList,
      {
        adverseReactionId: Date.now().toString(), // Temporary ID for new items
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

  useEffect(() => {
    dispatch(getDrugGroupList());
    if (location.state?.selectedAllopathicDrug?.allopathicDrugId) {
      dispatch(getAllopathicDrugById(location.state.selectedAllopathicDrug.allopathicDrugId));
    }
  }, [dispatch, location.state?.selectedAllopathicDrug?.allopathicDrugId]);

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



  document.title = "Edit Allopathic Drug";
  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Row>
            <Col lg={12}>
              <Card className="patient-list-modal admin-existance-list admin-form-card">
                <Form onSubmit={(e) => {
                  e.preventDefault();
                  formik.handleSubmit();
                  return false;
                }}>
                  <CardHeader className="border-0">
                    <div className="admin-form-toolbar">
                      <h5 className="admin-form-title">Edit Allopathic Drug</h5>
                    </div>
                  </CardHeader>

                  <CardBody>
                    {(allopathicDrugSuccess || allopathicDrugError) ? (
                      <div className="admin-form-alerts">
                        {allopathicDrugSuccess ? (
                          <UncontrolledAlert color="success" className="alert-label-icon label-arrow">
                            <i className="ri-checkbox-circle-line label-icon" />
                            {allopathicDrugSuccess}
                          </UncontrolledAlert>
                        ) : null}
                        {allopathicDrugError ? (
                          <UncontrolledAlert color="danger" className="alert-label-icon label-arrow mb-0">
                            <i className="ri-error-warning-line label-icon" />
                            {allopathicDrugError}
                          </UncontrolledAlert>
                        ) : null}
                      </div>
                    ) : null}

                    <Row className="gy-3 admin-form-fields">
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
                            classNamePrefix="admin-form-select"
                            theme={neutralSelectTheme}
                            styles={getAdminFormSelectStyles({ invalid: Boolean(formik.touched.drugGroupId && formik.errors.drugGroupId) })}
                          />
                          {formik.touched.drugGroupId && formik.errors.drugGroupId ? (
                            <FormFeedback type="invalid">{formik.errors.drugGroupId}</FormFeedback>
                          ) : null}
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col className="col-sm">
                        <h5 className="admin-form-title mb-0">Allopathic Drug Details</h5>
                      </Col>
                      <Col className="col-sm-auto">
                        <div className="d-inline-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm admin-list-btn admin-list-btn--import"
                            onClick={handleAddDrugEffect}
                          >
                            <i className="ri-add-line align-middle me-1" aria-hidden="true" /> Add Drug Effect
                          </button>
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="seriousSideEffectName" className="form-label">Serious Side Effect <span className="required">*</span></Label>
                          <Input
                            name='seriousSideEffectName'
                            type="input"
                            value={formik.values.seriousSideEffectName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="seriousSideEffectName"
                            placeholder="Enter Serious Side Effect"
                            invalid={formik.touched.seriousSideEffectName && formik.errors.seriousSideEffectName ? true : false}
                          />
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="otherSideEffectName" className="form-label">Other Side Effect <span className="required">*</span></Label>
                          <Input
                            name='otherSideEffectName'
                            type="input"
                            value={formik.values.otherSideEffectName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="otherSideEffectName"
                            placeholder="Enter Other Side Effect"
                            invalid={formik.touched.otherSideEffectName && formik.errors.otherSideEffectName ? true : false}
                          />
                        </div>
                      </Col>

                      <Col xxl={4} md={4}>
                        <div>
                          <Label htmlFor="adverseReactionName" className="form-label">Adverse Side Effect <span className="required">*</span></Label>
                          <Input
                            name='adverseReactionName'
                            type="input"
                            value={formik.values.adverseReactionName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            className="form-control"
                            id="adverseReactionName"
                            placeholder="Enter Adverse Side Effect"
                            invalid={formik.touched.adverseReactionName && formik.errors.adverseReactionName ? true : false}
                          />
                        </div>
                      </Col>
                    </Row>

                    <Row className="gy-3 admin-form-fields">
                      <Col xxl={4} md={4}>
                        <div>
                          <Label className="form-label">Serious Side Effects</Label>
                          <div className="table-responsive patient-list-modal__table-wrap">
                            <table className="table mb-0 align-middle patient-list-modal__table table-bordered table-nowrap">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th className="text-center" style={{ width: '10%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formik.values.seriousSideEffectModelList.map((effect, index) => (
                                  <tr key={index}>
                                    <td>{effect.seriousSideEffectName}</td>
                                    <td className="text-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        onClick={() => handleDeleteSeriousSideEffect(effect.seriousSideEffectId)}
                                      >
                                        <i className="ri-delete-bin-5-line" />
                                      </button>
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
                          <div className="table-responsive patient-list-modal__table-wrap">
                            <table className="table mb-0 align-middle patient-list-modal__table table-bordered table-nowrap">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th className="text-center" style={{ width: '10%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formik.values.otherSideEffectModelList.map((effect, index) => (
                                  <tr key={index}>
                                    <td>{effect.otherSideEffectName}</td>
                                    <td className="text-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        onClick={() => handleDeleteOtherSideEffect(effect.otherSideEffectId)}
                                      >
                                        <i className="ri-delete-bin-5-line" />
                                      </button>
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
                          <div className="table-responsive patient-list-modal__table-wrap">
                            <table className="table mb-0 align-middle patient-list-modal__table table-bordered table-nowrap">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th className="text-center" style={{ width: '10%' }}>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {formik.values.adverseReactionModelList.map((reaction, index) => (
                                  <tr key={index}>
                                    <td>{reaction.adverseReactionName}</td>
                                    <td className="text-center">
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-soft-danger remove-item-btn"
                                        onClick={() => handleDeleteAdverseReaction(reaction.adverseReactionId)}
                                      >
                                        <i className="ri-delete-bin-5-line" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </CardBody>

                  <CardFooter className="border-0">
                    <div className="d-flex justify-content-end">
                      <div className="admin-form-actions">
                        <Link to="/admin/listallopathicdrug" className="d-inline-flex">
                          <button type="button" className="btn btn-sm admin-list-btn admin-list-btn--reset">
                            <i className="ri-close-line align-middle me-1" aria-hidden="true" />
                            Cancel
                          </button>
                        </Link>
                        <button type="submit" className="btn btn-sm admin-list-btn admin-list-btn--new">
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

export default EditAllopathicDrug;