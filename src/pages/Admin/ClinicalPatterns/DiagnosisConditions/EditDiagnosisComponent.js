import React, { Component } from 'react';
import { Table, Col, FormGroup, Form, Row } from 'react-bootstrap';
import { Button, Card, CardBody, CardFooter, CardHeader, } from 'reactstrap';
import { Input, Label } from 'reactstrap';
import CommonServices from '../../Services/CommonServices';
import '../../components/CommanStyle.css';
import axios from 'axios';
import AsyncPaginate from "react-select-async-paginate";
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';


export class EditDiagnosisComponent extends Component {

    /**
     * Created Date     :   19 Dec 2019  
     * purpose          :   Component responsible for handling DiagnosisMaster records   
     * Author           :   
     */
    constructor(props) {
        super(props);
        this.state = {
            diagnosisId: 0,
            diagnosisList: [],
            sectionList: [],
            subsectionList: [],
            DiagnosisName: '',
            DiagnosisNameAlias: '',
            Miasm: '',
            SelectedSubSectionList: [],
            modelEx: [],
            keywordId: 0,

            // Symptoms Section
            SymptomsSectionId: 0,
            diagnosisSymptomsIds: [],
            SymptomssubsectionList: [],
            models: [],
            symptom: '',
            // Monogram section
            MonogramSectionId: 0,
            MonogramKeyword: "",
            diagnosisMonogramIds: [],
            DiagnosisMonogramDetails: [],
            MonogramsubsectionList: [],

            // Causations Section
            diagnosisCausationsIds: [],
            CausationName: "",
            CausationsSectionId: 0,
            CausationssubsectionList: [],
            DiagnosisCausationNameDetails: [],

            // Pathology Section
            PathologySectionId: 0,
            diagnosisPathologyKeyword: "",
            PathologysubsectionList: [],
            diagnosisPathologyIds: [],
            DiagnosisPathologyDetails: [],
            DiagnosisPathologyRubricDetails: [],

            // Emergencies Section
            EmergenciesKeywords: '',
            EmergenciessubsectionList: [],
            EmergenciesSectionId: 0,
            diagnosisEmergenciesIds: [],
            EmergencieDetails: [],
            EmergencieRubricDetails: [],

            // Onset/Duration/Progress  Section
            onsetKeyword: '',
            OnsetsubsectionList: [],
            OnsetSectionId: 0,
            diagnosisOnsetIds: [],
            OnsetDurationProgressDetails: [],
            OnsetDurationProgressRubricDetails: [],

            // Patterns Section
            PatternsKeywords: '',
            PatternsSectionId: 0,
            PatternssubsectionList: [],
            diagnosisPatternsIds: [],
            PatternsDetail: [],
            PatternRubricDetails: [],

            // LocationExtention Section
            LocationExtentionDetailsKeyword: '',
            LocationExtentionSectionId: 0,
            LocationExtentionsubsectionList: [],
            diagnosisLocationExtentionIds: [],
            LocationExtentionDetails: [],
            LocationExtentionRubricDetails: [],

            // Sensation Section
            SensationDetailsKeyword: '',
            SensationSectionId: 0,
            SensationsubsectionList: [],
            diagnosisSensationIds: [],
            SensationDetails: [],
            SensationRubricDetails: [],

            // Modalities Section
            ModalitiesDetailsKeyword: '',
            ModalitiesSectionId: 0,
            ModalitiessubsectionList: [],
            diagnosisModalitiesIds: [],
            ModalitiesDetails: [],
            ModalitiesRubricDetails: [],

            // Accompanied Section
            AccompaniedDetailsSystem: '',
            AccompaniedSectionId: 0,
            AccompaniedsubsectionList: [],
            diagnosisAccompaniedIds: [],
            AccompaniedDetails: [],
            AccompaniedRubricDetails: [],

            // Observations Section
            ObservationsDetailsKeyword: '',
            ObservationsSectionId: [],
            ObservationssubsectionList: [],
            diagnosisObservationsIds: [],
            ObservationsDetails: [],
            ObservationsRubricDetails: [],

            // BeforeAfterDuring Section
            BeforeAfterDuringDetailsKeyword: '',
            BeforeAfterDuringSectionId: 0,
            BeforeAfterDuringsubsectionList: [],
            diagnosisBeforeAfterDuringIds: [],
            BeforeAfterDuringDetails: [],
            BeforeAfterDuringRubricDetails: [],

            investigations: "",
            allopathicMedicines: "",
            examiniations: "",

            diagnosisSystemList: [],
            diagnosisSystemId: 0,
            diagnosisSystemDetailsList: [],
            diagnosisSystemIds: [],

            SectionId: 0,
            subsectionId: 0,
            SubSectionName: '',
            selectedSubSection: '',
            EnteredBy: 'Admin',
            DeleteStatus: false,
            errors: {},

        }
        this.SubSectionhandleChange = this.SubSectionhandleChange.bind(this);
        this.otherhandleChange = this.otherhandleChange.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleChangeSubSection = this.handleChangeSubSection.bind(this);
        this.submitForm = this.submitForm.bind(this);
        this.addSymptoms = this.addSymptoms.bind(this);
        this.addMonogram = this.addMonogram.bind(this);
        this.addCausations = this.addCausations.bind(this);
        this.addPathology = this.addPathology.bind(this);
        this.addEmergencies = this.addEmergencies.bind(this);
        this.addOnset = this.addOnset.bind(this);
        this.addPatterns = this.addPatterns.bind(this);
        this.addLocationExtention = this.addLocationExtention.bind(this);
        this.addSensation = this.addSensation.bind(this);
        this.addModalities = this.addModalities.bind(this);
        this.addAccompanied = this.addAccompanied.bind(this);
        this.addObservations = this.addObservations.bind(this);
        this.addBeforeAfterDuring = this.addBeforeAfterDuring.bind(this);
    }


    async componentDidMount() {
        debugger
        var Id = this.props.match.params.id;
        this.editDiagnosis(Id);
        await this.GetSections();
        await this.getDignosisSystem();
    }


    editDiagnosis(diagnosisId) {
        debugger;
        if (diagnosisId != undefined) {
            CommonServices.getDataById(diagnosisId, `/diagnosis`).then((res) => {
                debugger;
                console.log("response==", res)

                let diagnosisSystemDetailsList = [];
                res.diagnosisSystemDetailsList.forEach((item) => {
                    diagnosisSystemDetailsList.push({
                        value: item.diagnosisSystemId,
                        label: item.diagnosisSystemName,
                        diagnosisSystemDetailId: item.diagnosisSystemDetailId,
                        diagnosisId: item.diagnosisId,
                    })
                })
                console.log("diagnosisSystemDetailsList==", diagnosisSystemDetailsList)
                this.setState({
                    diagnosisId: res.diagnosisId,
                    DiagnosisName: res.diagnosisName,
                    DiagnosisNameAlias: res.diagnosisNameAlias,
                    Miasm: res.miasm,
                    "investigations": res.investigations,
                    "allopathicMedicines": res.allopathicMedicines,
                    "examiniations": res.examiniations,
                    diagnosisDetailId: res.diagnosisDetailId,
                    subSectionId: res.subSectionId,
                    EnteredBy: 'Admin',
                    DeleteStatus: false,
                    SelectedSubSectionList: res.modelEx,
                    models: res.diagnosisSymptomsList,
                    DiagnosisMonogramDetails: res.diagnosisMonogramDetailsModelsList,
                    DiagnosisCausationNameDetails: res.diagnosisCausationList,
                    DiagnosisPathologyDetails: res.diagnosisPathologyDetailsModelsList,
                    EmergencieDetails: res.emergencieDetailsModelList,
                    OnsetDurationProgressDetails: res.onsetDurationProgressDetails,
                    PatternsDetail: res.patternsDetails,
                    LocationExtentionDetails: res.locationExtentionDetailsModelList,
                    SensationDetails: res.sensationDetailsModelList,
                    ModalitiesDetails: res.modalitiesDetailsModelsList,
                    AccompaniedDetails: res.accompaniedDetailsModelsList,
                    ObservationsDetails: res.observationsDetailsModelsList,
                    BeforeAfterDuringDetails: res.beforeAfterDuringDetailsModelsList,
                    diagnosisSystemIds: diagnosisSystemDetailsList

                })
            });
        }
    }



    rendersectionList = () => {
        if (this.state.sectionList == undefined) {
            return null;
        }
        return this.state.sectionList.map((section, index) => {
            return <option key={index} value={section.sectionId}>{section.sectionName}</option>
        })
    }


    rendersubsectionList = () => {
        debugger;
        if (this.state.subsectionList == undefined) {
            return null;
        }
        return this.state.subsectionList.map((subsection, index) => {
            return <option key={index} value={subsection.subSectionId}>{subsection.subSectionName}</option>
        })
    }

    DiagnosisTabChanged = (string, e) => {
        debugger;
        if (e != null) {
            if (string === "Symptoms") {
                this.setState({
                    diagnosisSymptomsIds: e,
                }, () => {
                    console.log('diagnosisSymptomsIds====>>>>>', this.state.diagnosisSymptomsIds);
                })
            }
            else if (string === "Monogram") {
                this.setState({
                    diagnosisMonogramIds: e,
                }, () => {
                    console.log('diagnosisMonogramIds====>>>>>', this.state.diagnosisMonogramIds);
                })
            }
            else if (string === "Causations") {
                this.setState({
                    diagnosisCausationsIds: e,
                }, () => {
                    console.log('diagnosisCausationsIds====>>>>>', this.state.diagnosisCausationsIds);
                })
            }
            else if (string === "Pathology") {
                this.setState({
                    diagnosisPathologyIds: e,
                }, () => {
                    console.log('diagnosisPathologyIds====>>>>>', this.state.diagnosisPathologyIds);
                })
            }
            else if (string === "Emergencies") {
                this.setState({
                    diagnosisEmergenciesIds: e,
                }, () => {
                    console.log('diagnosisEmergenciesIds====>>>>>', this.state.diagnosisEmergenciesIds);
                })
            }
            else if (string === "Onset") {
                this.setState({
                    diagnosisOnsetIds: e,
                }, () => {
                    console.log('diagnosisOnsetIds====>>>>>', this.state.diagnosisOnsetIds);
                })
            }
            else if (string === "Patterns") {
                this.setState({
                    diagnosisPatternsIds: e,
                }, () => {
                    console.log('diagnosisPatternsIds====>>>>>', this.state.diagnosisPatternsIds);
                })
            }
            else if (string === "LocationExtention") {
                this.setState({
                    diagnosisLocationExtentionIds: e,
                }, () => {
                    console.log('diagnosisLocationExtentionIds====>>>>>', this.state.diagnosisLocationExtentionIds);
                })
            }
            else if (string === "Sensation") {
                this.setState({
                    diagnosisSensationIds: e,
                }, () => {
                    console.log('diagnosisSensationIds====>>>>>', this.state.diagnosisSensationIds);
                })
            }
            else if (string === "Modalities") {
                this.setState({
                    diagnosisModalitiesIds: e,
                }, () => {
                    console.log('diagnosisModalitiesIds====>>>>>', this.state.diagnosisModalitiesIds);
                })
            }
            else if (string === "Accompanied") {
                this.setState({
                    diagnosisAccompaniedIds: e,
                }, () => {
                    console.log('diagnosisAccompaniedIds====>>>>>', this.state.diagnosisAccompaniedIds);
                })
            }
            else if (string === "Observations") {
                this.setState({
                    diagnosisObservationsIds: e,
                }, () => {
                    console.log('diagnosisObservationsIds====>>>>>', this.state.diagnosisObservationsIds);
                })
            }
            else if (string === "BeforeAfterDuring") {
                this.setState({
                    diagnosisBeforeAfterDuringIds: e,
                }, () => {
                    console.log('diagnosisBeforeAfterDuringIds====>>>>>', this.state.diagnosisBeforeAfterDuringIds);
                })
            }
        }
    }

    DiagnosisSystemChanged = (e) => {
        debugger;
        if (e != null) {
            this.setState({
                diagnosisSystemIds: e,
            }, () => {
                console.log('data====>>>>>', this.state.diagnosisSystemIds);
            })
        }
    }

    loadDiagnosisSystem = async (search, prevOptions) => {
        const options = [];
        var diagnosisSystem = this.state.diagnosisSystemList;
        diagnosisSystem.map(x => options.push({ value: x.diagnosisSystemId, label: x.diagnosisSystemName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        } else {
            const searchLower = search.toLowerCase();

            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }

        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }


    Deleterubric = (childindex, diagnosisRubricId, item, string, parentindex) => {
                debugger
                if (string === "Symptoms") {
                    var array = item.diagnosisSymptomRubric; // make a separate copy of the array  
                    if (childindex !== -1) {
                        array.splice(childindex, 1);
                        this.setState({
                            models: this.state.models
                        })
                        if (item.diagnosisSymptomRubric.length === 0) {
                            debugger
                            this.state.keywordId=item.diagnosisSymptomId
                            var array1 = this.state.models;
                            if (parentindex !== -1) {
                                array1.splice(parentindex, 1);
                                this.setState({
                                    models: this.state.models, 
                                })
                            }
                        }
                    }
                }

                if (string === "Monogram") {
                    var Monogramarray = item.diagnosisMonogramRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        Monogramarray.splice(childindex, 1);
                        this.setState({
                            DiagnosisMonogramDetails: this.state.DiagnosisMonogramDetails
                        })
                        if (item.diagnosisMonogramRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.diagnosisMonogramDetailsId
                            var Monogramarray1 = this.state.DiagnosisMonogramDetails;
                            if (parentindex !== -1) {
                                Monogramarray1.splice(parentindex, 1);
                                this.setState({
                                    DiagnosisMonogramDetails: this.state.DiagnosisMonogramDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "Causations") {
                    var Causationsarray = item.diagnosisCausationRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        Causationsarray.splice(childindex, 1);
                        this.setState({
                            DiagnosisCausationNameDetails: this.state.DiagnosisCausationNameDetails
                        })
                        if (item.diagnosisCausationRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.causationId
                            var Causationarray1 = this.state.DiagnosisCausationNameDetails;
                            if (parentindex !== -1) {
                                Causationarray1.splice(parentindex, 1);
                                this.setState({
                                    DiagnosisCausationNameDetails: this.state.DiagnosisCausationNameDetails, 
                                })
                            }
                        }
                    }
                }


                if (string === "Pathology") {
                    var Pathologyarray = item.diagnosisPathologyRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        Pathologyarray.splice(childindex, 1);
                        this.setState({
                            DiagnosisPathologyDetails: this.state.DiagnosisPathologyDetails
                        })
                        if (item.diagnosisPathologyRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.diagnosisPathologyDetailsId
                            var Pathologyarray1 = this.state.DiagnosisPathologyDetails;
                            if (parentindex !== -1) {
                                Pathologyarray1.splice(parentindex, 1);
                                this.setState({
                                    DiagnosisPathologyDetails: this.state.DiagnosisPathologyDetails, 
                                })
                            }
                        }
                    }
                }


                if (string === "Emergencies") {
                    var emergenciearray = item.emergencieRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        emergenciearray.splice(childindex, 1);
                        this.setState({
                            EmergencieDetails: this.state.EmergencieDetails
                        })
                        if (item.emergencieRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.emergencieId
                            var emergenciearray1 = this.state.EmergencieDetails;
                            if (parentindex !== -1) {
                                emergenciearray1.splice(parentindex, 1);
                                this.setState({
                                    EmergencieDetails: this.state.EmergencieDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "Onset") {
                    var onsetarray = item.onsetDurationProgressRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        onsetarray.splice(childindex, 1);
                        this.setState({
                            OnsetDurationProgressDetails: this.state.OnsetDurationProgressDetails
                        })
                        if (item.onsetDurationProgressRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.onsetDetailId
                            var Onsetarray1 = this.state.OnsetDurationProgressDetails;
                            if (parentindex !== -1) {
                                Onsetarray1.splice(parentindex, 1);
                                this.setState({
                                    OnsetDurationProgressDetails: this.state.OnsetDurationProgressDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "Patterns") {
                    var patternarray = item.patternRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        patternarray.splice(childindex, 1);
                        this.setState({
                            PatternsDetail: this.state.PatternsDetail
                        })
                        if (item.patternRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.patternDetailsId
                            var patternarray1 = this.state.PatternsDetail;
                            if (parentindex !== -1) {
                                patternarray1.splice(parentindex, 1);
                                this.setState({
                                    PatternsDetail: this.state.PatternsDetail, 
                                })
                            }
                        }
                    }
                }


                if (string === "LocationExtention") {
                    var locationarray = item.locationExtentionRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        locationarray.splice(childindex, 1);
                        this.setState({
                            LocationExtentionDetails: this.state.LocationExtentionDetails
                        })
                        if (item.locationExtentionRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.locationExtentionDetailsId
                            var locationarray1 = this.state.LocationExtentionDetails;
                            if (parentindex !== -1) {
                                locationarray1.splice(parentindex, 1);
                                this.setState({
                                    LocationExtentionDetails: this.state.LocationExtentionDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "Sensation") {
                    var sensationarray = item.sensationRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        sensationarray.splice(childindex, 1);
                        this.setState({
                            SensationDetails: this.state.SensationDetails
                        })
                        if (item.sensationRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.sensationDetailsId
                            var sensationarray1 = this.state.SensationDetails;
                            if (parentindex !== -1) {
                                sensationarray1.splice(parentindex, 1);
                                this.setState({
                                    SensationDetails: this.state.SensationDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "Modalities") {
                    var modalitiesarray = item.modalitiesRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        modalitiesarray.splice(childindex, 1);
                        this.setState({
                            ModalitiesDetails: this.state.ModalitiesDetails
                        })
                        if (item.modalitiesRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.modalitiesDetailsId
                            var modalitiesarray1 = this.state.ModalitiesDetails;
                            if (parentindex !== -1) {
                                modalitiesarray1.splice(parentindex, 1);
                                this.setState({
                                    ModalitiesDetails: this.state.ModalitiesDetails, 
                                })
                            }
                        }
                    }
                }


                if (string === "Accompanied") {
                    var accompaniedarray = item.accompaniedRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        accompaniedarray.splice(childindex, 1);
                        this.setState({
                            AccompaniedDetails: this.state.AccompaniedDetails
                        })
                        if (item.accompaniedRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.accompaniedDetailsId
                            var accompaniedarray1 = this.state.AccompaniedDetails;
                            if (parentindex !== -1) {
                                accompaniedarray1.splice(parentindex, 1);
                                this.setState({
                                    AccompaniedDetails: this.state.AccompaniedDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "Observations") {
                    var observationsarray = item.observationsRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        observationsarray.splice(childindex, 1);
                        this.setState({
                            ObservationsDetails: this.state.ObservationsDetails
                        })
                        if (item.observationsRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.observationsDetailsId
                            var observationsarray1 = this.state.ObservationsDetails;
                            if (parentindex !== -1) {
                                observationsarray1.splice(parentindex, 1);
                                this.setState({
                                    ObservationsDetails: this.state.ObservationsDetails, 
                                })
                            }
                        }
                    }
                }

                if (string === "BeforeAfterDuring") {
                    var beforeAfterarray = item.beforeAfterDuringRubricDetails; // make a separate copy of the array  
                    if (childindex !== -1) {
                        beforeAfterarray.splice(childindex, 1);
                        this.setState({
                            BeforeAfterDuringDetails: this.state.BeforeAfterDuringDetails
                        })
                        if (item.beforeAfterDuringRubricDetails.length === 0) {
                            debugger
                            this.state.keywordId=item.beforeAfterDuringDetailsId
                            var observationsarray1 = this.state.BeforeAfterDuringDetails;
                            if (parentindex !== -1) {
                                observationsarray1.splice(parentindex, 1);
                                this.setState({
                                    BeforeAfterDuringDetails: this.state.BeforeAfterDuringDetails, 
                                })
                            }
                        }
                    }
                }
                CommonServices.postData({"diagnosisTab": string, "diagnosisRubricId": diagnosisRubricId,"keywordId": this.state.keywordId},`/diagnosis/DeleteDiagnosisRubric`).then((res) => {
                debugger
                console.log('res=======', res)
                this.setState({
                    keywordId:0
                })

            });

        }

        render() {
        const monogramList = this.state.MonogramModel;
        const counter = this.state.SectionId;
        const counterMonogram = this.state.monogramId;
        const counterPathology = this.state.pathologyId;
        const counterDiagnosisSystem = this.state.diagnosisSystemId;
        const counterDiagnosisSymptoms = this.state.SymptomsSectionId;
        const counterDiagnosisMonogram = this.state.MonogramSectionId;
        const counterDiagnosisCausations = this.state.CausationsSectionId;
        const counterDiagnosisPathology = this.state.PathologySectionId;
        const counterDiagnosisEmergencies = this.state.EmergenciesSectionId;
        const counterDiagnosisOnset = this.state.OnsetSectionId;
        const counterDiagnosisPatterns = this.state.PatternsSectionId;
        const counterDiagnosisLocationExtention = this.state.LocationExtentionSectionId;
        const counterDiagnosisSensation = this.state.SensationSectionId;
        const counterDiagnosisModalities = this.state.ModalitiesSectionId;
        const counterDiagnosisAccompanied = this.state.AccompaniedSectionId;
        const counterDiagnosisObservations = this.state.ObservationsSectionId;
        const counterDiagnosisBeforeAfterDuring = this.state.BeforeAfterDuringSectionId;

        return (
            <Card>
                <CardHeader>
                    <i className="fa fa-align-justify"></i>
                    Add Diagnosis
                </CardHeader>

                <CardBody>
                    <Tabs defaultActiveKey="t1">
                        <Tab eventKey="t1" title="Diagnosis">
                            <Form encType="multipart/form-data" className="form-horizontal">
                                <Row>
                                    <Col xs="12" md="4">
                                        <FormGroup >
                                            <Label className="label" htmlFor="">Diagnosis Name
                                                <span className="required">*</span> :</Label>
                                            <Form.Control type="text" placeholder="Diagnosis Name"
                                                name="DiagnosisName"
                                                onChange={this.otherhandleChange.bind(this)}
                                                value={this.state.DiagnosisName === null ? '' : this.state.DiagnosisName} />
                                            <span className="error">{this.state.errors["DiagnosisName"]}</span>
                                        </FormGroup>
                                    </Col>

                                    <Col xs="12" md="4">
                                        <FormGroup >
                                            <Label className="label" htmlFor="">Diagnosis Name Alias :</Label>
                                            <Form.Control type="text" placeholder="Diagnosis Name Alias"
                                                name="DiagnosisNameAlias"
                                                onChange={this.otherhandleChange.bind(this)}
                                                value={this.state.DiagnosisNameAlias === null ? '' : this.state.DiagnosisNameAlias} />
                                        </FormGroup>
                                    </Col>

                                    <Col xs="12" md="4">
                                        <FormGroup >
                                            <Label className="label" htmlFor="">Miasm :</Label>
                                            <Form.Control type="text" placeholder="Miasm"
                                                name="Miasm"
                                                onChange={this.otherhandleChange.bind(this)}
                                                value={this.state.Miasm === null ? '' : this.state.Miasm} />
                                        </FormGroup>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col xs="12" md="4">
                                        <FormGroup >
                                            <Label className="label" htmlFor="">Section Name
                                                <span className="required">*</span> :
                                            </Label>
                                            <Form.Control as="select"
                                                name="SectionId"
                                                onChange={this.handleChangeSubSection.bind(this, "Diagnosis")}
                                                value={this.state.SectionId === null ? '' : this.state.SectionId}>

                                                <option value="0">Select</option>
                                                {
                                                    this.rendersectionList()
                                                }
                                            </Form.Control>
                                            <span className="error">{this.state.errors["SectionId"]}</span>
                                        </FormGroup>
                                    </Col>

                                    <Col xs="12" md="6">
                                        <FormGroup >
                                            <Label className="label" htmlFor="">Sub Section Name
                                                <span className="required">*</span> :
                                            </Label>
                                            <AsyncPaginate style={{ width: '80px' }}
                                                isClearable
                                                key={counter}
                                                cacheOptions={counter}
                                                closeMenuOnSelect={false}
                                                labelKey="value"
                                                labelValue="subSectionId"
                                                name="subSectionId"
                                                placeholder="Type Sub-Section"
                                                value={this.state.selectedSubSection}
                                                loadOptions={this.loadOptions.bind(this)}
                                                onChange={(item) => this.SubsectionChanged(item)}
                                            />
                                            <span className="error">{this.state.errors["SubSectionId"]}</span>
                                        </FormGroup>
                                    </Col>

                                    <Col xs="12" md="2">
                                        <FormGroup >
                                            <Button

                                                type="button"
                                                style={{ marginTop: 32 }}
                                                onClick={this.addSelectedSubSectionQuestions.bind(this)}
                                                size="sm" color="primary">
                                                <i className="fa fa-plus"></i> Add SubSection
                                            </Button>
                                        </FormGroup>
                                    </Col>
                                </Row>
                            </Form>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        {/* <th className='fcol'>Sr.No</th> */}
                                        <th>Sub Section Name</th>
                                        <th className='lcol'>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {
                                        this.state.SelectedSubSectionList.map((s, index) => {
                                            return <tr key={index}>
                                                <td>{s.subsectionName}</td>
                                                <td className='lcol'>
                                                    <Button style={{ marginLeft: 8 }} variant="danger" color="danger" onClick={() => this.deleteSubsSection(index)} ><i className="fa fa-trash"></i></Button>
                                                </td>
                                            </tr>
                                        })
                                    }
                                </tbody>
                            </Table><br></br>
                            <Row>

                                <Col xs="12" md="6">
                                    <Button
                                        type="button"
                                        style={{ textTransform: "uppercase" }}
                                        onClick={this.submitForm}
                                        size="sm" color="primary">
                                        <i className="fa fa-save"></i> Save
                                    </Button> &nbsp;
                                    <Button
                                        type="reset"
                                        style={{ textTransform: "uppercase" }}
                                        onClick={() => this.props.history.push('/ListDiagnosis')}
                                        size="sm" color="danger">
                                        <i className="fa fa-ban"></i> Cancel
                                    </Button>
                                </Col>
                                <Col xs="12" md="6" style={{ textAlign: "right" }}>
                                    <Label style={{ fontSize: 15, margin: 0, paddingTop: 5 }}> Fields marked with an asterisk <span className="required">*</span> are mandatory</Label>
                                </Col>

                            </Row>
                        </Tab>
                        <Tab eventKey="t2" title="Diagnosis Symptoms">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Dignosis Symptoms Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Dignosis Symptoms Keywords"
                                            name="symptom"
                                            onChange={this.handleChange}
                                            value={this.state.symptom === null ? '' : this.state.symptom} />
                                        <span className="error">{this.state.errors["symptom"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="SymptomsSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Symptoms")}
                                        value={this.state.SymptomsSectionId === null ? '' : this.state.SymptomsSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisSymptoms}
                                            closeMenuOnSelect={false}
                                            cacheOptions={counterDiagnosisSymptoms}
                                            value={this.state.diagnosisSymptomsIds}
                                            loadOptions={this.loadSymptomsOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Symptoms")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addSymptoms}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Symptoms
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Diagnosis Symptoms Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.models.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.symptom}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.diagnosisSymptomRubric.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'>
                                                                        <Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                            onClick={() => this.Deleterubric(childindex, Subsection.diagnosisSymptomRubricId, item, "Symptoms", parentindex)}>
                                                                            <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t3" title="Diagnosis Monogram">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Dignosis Monogram Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Dignosis Monogram Keywords"
                                            name="MonogramKeyword"
                                            onChange={this.otherhandleChange.bind(this)}
                                            value={this.state.MonogramKeyword === null ? '' : this.state.MonogramKeyword} />
                                        <span className="error">{this.state.errors["MonogramKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="MonogramSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Monogram")}
                                        value={this.state.MonogramSectionId === null ? '' : this.state.MonogramSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisMonogram}
                                            closeMenuOnSelect={false}
                                            cacheOptions={counterDiagnosisMonogram}
                                            value={this.state.diagnosisMonogramIds}
                                            loadOptions={this.loadMonogramOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Monogram")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addMonogram}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Monogram
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Diagnosis Monogram Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.DiagnosisMonogramDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.diagnosisMonogramKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.diagnosisMonogramRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.diagnosisMonogramRubricDetailsId, item, "Monogram", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t4" title="Diagnosis Causations">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Dignosis Causations Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Dignosis Causations Keywords"
                                            name="CausationName"
                                            onChange={this.handleChange}
                                            value={this.state.CausationName === null ? '' : this.state.CausationName} />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="CausationsSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Causations")}
                                        value={this.state.CausationsSectionId === null ? '' : this.state.CausationsSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisCausations}
                                            closeMenuOnSelect={false}
                                            cacheOptions={counterDiagnosisCausations}
                                            value={this.state.diagnosisCausationsIds}
                                            loadOptions={this.loadCausationsOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Causations")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addCausations}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Causations
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Diagnosis Causations Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.DiagnosisCausationNameDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.causationName}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.diagnosisCausationRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.causationRubricDetailsId, item, "Causations", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t5" title="Diagnosis Pathology">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Dignosis Pathology Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Dignosis Pathology Keywords"
                                            name="diagnosisPathologyKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.diagnosisPathologyKeyword === null ? '' : this.state.diagnosisPathologyKeyword} />
                                        <span className="error">{this.state.errors["diagnosisPathologyKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="PathologySectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Pathology")}
                                        value={this.state.PathologySectionId === null ? '' : this.state.PathologySectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisPathology}
                                            closeMenuOnSelect={false}
                                            cacheOptions={counterDiagnosisPathology}
                                            value={this.state.diagnosisPathologyIds}
                                            loadOptions={this.loadPathologyOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Pathology")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addPathology}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Pathology
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Diagnosis Pathology Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.DiagnosisPathologyDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.diagnosisPathologyKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.diagnosisPathologyRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.diagnosisPathologyRubricDetailsId, item, "Pathology", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t6" title="Diagnosis System">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Select one or more Diagnosis System <span className="required">*</span> :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            key={counterDiagnosisSystem}
                                            cacheOptions={counterDiagnosisSystem}
                                            placeholder="Select one or more Diagnosis System"
                                            value={this.state.diagnosisSystemIds}
                                            closeMenuOnSelect={false}
                                            loadOptions={this.loadDiagnosisSystem}
                                            onChange={this.DiagnosisSystemChanged.bind(this)}
                                        />
                                    </FormGroup>
                                </Col>
                            </Row>



                        </Tab>
                        <Tab eventKey="t7" title="Emergencies">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Emergencies Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text" placeholder="Emergencies Keywords"
                                            name="EmergenciesKeywords"
                                            onChange={this.handleChange}
                                            value={this.state.EmergenciesKeywords === null ? '' : this.state.EmergenciesKeywords} />
                                        <span className="error">{this.state.errors["EmergenciesKeywords"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="EmergenciesSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Emergencies")}
                                        value={this.state.EmergenciesSectionId === null ? '' : this.state.EmergenciesSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisEmergencies}
                                            cacheOptions={counterDiagnosisEmergencies}
                                            value={this.state.diagnosisEmergenciesIds}
                                            closeMenuOnSelect={false}
                                            loadOptions={this.loadEmergenciesOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Emergencies")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addEmergencies}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Emergencies
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Emergencies Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.EmergencieDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.emergencieKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.emergencieRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.emergencieRubricId, item, "Emergencies", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t8" title="Other">
                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">Investigations <span className="required">*</span> :</Label>
                                        <Form.Control type="text" placeholder="Enter Investigations"
                                            name="investigations"
                                            onChange={this.otherhandleChange.bind(this)}
                                            value={this.state.investigations === null ? '' : this.state.investigations} />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">Allopathic Medicines <span className="required">*</span> :</Label>
                                        <Form.Control type="text"
                                            placeholder="Enter Allopathic Medicines"
                                            name="allopathicMedicines"
                                            onChange={this.otherhandleChange.bind(this)}
                                            value={this.state.allopathicMedicines === null ? '' : this.state.allopathicMedicines} />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">Examination <span className="required">*</span> :</Label>
                                        <Form.Control type="text" placeholder="Enter Examination"
                                            name="examiniations"
                                            onChange={this.otherhandleChange.bind(this)}
                                            value={this.state.examiniations === null ? '' : this.state.examiniations} />
                                    </FormGroup>
                                </Col>
                            </Row>
                        </Tab>
                        <Tab eventKey="t9" title="Onset/Duration/Progress">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Onset/Duration/Progress Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Onset/Duration/Progress Keywords"
                                            name="onsetKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.onsetKeyword === null ? '' : this.state.onsetKeyword} />
                                        <span className="error">{this.state.errors["onsetKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="OnsetSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Onset")}
                                        value={this.state.OnsetSectionId === null ? '' : this.state.OnsetSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisOnset}
                                            cacheOptions={counterDiagnosisOnset}
                                            value={this.state.diagnosisOnsetIds}
                                            closeMenuOnSelect={false}
                                            loadOptions={this.loadOnsetOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Onset")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addOnset}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Onset/Duration/Progress
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Onset/Duration/Progress Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.OnsetDurationProgressDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.onsetKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.onsetDurationProgressRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.OnsetRubricId, item, "Onset", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t10" title="Patterns">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Patterns Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text" placeholder="Patterns Keywords"
                                            name="PatternsKeywords"
                                            onChange={this.handleChange}
                                            value={this.state.PatternsKeywords === null ? '' : this.state.PatternsKeywords} />
                                        <span className="error">{this.state.errors["PatternsKeywords"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="PatternsSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Patterns")}
                                        value={this.state.PatternsSectionId === null ? '' : this.state.PatternsSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisPatterns}
                                            cacheOptions={counterDiagnosisPatterns}
                                            value={this.state.diagnosisPatternsIds}
                                            closeMenuOnSelect={false}
                                            loadOptions={this.loadPatternsOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Patterns")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addPatterns}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Patterns
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Patterns Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.PatternsDetail.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.patternsKeywords}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.patternRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.patternRubricDetailsId, item, "Patterns", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t11" title="Location-Extension">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Location-Extension Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Location-Extension Keywords"
                                            name="LocationExtentionDetailsKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.LocationExtentionDetailsKeyword === null ? '' : this.state.LocationExtentionDetailsKeyword} />
                                        <span className="error">{this.state.errors["LocationExtentionDetailsKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="LocationExtentionSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "LocationExtention")}
                                        value={this.state.LocationExtentionSectionId === null ? '' : this.state.LocationExtentionSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()

                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisLocationExtention}
                                            closeMenuOnSelect={false}
                                            cacheOptions={counterDiagnosisLocationExtention}
                                            value={this.state.diagnosisLocationExtentionIds}
                                            loadOptions={this.loadLocationExtentionOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "LocationExtention")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addLocationExtention}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Location-Extension
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Location-Extension Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.LocationExtentionDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.locationExtentionDetailsKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.locationExtentionRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.locationExtentionRubricDetailsId, item, "LocationExtention", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t12" title="Sensation">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Sensation Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Sensation Keywords"
                                            name="SensationDetailsKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.SensationDetailsKeyword === null ? '' : this.state.SensationDetailsKeyword} />
                                        <span className="error">{this.state.errors["SensationDetailsKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="SensationSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Sensation")}
                                        value={this.state.SensationSectionId === null ? '' : this.state.SensationSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()
                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisSensation}
                                            closeMenuOnSelect={false}
                                            cacheOptions={counterDiagnosisSensation}
                                            value={this.state.diagnosisSensationIds}
                                            loadOptions={this.loadSensationOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Sensation")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addSensation}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Sensation
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Sensation Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.SensationDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.sensationDetailsKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.sensationRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.sensationRubricDetailsId, item, "Sensation", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t13" title="Modalities">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Modalities Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Modalities Keywords"
                                            name="ModalitiesDetailsKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.ModalitiesDetailsKeyword === null ? '' : this.state.ModalitiesDetailsKeyword} />
                                        <span className="error">{this.state.errors["ModalitiesDetailsKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="ModalitiesSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Modalities")}
                                        value={this.state.ModalitiesSectionId === null ? '' : this.state.ModalitiesSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()
                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisModalities}
                                            cacheOptions={counterDiagnosisModalities}
                                            closeMenuOnSelect={false}
                                            value={this.state.diagnosisModalitiesIds}
                                            loadOptions={this.loadModalitiesOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Modalities")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addModalities}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Modalities
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Modalities Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.ModalitiesDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.modalitiesDetailsKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.modalitiesRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.modalitiesRubricDetailsId, item, "Modalities", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t14" title="Accompanied">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Accompanied Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Accompanied Keywords"
                                            name="AccompaniedDetailsSystem"
                                            onChange={this.handleChange}
                                            value={this.state.AccompaniedDetailsSystem === null ? '' : this.state.AccompaniedDetailsSystem} />
                                        <span className="error">{this.state.errors["AccompaniedDetailsSystem"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="AccompaniedSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Accompanied")}
                                        value={this.state.AccompaniedSectionId === null ? '' : this.state.AccompaniedSectionId}>

                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()
                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisAccompanied}
                                            cacheOptions={counterDiagnosisAccompanied}
                                            closeMenuOnSelect={false}
                                            value={this.state.diagnosisAccompaniedIds}
                                            loadOptions={this.loadAccompaniedOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Accompanied")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addAccompanied}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Accompanied
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Accompanied Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.AccompaniedDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.accompaniedDetailsSystem}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.accompaniedRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.accompaniedRubricDetailsId, item, "Accompanied", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t15" title="Observations">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Observations Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Observations Keywords"
                                            name="ObservationsDetailsKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.ObservationsDetailsKeyword === null ? '' : this.state.ObservationsDetailsKeyword} />
                                        <span className="error">{this.state.errors["ObservationsDetailsKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="ObservationsSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "Observations")}
                                        value={this.state.ObservationsSectionId === null ? '' : this.state.ObservationsSectionId}>
                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()
                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisObservations}
                                            cacheOptions={counterDiagnosisObservations}
                                            value={this.state.diagnosisObservationsIds}
                                            closeMenuOnSelect={false}
                                            loadOptions={this.loadObservationsOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "Observations")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addObservations}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Observations
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Observations Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.ObservationsDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.observationsDetailsKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.observationsRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.observationsRubricDetailsId, item, "Observations", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                        <Tab eventKey="t16" title="Before/After/During">

                            <Row>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor=""> Before/After/During Keywords
                                            <span className="required">*</span>
                                            :</Label>
                                        <Form.Control type="text"
                                            placeholder="Before/After/During Keywords"
                                            name="BeforeAfterDuringDetailsKeyword"
                                            onChange={this.handleChange}
                                            value={this.state.BeforeAfterDuringDetailsKeyword === null ? '' : this.state.BeforeAfterDuringDetailsKeyword} />
                                        <span className="error">{this.state.errors["BeforeAfterDuringDetailsKeyword"]}</span>
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="4">
                                    <Label className="label" htmlFor=""> Section
                                        <span className="required">*</span>
                                        :</Label>
                                    <Form.Control as="select"
                                        name="BeforeAfterDuringSectionId"
                                        onChange={this.handleChangeSubSection.bind(this, "BeforeAfterDuring")}
                                        value={this.state.BeforeAfterDuringSectionId === null ? '' : this.state.BeforeAfterDuringSectionId}>
                                        <option value="0">Select</option>
                                        {
                                            this.rendersectionList()
                                        }
                                    </Form.Control>
                                </Col>
                                <Col xs="12" md="4">
                                    <FormGroup >
                                        <Label className="label" htmlFor="">  Subsection
                                            <span className="required">*</span>  :</Label>
                                        <AsyncPaginate isClearable
                                            isMulti
                                            placeholder="Select one or more subsection"
                                            key={counterDiagnosisBeforeAfterDuring}
                                            cacheOptions={counterDiagnosisBeforeAfterDuring}
                                            value={this.state.diagnosisBeforeAfterDuringIds}
                                            closeMenuOnSelect={false}
                                            loadOptions={this.loadBeforeAfterDuringOptions.bind(this)}
                                            onChange={this.DiagnosisTabChanged.bind(this, "BeforeAfterDuring")}
                                        />
                                    </FormGroup>
                                </Col>
                                <Col xs="12" md="12" className="text-right">
                                    <FormGroup >
                                        <Button
                                            type="button"
                                            onClick={this.addBeforeAfterDuring}
                                            size="sm" color="primary">
                                            <i className="fa fa-plus"></i> Add Before/After/During
                                        </Button>
                                    </FormGroup>
                                </Col>
                            </Row>

                            <Table style={{ width: '100%' }} striped bordered hover>
                                <thead>
                                    <tr>
                                        <th>Before/After/During Keyword</th>
                                        <th>Subsection</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {this.state.BeforeAfterDuringDetails.map((item, parentindex) => {
                                        return (
                                            <tr key={parentindex}>
                                                <td>{item.beforeAfterDuringDetailsKeyword}</td>
                                                <td>
                                                    <Table>
                                                        {
                                                            item.beforeAfterDuringRubricDetails.map((Subsection, childindex) => {
                                                                return <tr key={childindex}>
                                                                    <td>{Subsection.subsectionName}</td>
                                                                    <td className='lcol'><Button style={{ marginLeft: 8 }} variant="danger" color="danger"
                                                                     onClick={() => this.Deleterubric(childindex, Subsection.beforeAfterDuringRubricDetailsId, item, "BeforeAfterDuring", parentindex)}>
                                                                        <i className="fa fa-trash"></i></Button></td>
                                                                </tr>
                                                            })
                                                        }
                                                    </Table>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </Table>

                        </Tab>
                    </Tabs>

                </CardBody>

            </Card>
        )
    }

    /**
     * will call when page rendered.
     */


    getDignosisSystem() {
        CommonServices.getData(`/DiagnosisSystem/GetDiagnosisSystem`).then((temp) => {
            console.log(temp);
            debugger;
            this.setState({
                diagnosisSystemList: temp,
            })
        });
    }

    /**
    * will call when page rendered.
    */
    async GetSections() {
        CommonServices.getData(`/mastersAPI/GetSections`).then((temp) => {
            console.log(temp);
            this.setState({
                sectionList: temp
            })
        })
    }
    SubsectionChanged(item) {
        if (item != null) {
            this.setState({
                SubSectionId: item.value,
                SubSectionName: item.label,
                selectedSubSection: item
            })
        }
        else {
            this.setState({
                SubSectionId: 0
            })
        }
        console.log('subSectionId ==== ', this.state.subSectionId)
    }
    /**
    * will call when page rendered.
    */

    addSelectedSubSectionQuestions() {
        debugger;
        if (this.state.selectedSubSection == "") {
            alert("Please select Sub Section");
        }
        else {
            var obj = {
                subSectionId: this.state.selectedSubSection.value,
                subsectionName: this.state.selectedSubSection.label,
            }
            this.state.SelectedSubSectionList.push(obj)
            this.setState({
                selectedSubSection: null,
                SectionId: 0
            });
        }
    }



    GetSubSections(sectionId, string) {
        CommonServices.getDataById(sectionId, `/subsection/GetSubSections`).then((temp) => {
            debugger
            console.log(temp);
            if (string === "Diagnosis") {
                this.setState({
                    subsectionList: temp
                })
            }
            else if (string === "Symptoms") {
                this.setState({
                    SymptomssubsectionList: temp
                })
            }
            else if (string === "Monogram") {
                this.setState({
                    MonogramsubsectionList: temp
                })
            }
            else if (string === "Causations") {

                this.setState({
                    CausationssubsectionList: temp
                })
            }
            else if (string === "Pathology") {
                this.setState({
                    PathologysubsectionList: temp
                })
            }
            else if (string === "Emergencies") {
                this.setState({
                    EmergenciessubsectionList: temp
                })
            }
            else if (string === "Onset") {
                this.setState({
                    OnsetsubsectionList: temp
                })
            }
            else if (string === "Patterns") {
                this.setState({
                    PatternssubsectionList: temp
                })
            }
            else if (string === "LocationExtention") {
                this.setState({
                    LocationExtentionsubsectionList: temp
                })
            }
            else if (string === "Sensation") {
                this.setState({
                    SensationsubsectionList: temp
                })
            }
            else if (string === "Modalities") {
                this.setState({
                    ModalitiessubsectionList: temp
                })
            }
            else if (string === "Accompanied") {
                this.setState({
                    AccompaniedsubsectionList: temp
                })
            }
            else if (string === "Observations") {
                this.setState({
                    ObservationssubsectionList: temp
                })
            }
            else if (string === "BeforeAfterDuring") {
                this.setState({
                    BeforeAfterDuringsubsectionList: temp
                })
            }
        })
    }

    /**
   * Created Date     :   19 Des 2019
   * purpose          :   Handling change event of all input fields
   * Author           :   
   */
    handleChangeSubSection(string, e) {
        this.setState({ [e.target.name]: e.target.value });
        this.GetSubSections(parseInt(e.target.value), string);
    }

    handleChange(event) {
        debugger
        this.setState({ [event.target.name]: event.target.value });
    }

    otherhandleChange(e) {
        this.setState({ [e.target.name]: e.target.value });
    }

    async addSymptoms() {
        debugger
        if (this.state.symptom == "") {
            alert("Please Enter symptomName");
        }
        else {
            var obj =
            {
                symptom: this.state.symptom,
                diagnosisSymptomRubric: []
            }
            this.state.models.push(obj);
            this.state.diagnosisSymptomsIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.models[this.state.models.length - 1].diagnosisSymptomRubric.push(obj)
            });
            this.setState({
                symptom: '',
                diagnosisSymptomsIds: [],
                SymptomsSectionId: 0
            });
        }

    }

    addMonogram() {
        debugger
        if (this.state.MonogramKeyword === "") {
            alert("Please Enter Diagnosis Monogram Keyword");
        }
        else {
            var obj =
            {
                diagnosisMonogramKeyword: this.state.MonogramKeyword,
                diagnosisMonogramRubricDetails: []
            }
            this.state.DiagnosisMonogramDetails.push(obj);
            this.state.diagnosisMonogramIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsections: element.value,
                    subsectionName: element.label,
                }
                this.state.DiagnosisMonogramDetails[this.state.DiagnosisMonogramDetails.length - 1].diagnosisMonogramRubricDetails.push(obj)
            });
            this.setState({
                MonogramKeyword: '',
                diagnosisMonogramIds: [],
                MonogramSectionId: 0
            });
        }

    }


    addCausations() {
        debugger
        if (this.state.CausationName === "") {
            alert("Please Enter Diagnosis Causation Name");
        }
        else {
            var obj =
            {
                causationName: this.state.CausationName,
                diagnosisCausationRubricDetails: []
            }
            this.state.DiagnosisCausationNameDetails.push(obj);
            this.state.diagnosisCausationsIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.DiagnosisCausationNameDetails[this.state.DiagnosisCausationNameDetails.length - 1].diagnosisCausationRubricDetails.push(obj)
            });
            this.setState({
                CausationName: '',
                diagnosisCausationsIds: [],
                CausationsSectionId: 0
            });
        }

    }


    addEmergencies() {
        debugger
        if (this.state.EmergenciesKeywords === "") {
            alert("Please Enter Diagnosis Emergencies Keywords");
        }
        else {
            var obj =
            {
                emergencieKeyword: this.state.EmergenciesKeywords,
                emergencieRubricDetails: []
            }
            this.state.EmergencieDetails.push(obj);
            this.state.diagnosisEmergenciesIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.EmergencieDetails[this.state.EmergencieDetails.length - 1].emergencieRubricDetails.push(obj)
            });
            this.setState({
                EmergencieKeyword: '',
                diagnosisEmergenciesIds: [],
                EmergenciesSectionId: 0
            });
        }

    }

    addModalities() {
        debugger
        if (this.state.ModalitiesDetailsKeyword === "") {
            alert("Please Enter Diagnosis Modalities Details Keyword");
        }
        else {
            var obj =
            {
                modalitiesDetailsKeyword: this.state.ModalitiesDetailsKeyword,
                modalitiesRubricDetails: []
            }
            this.state.ModalitiesDetails.push(obj);
            this.state.diagnosisModalitiesIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.ModalitiesDetails[this.state.ModalitiesDetails.length - 1].modalitiesRubricDetails.push(obj)
            });
            this.setState({
                ModalitiesDetailsKeyword: '',
                diagnosisModalitiesIds: [],
                ModalitiesSectionId: 0
            });
        }

    }

    addAccompanied() {
        debugger
        if (this.state.AccompaniedDetailsSystem === "") {
            alert("Please Enter Diagnosis Accompanied Details Keyword");
        }
        else {
            var obj =
            {
                accompaniedDetailsSystem: this.state.AccompaniedDetailsSystem,
                accompaniedRubricDetails: []
            }
            this.state.AccompaniedDetails.push(obj);
            this.state.diagnosisAccompaniedIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.AccompaniedDetails[this.state.AccompaniedDetails.length - 1].accompaniedRubricDetails.push(obj)
            });
            this.setState({
                AccompaniedDetailsSystem: '',
                diagnosisAccompaniedIds: [],
                AccompaniedSectionId: 0
            });
        }

    }

    addObservations() {
        debugger
        if (this.state.ObservationsDetailsKeyword === "") {
            alert("Please Enter Diagnosis Observations Details Keyword");
        }
        else {
            var obj =
            {
                observationsDetailsKeyword: this.state.ObservationsDetailsKeyword,
                observationsRubricDetails: []
            }
            this.state.ObservationsDetails.push(obj);
            this.state.diagnosisObservationsIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsection: element.value,
                    subsectionName: element.label,
                }
                this.state.ObservationsDetails[this.state.ObservationsDetails.length - 1].observationsRubricDetails.push(obj)
            });
            this.setState({
                ObservationsDetailsKeyword: '',
                diagnosisObservationsIds: [],
                ObservationsSectionId: 0
            });
        }

    }

    addBeforeAfterDuring() {
        debugger
        if (this.state.BeforeAfterDuringDetailsKeyword === "") {
            alert("Please Enter Diagnosis Before/After/During/ Details Keyword");
        }
        else {
            var obj =
            {
                beforeAfterDuringDetailsKeyword: this.state.BeforeAfterDuringDetailsKeyword,
                beforeAfterDuringRubricDetails: []
            }
            this.state.BeforeAfterDuringDetails.push(obj);
            this.state.diagnosisBeforeAfterDuringIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.BeforeAfterDuringDetails[this.state.BeforeAfterDuringDetails.length - 1].beforeAfterDuringRubricDetails.push(obj)
            });
            this.setState({
                BeforeAfterDuringDetailsKeyword: '',
                diagnosisBeforeAfterDuringIds: [],
                BeforeAfterDuringSectionId: 0
            });
        }

    }

    addPatterns() {
        debugger
        if (this.state.PatternsKeywords === "") {
            alert("Please Enter Diagnosis Patterns Keywords");
        }
        else {
            var obj =
            {
                patternsKeywords: this.state.PatternsKeywords,
                patternRubricDetails: []
            }
            this.state.PatternsDetail.push(obj);
            this.state.diagnosisPatternsIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    SubsectionID: element.value,
                    subsectionName: element.label,
                }
                this.state.PatternsDetail[this.state.PatternsDetail.length - 1].patternRubricDetails.push(obj)
            });
            this.setState({
                PatternsKeywords: '',
                diagnosisPatternsIds: [],
                PatternsSectionId: 0
            });
        }

    }

    addLocationExtention() {
        debugger
        if (this.state.LocationExtentionDetailsKeyword === "") {
            alert("Please Enter Diagnosis Location/Extention Details Keyword");
        }
        else {
            var obj =
            {
                locationExtentionDetailsKeyword: this.state.LocationExtentionDetailsKeyword,
                locationExtentionRubricDetails: []
            }
            this.state.LocationExtentionDetails.push(obj);
            this.state.diagnosisLocationExtentionIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.LocationExtentionDetails[this.state.LocationExtentionDetails.length - 1].locationExtentionRubricDetails.push(obj)
            });
            this.setState({
                LocationExtentionDetailsKeyword: '',
                diagnosisLocationExtentionIds: [],
                LocationExtentionSectionId: 0
            });
        }

    }

    addSensation() {
        debugger
        if (this.state.SensationDetailsKeyword === "") {
            alert("Please Enter Diagnosis Sensation Details Keyword");
        }
        else {
            var obj =
            {
                sensationDetailsKeyword: this.state.SensationDetailsKeyword,
                sensationRubricDetails: []
            }
            this.state.SensationDetails.push(obj);
            this.state.diagnosisSensationIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.SensationDetails[this.state.SensationDetails.length - 1].sensationRubricDetails.push(obj)
            });
            this.setState({
                SensationDetailsKeyword: '',
                diagnosisSensationIds: [],
                SensationSectionId: 0
            });
        }

    }

    addOnset() {
        debugger
        if (this.state.onsetKeyword === "") {
            alert("Please Enter Diagnosis Onset Keyword");
        }
        else {
            var obj =
            {
                onsetKeyword: this.state.onsetKeyword,
                onsetDurationProgressRubricDetails: []
            }
            this.state.OnsetDurationProgressDetails.push(obj);
            this.state.diagnosisOnsetIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.OnsetDurationProgressDetails[this.state.OnsetDurationProgressDetails.length - 1].onsetDurationProgressRubricDetails.push(obj)
            });
            this.setState({
                onsetKeyword: '',
                diagnosisOnsetIds: [],
                OnsetSectionId: 0
            });
        }

    }

    addPathology() {
        debugger
        if (this.state.diagnosisPathologyKeyword === "") {
            alert("Please Enter Diagnosis Pathology Keywords");
        }
        else {
            var obj =
            {
                diagnosisPathologyKeyword: this.state.diagnosisPathologyKeyword,
                diagnosisPathologyRubricDetails: []
            }
            this.state.DiagnosisPathologyDetails.push(obj);
            this.state.diagnosisPathologyIds.forEach(element => {
                console.log("printed====>>>>", element)
                let obj = {
                    subsectionId: element.value,
                    subsectionName: element.label,
                }
                this.state.DiagnosisPathologyDetails[this.state.DiagnosisPathologyDetails.length - 1].diagnosisPathologyRubricDetails.push(obj)
            });
            this.setState({
                PathologyKeywords: '',
                diagnosisPathologyIds: [],
                PathologySectionId: 0
            });
        }

    }

    deleteSubsSection = (index) => {
        var array = [...this.state.SelectedSubSectionList]; // make a separate copy of the array

        if (index !== -1) {
            array.splice(index, 1);
            this.setState({ SelectedSubSectionList: array });
        }
    }

    loadOptions = (search, prevOptions) => {

        const options = [];
        var subsectionList = this.state.subsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadSymptomsOptions = (search, prevOptions) => {
        const options = [];
        var subsectionList = this.state.SymptomssubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadMonogramOptions = (search, prevOptions) => {

        const options = [];
        var subsectionList = this.state.MonogramsubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadCausationsOptions = (search, prevOptions) => {

        const options = [];
        var subsectionList = this.state.CausationssubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadPathologyOptions = (search, prevOptions) => {

        const options = [];
        var subsectionList = this.state.PathologysubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadEmergenciesOptions = (search, prevOptions) => {

        const options = [];
        var subsectionList = this.state.EmergenciessubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadOnsetOptions = (search, prevOptions) => {

        const options = [];
        var subsectionList = this.state.OnsetsubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadPatternsOptions = (search, prevOptions) => {
        const options = [];
        var subsectionList = this.state.PatternssubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadLocationExtentionOptions = (search, prevOptions) => {
        const options = [];
        var subsectionList = this.state.LocationExtentionsubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadSensationOptions = (search, prevOptions) => {
        const options = [];
        var subsectionList = this.state.SensationsubsectionList;
        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
        let filteredOptions;
        if (!search) {
            filteredOptions = options;
        }
        else {
            const searchLower = search.toLowerCase();
            filteredOptions = options.filter(({ label }) =>
                label.toLowerCase().includes(searchLower)
            );
        }
        const hasMore = filteredOptions.length > prevOptions.length + 10;
        const slicedOptions = filteredOptions.slice(
            prevOptions.length,
            prevOptions.length + 10
        );
        return {
            options: slicedOptions,
            hasMore
        };
    }

    loadModalitiesOptions = (search, prevOptions) => {
        if (this.state.ModalitiessubsectionList.length !== 0) {
            console.log('success')
            const options = [];
            // var subsectionList =  this.state.ModalitiessubsectionList;
            this.state.ModalitiessubsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
            let filteredOptions;
            if (!search) {
                filteredOptions = options;
            }
            else {
                const searchLower = search.toLowerCase();
                filteredOptions = options.filter(({ label }) =>
                    label.toLowerCase().includes(searchLower)
                );
            }
            const hasMore = filteredOptions.length > prevOptions.length + 10;
            const slicedOptions = filteredOptions.slice(
                prevOptions.length,
                prevOptions.length + 10
            );
            return {
                options: slicedOptions,
                hasMore
            };
        }
        else {
            const options = [];
            console.log('emplty==', options)


        }

    }

    loadAccompaniedOptions = (search, prevOptions) => {
        if (this.state.AccompaniedsubsectionList.length !== 0) {
            console.log('success')
            const options = [];
            // var subsectionList =  this.state.ModalitiessubsectionList;
            this.state.AccompaniedsubsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
            let filteredOptions;
            if (!search) {
                filteredOptions = options;
            }
            else {
                const searchLower = search.toLowerCase();
                filteredOptions = options.filter(({ label }) =>
                    label.toLowerCase().includes(searchLower)
                );
            }
            const hasMore = filteredOptions.length > prevOptions.length + 10;
            const slicedOptions = filteredOptions.slice(
                prevOptions.length,
                prevOptions.length + 10
            );
            return {
                options: slicedOptions,
                hasMore
            };
        }
        else {
            const options = [];
            console.log('emplty==', options)


        }

    }

    loadObservationsOptions = (search, prevOptions) => {
        if (this.state.ObservationssubsectionList.length !== 0) {
            console.log('success')
            const options = [];
            // var subsectionList =  this.state.ModalitiessubsectionList;
            this.state.ObservationssubsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
            let filteredOptions;
            if (!search) {
                filteredOptions = options;
            }
            else {
                const searchLower = search.toLowerCase();
                filteredOptions = options.filter(({ label }) =>
                    label.toLowerCase().includes(searchLower)
                );
            }
            const hasMore = filteredOptions.length > prevOptions.length + 10;
            const slicedOptions = filteredOptions.slice(
                prevOptions.length,
                prevOptions.length + 10
            );
            return {
                options: slicedOptions,
                hasMore
            };
        }
        else {
            const options = [];
            console.log('emplty==', options)


        }

    }

    loadBeforeAfterDuringOptions = (search, prevOptions) => {
        if (this.state.BeforeAfterDuringsubsectionList.length !== 0) {
            console.log('success')
            const options = [];
            // var subsectionList =  this.state.ModalitiessubsectionList;
            this.state.BeforeAfterDuringsubsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
            let filteredOptions;
            if (!search) {
                filteredOptions = options;
            }
            else {
                const searchLower = search.toLowerCase();
                filteredOptions = options.filter(({ label }) =>
                    label.toLowerCase().includes(searchLower)
                );
            }
            const hasMore = filteredOptions.length > prevOptions.length + 10;
            const slicedOptions = filteredOptions.slice(
                prevOptions.length,
                prevOptions.length + 10
            );
            return {
                options: slicedOptions,
                hasMore
            };
        }
        else {
            const options = [];
            console.log('emplty==', options)


        }

    }

    SubSectionhandleChange(e) {
        console.log("Tufan__------------", e.target)
        this.setState({ [e.target.name]: e.target.value })
    }

    DiagnosisGrouphandleChange(e) {
        this.setState({ [e.target.name]: e.target.value })
    }

    validateForm() {
        debugger
        let fields = this.state;

        let errors = {};
        let isFormValid = true;
        debugger
        if (fields.DiagnosisName == "") {
            isFormValid = false;
            errors["DiagnosisName"] = "Please enter diagnosis name"
        }

        // if (fields.SectionId == "") {
        //     isFormValid = false;
        //     errors["SectionId"] = "Please select section name"
        // }
        // if (fields.SubSectionId == "") {
        //     isFormValid = false;
        //     errors["SubSectionId"] = "Please select sub section name"
        // }
        // if (fields.symptom == "") {
        //     isFormValid = false;
        //     errors["symptom"] = "Please enter symptom name"
        // }
        // if (fields.monogramId == "") {
        //     isFormValid = false;
        //     errors["monogramId"] = "Please select Monogram id"
        // }

        this.setState({ errors });
        return isFormValid;
    }


    /**
     * Created  Date    :   19 Dec 2019
     * Purpose          :   Submit Form for adding new diagnosis sroup
     * Author           :   
     */
    submitForm() {
        debugger;
        console.log('diagnosisSystemIds submit==', this.state.diagnosisSystemIds)
        this.state.diagnosisSystemIds.forEach(element => {
            let obj = {
                "diagnosisSystemId": element.value,
                diagnosisId: element.diagnosisId,
                diagnosisSystemDetailId: element.diagnosisSystemDetailId
            }
            this.state.diagnosisSystemDetailsList.push(obj)
        });
        console.log('diagnosisSystemDetailsList submit==', this.state.diagnosisSystemDetailsList)

        if (this.validateForm()) {
            var item = {
                "diagnosisId": this.state.diagnosisId,
                "diagnosisName": this.state.DiagnosisName,
                "diagnosisNameAlias": this.state.DiagnosisNameAlias,
                "miasm": this.state.Miasm,
                "enteredBy": parseInt(localStorage.getItem('UserId')),
                "deleteStatus": false,
                "investigations": this.state.investigations,
                "allopathicMedicines": this.state.allopathicMedicines,
                "examiniations": this.state.examiniations,
                modelEx: this.state.modelEx,
                diagnosisSymptomsList: this.state.models,
                diagnosisCausationList: this.state.DiagnosisCausationNameDetails,
                diagnosisSystemDetailsList: this.state.diagnosisSystemDetailsList,
                emergencieDetailsModelList: this.state.EmergencieDetails,
                onsetDurationProgressDetails: this.state.OnsetDurationProgressDetails,
                patternsDetails: this.state.PatternsDetail,
                locationExtentionDetailsModelList: this.state.LocationExtentionDetails,
                sensationDetailsModelList: this.state.SensationDetails,
                modalitiesDetailsModelsList: this.state.ModalitiesDetails,
                accompaniedDetailsModelsList: this.state.AccompaniedDetails,
                observationsDetailsModelsList: this.state.ObservationsDetails,
                beforeAfterDuringDetailsModelsList: this.state.BeforeAfterDuringDetails,
                diagnosisMonogramDetailsModelsList: this.state.DiagnosisMonogramDetails,
                diagnosisPathologyDetailsModelsList: this.state.DiagnosisPathologyDetails,
            }

            debugger;
            console.log('SelectedSubSectionList==', this.state.SelectedSubSectionList)
            this.state.SelectedSubSectionList.forEach(element => {
                let obj = {
                    subSectionId: element.subSectionId,
                    diagnosisDetailId: element.diagnosisDetailId
                }
                this.state.modelEx.push(obj)
            });


            debugger
            console.log('item==', item)
            CommonServices.postData(item, `/diagnosis`).then((responseMessage) => {
                debugger
                alert(responseMessage.data);
                // this.props.enqueueSnackbarAction();
                this.props.history.push('/ListDiagnosis');
                console.log("a", responseMessage.data)
            })
            this.setState({

                diagnosisId: 0,
                DiagnosisName: '',
                DiagnosisNameAlias: '',
                Description: '',
                Keywords: '',
                DiagnosisGroupId: '',
                SectionId: '',
                SubSectionId: '',
                EnteredBy: 'Admin',
                DeleteStatus: false
            });
        }
        else {
            alert("Required fields are missing. Please check All Tabs")
        }
    }
}

export default EditDiagnosisComponent
