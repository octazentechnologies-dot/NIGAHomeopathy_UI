import React, { Component } from 'react';
import { Table, Col, FormGroup, Form, Row } from 'react-bootstrap';
import { Button, Card, CardBody, CardFooter, CardHeader, } from 'reactstrap';
import { Input, Label } from 'reactstrap';
import Select from "react-select";
import AsyncPaginate from "react-select-async-paginate";
import './ClinicalQuestions.css';
import DragSortableList from 'react-drag-sortable';
import CommonServices from '../../Services/CommonServices';
import '../../components/CommanStyle.css';
import { reject, result } from 'lodash';

/**
 * Created Date     :   07-01-2020.
 * Purpose          :   Class us used to display and edit existing clinical questions.
 * Author           :   Chandrashekhar Salagar.
 */
export class EditClinicalQuestionsComponent extends Component {
    /**
    * Constructor to initialize class members.
    * @param {*} props 
    */
    constructor(props) {
        super(props);
        this.state = {
            QuestionsId: 0,
            QuestionGroupId: 0,
            QuestionGroupIdNew: 0,
            questionSectionId: 0,
            questionSubgroupId: 0,
            Question: '',
            Description: '',
            EnteredBy: '',
            SeqNo: 0,
            Questions: [

            ],
            QuestionGroup: [

            ],
            clinicalQuestionBodyPartList: [],
            optionList: [],
            optionList1: [],
            optionList2: [],
            optionList3: [],
            selectedOptions: '',
            selectedOptions1: '',
            selectedOptions2: '',
            selectedOptions3: '',
            SelectedGuestionsectionId: 0,
            SelectedQuestionGroupId: 0,
            subQuestionGroupId: 0,
            copyOfSelectedSubQuestionGroup: '',
            SectionIdForBodyPart: 0,
            SubSectionId: 0,
            SectionModel: [],
            SubSectionModel: [],
            SectionId: 0,
            selectedSubSection: null,
            isEditButtonClicked: false,
            sendArrayToApi: {},
            sendClinicalQuestionBodyPartId: 0
        };
        this.handleChange = this.handleChange.bind(this);
    }

    /**
     * React's render mwthod extended from React Component
     */
    render() {
        const SectionList = this.state.SectionModel;
        const counter = this.state.SectionId;
        console.log('this.state.selectedOptions1 == ', this.state.selectedOptions1)
        return (
            <Card>
                <CardHeader>
                    <i className="fa fa-align-justify"></i>
                    Edit Clinical Question
                </CardHeader>

                <CardBody>
                    <Form encType="multipart/form-data" className="form-horizontal">
                        <Row>

                            <Col xs="12" md="4">
                                <Label className="label" htmlFor="">Existance Name
                                    <span className="required">*</span> :</Label>
                                <Select
                                    isDisabled={true}
                                    options={this.state.optionList}
                                    placeholder="Select Existance Name"
                                    name="SelectExistanceName"
                                    value={this.state.selectedOptions}
                                    onChange={(item) => this.handleSelect(item)}
                                    isSearchable={true} />
                            </Col>


                            <Col xs="12" md="4">
                                <Label className="label" htmlFor="">Question Group
                                    <span className="required">*</span> :</Label>
                                <Select
                                    isDisabled={true}
                                    options={this.state.optionList3}
                                    placeholder="Select Question Group :"
                                    value={this.state.selectedOptions3}
                                    onChange={(item) => this.handleSelectedQuestionGroup(item)}
                                    isSearchable={true}
                                />
                            </Col>

                            <Col xs="12" md="4">
                                <Label className="label" htmlFor="">Sub Question Group Name
                                    <span className="required">*</span> :</Label>
                                <Select
                                    isDisabled={true}
                                    options={this.state.optionList1}
                                    placeholder="Select Sub Question Group Name :"
                                    value={this.state.selectedOptions1}
                                    onChange={(item) => this.handleSelectSubGroup(item)}
                                    isSearchable={true}
                                />
                            </Col>

                        </Row>

                        {this.state.selectedOptions1?.label?.toLowerCase() === 'location' && <Row className="mt-2">
                            <Col xs="12" md="4">
                                <Label className="label" htmlFor="">
                                    Select Section
                                    <span className="required">*</span> :</Label>
                                <Input
                                    type="select"
                                    name="SectionIdForBodyPart"
                                    value={this.state.SectionIdForBodyPart}
                                    onChange={this.handleSetionChange.bind(this)} >
                                    <option value="0">Select Section</option>
                                    {
                                        SectionList != undefined ?
                                            SectionList.map((section, index) => {
                                                return <option key={index} value={section.sectionId}>{section.sectionName}</option>
                                            }) : null
                                    }
                                </Input>
                            </Col>

                            <Col xs="12" md="8">
                                <Label className="label" htmlFor="">Body Part Name
                                    <span className="required">*</span> :</Label>

                                <Select
                                    options={this.state.optionList2}
                                    placeholder="Select Body Part Name :"
                                    value={this.state.selectedOptions2}
                                    onChange={(item) => this.handlebodypart(item)}
                                    isSearchable={true}
                                    isMulti={false} />
                            </Col>
                        </Row>}

                        {this.state.selectedOptions1?.label?.toLowerCase() !== 'location' && <Row className="mt-2">
                            <Col xs="12" md="12">
                                <FormGroup >
                                    <Label className="label" htmlFor="">Question
                                        <span className="required">*</span> :</Label>
                                    <Form.Control type="text" placeholder="Question"
                                        name="Question"
                                        onChange={this.handleChange}
                                        value={this.state.Question === null ? '' : this.state.Question} />
                                </FormGroup>
                            </Col>
                        </Row>}


                        <Row>
                            <Col xs="12" md="3">
                                <Label className="label" htmlFor="">
                                    Select Section
                                    <span className="required">*</span> :</Label>
                                <Input
                                    type="select"
                                    name="SectionId"
                                    value={this.state.SectionId}
                                    onChange={this.handleSetionChange.bind(this)} >
                                    <option value="0">Select Section</option>
                                    {
                                        SectionList != undefined ?
                                            SectionList.map((section, index) => {
                                                return <option key={index} value={section.sectionId}>{section.sectionName}</option>
                                            }) : null
                                    }
                                </Input>
                            </Col>

                            <Col xs="12" md="7">
                                <Label className="label" htmlFor="">
                                    Select Sub Section
                                    <span className="required">*</span> :</Label>

                                <AsyncPaginate style={{ width: '80px' }}
                                    isClearable
                                    key={counter}
                                    cacheOptions={counter}
                                    labelKey="value"
                                    labelValue="subSectionId"
                                    isMulti={true}
                                    closeMenuOnSelect={false}
                                    placeholder="Type Sub-Section"
                                    value={this.state.selectedSubSection}
                                    loadOptions={this.loadOptions.bind(this)}
                                    onChange={(item) => this.SubsectionChanged(item)}
                                />
                            </Col>

                            <Col xs="12" md="2">
                                <FormGroup >
                                    <Button
                                        type="button"
                                        onClick={() => this.addMoreOrUpdateSubSections()}
                                        style={{ marginTop: 32 }}
                                        size="sm" color="primary">
                                        <i className="fa fa-plus"></i> {this.state.isEditButtonClicked ? `Edit Sub Section` : `Add Sub Section`}
                                    </Button>
                                </FormGroup>
                            </Col>
                        </Row>


                        <Table style={{ width: '100%' }} striped bordered hover className="mt-3">
                            <thead>
                                <tr>
                                    {/* <th className='fcol'>Sr.No</th> */}
                                    <th>Question</th>
                                    <th colSpan={2}>Sub Section Name</th>
                                    {/* <th className='lcol'>Action</th> */}
                                </tr>
                            </thead>
                            {this.state.clinicalQuestionBodyPartList.length > 0 ?
                                <tbody>
                                    {this.state.clinicalQuestionBodyPartList.map((item, parentIndex) => {
                                        return <tr>
                                            <td>{this.state.selectedOptions1?.label?.toLowerCase() === 'location' ? item.bodyPartName : item.keywordQuestion}</td>
                                            <td><Button style={{ marginLeft: 8 }} color="primary"
                                                disabled={this.state.isEditButtonClicked ? true : false}
                                                onClick={async () => {
                                                    debugger;
                                                    this.setState({ isEditButtonClicked: true });
                                                    console.log('item = ', item);
                                                    new Promise((resolve, reject) => {
                                                        this.getBodyPart(item.sectionId, resolve)
                                                    }).then((result) => {
                                                        console.log('result==', result)
                                                        this.setForEdit(item)
                                                    })

                                                    /* ß */

                                                }} ><i className="fa fa-pencil"></i></Button></td>
                                            <Table>
                                                {item.clinicalRubricViewList.map((rubricItem, childIndex) => {
                                                    return <tr>
                                                        <td>{rubricItem.subsectionName}</td>
                                                        <td className='lcol'>
                                                            <Button style={{ marginLeft: 8 }} variant="danger" color="danger" onClick={() => this.deleteSubsSection(parentIndex, childIndex)}  ><i className="fa fa-trash"></i></Button>
                                                        </td>
                                                    </tr>
                                                })
                                                }
                                            </Table>
                                        </tr>
                                    })}
                                </tbody> :
                                <tbody>

                                </tbody>
                            }
                        </Table>
                    </Form>

                </CardBody>

                <CardFooter>
                    <Row>

                        <Col xs="12" md="6">
                            <Button
                                type="button"
                                style={{ textTransform: "uppercase" }}
                                onClick={this.handleSave.bind(this)}
                                disabled={this.state.isEditButtonClicked ? true : false}
                                size="sm" color="primary">
                                <i className="fa fa-save"></i> Update
                            </Button> &nbsp;
                            <Button
                                type="reset"
                                style={{ textTransform: "uppercase" }}
                                onClick={() => this.props.history.push('/ListClinicalQuestions')}
                                size="sm" color="danger">
                                <i className="fa fa-ban"></i> Cancel
                            </Button>
                        </Col>
                        <Col xs="12" md="6" style={{ textAlign: "right" }}>
                            <Label style={{ fontSize: 15, margin: 0, paddingTop: 5 }}> Fields marked with an asterisk <span className="required">*</span> are mandatory</Label>
                        </Col>
                    </Row>
                </CardFooter>
            </Card>
        )
    }

    /**
    * React component did mount, will execute only once per page load.
    */
    componentDidMount() {

        var Id = this.props.match.params.id;
        this.GetAllSections();
        this.getQuestionSection();
        this.getQuestionGroup();
        this.getSections();
        /* this.getBodyPart(); */
        this.setState({
            QuestionGroupId: Id
        });
        /*  this.getClinicalQuestions(Id); */
        this.getClinicalQuestionBodyPartDataById(this.props.match.params.id, this.props.match.params.QBType);

    }

    setForEdit(selectedItem) {
        var options = [];
        console.log('setForEdit', this.state.selectedOptions1);
        console.log('selectedItem.bodyPartId', selectedItem.bodyPartId);
        console.log('this.state.optionList2 = ', this.state.optionList2);

        if (this.state.selectedOptions1?.label?.toLowerCase() === 'location') {
            var bodyPart = this.state.optionList2.filter((item) => item.value === selectedItem.bodyPartId);
            console.log('bodyPart == ', bodyPart)
            this.setState({
                selectedOptions2: bodyPart[0],
                SectionId: selectedItem.sectionId,
                SectionIdForBodyPart: selectedItem.sectionId,
            })
        } else {
            this.setState({
                Question: selectedItem.keywordQuestion,
                SectionId: selectedItem.sectionId,
            })
        }
        selectedItem.clinicalRubricViewList.map(x => options.push({ value: x.subsectionID, label: x.subsectionName }));
        this.setState({ selectedSubSection: options });
        // const updatedList = this.state.clinicalQuestionBodyPartList.filter(item => item.questionsBodyPartName !== selectedItem.questionsBodyPartName);
        //this.setState({ clinicalQuestionBodyPartList: updatedList })

    }

    // Used this method to add other subsection in table if user want to add///////////
    async addMoreOrUpdateSubSections() {
        debugger;
        var rubic = [];
        var finalRubric = [];
        var displayList = [];
        let foundIndex;
        console.log('Question == ', this.state.Question);
        console.log('this.state.selectedOptions2 == ', this.state.selectedOptions2);
        this.setState({ isEditButtonClicked: false });
        if (this.state.selectedOptions1?.label?.toLowerCase() === 'location') {
            foundIndex = this.state.clinicalQuestionBodyPartList.findIndex(obj => obj.bodyPartName.includes(this.state.selectedOptions2.label));
        } else {
            foundIndex = this.state.clinicalQuestionBodyPartList.findIndex(obj => obj.keywordQuestion.includes(this.state.Question));
        }



        //console.log('found == ', JSON.stringify(this.state.clinicalQuestionBodyPartList));
        // console.log('this.state.SectionIdForBodyPart == ', JSON.stringify(this.state.SectionIdForBodyPart));
        // console.log('this.state.selectedSubSection == ', JSON.stringify(this.state.selectedSubSection));
        // console.log('this.state.selectedOptions2 == ', this.state.selectedOptions2);
        if (foundIndex !== -1) {

            new Promise((resolve, reject) => {
                this.state.selectedSubSection.map((item, index) => {
                    debugger;
                    let subSectionObject = this.state.clinicalQuestionBodyPartList[foundIndex].clinicalRubricViewList.find(obj => obj.subsectionName === item.label);

                    let bodyPartId = this.state.selectedOptions1?.label?.toLowerCase() !== 'location' ?
                        this.state.clinicalQuestionBodyPartList[foundIndex].clinicalQueKeywordId :
                        this.state.clinicalQuestionBodyPartList[foundIndex].clinicalQuestionBodyPartId

                    if (subSectionObject) {
                        console.log('found')
                    } else {
                        console.log('not found')
                        if (this.state.selectedOptions1?.label?.toLowerCase() !== 'location') {
                            rubic.push({
                                "clinicalRubricID": 0,
                                "subsectionID": item.value,
                                "subsectionName": item.label,
                            });
                            finalRubric.push({
                                "subsectionID": item.value,
                                "clinicalQuestionBodyPartID": 0,
                                "clinicalQuestionRubricID": 0
                            })
                            index === this.state.selectedSubSection.length - 1 && resolve(true)
                        } else {
                            rubic.push({
                                "clinicalRubricID": 0,
                                "subsectionID": item.value,
                                "subsectionName": item.label,
                            })
                            finalRubric.push({
                                "subsectionID": item.value,
                                "clinicalQuestionBodyPartID": 0,
                                "clinicalQuestionRubricID": 0
                            })
                            index === this.state.selectedSubSection.length - 1 && resolve(true)
                        }
                    }
                })

            }).then((result) => {
                debugger
                if (result) {
                    console.log('rubric', JSON.stringify(rubic));
                    console.log('before', JSON.stringify(this.state.clinicalQuestionBodyPartList[foundIndex].clinicalRubricViewList));
                    //this.state.clinicalQuestionBodyPartList[foundIndex].clinicalRubricViewList.push(...rubic)
                    const updatedArray = [...this.state.clinicalQuestionBodyPartList];
                    updatedArray[foundIndex].clinicalRubricViewList.push(...rubic);

                    if (this.state.selectedOptions1?.label?.toLowerCase() === 'location') {
                        console.log(this.state.sendArrayToApi.clinicalBodyPartList[foundIndex].clinicalBodyPartRubricList)
                        this.state.sendArrayToApi.clinicalBodyPartList[foundIndex].clinicalBodyPartRubricList.push(...finalRubric);
                    } else {
                        console.log(this.state.sendArrayToApi.clinicalQuestionList[foundIndex].clinicalBodyPartRubricList)
                        this.state.sendArrayToApi.clinicalQuestionList[foundIndex].clinicalQuestionRubricList.push(...finalRubric)
                    }
                    this.setState({
                        clinicalQuestionBodyPartList: updatedArray,
                        sendArrayToApi: this.state.sendArrayToApi
                    });

                    console.log('after', JSON.stringify(this.state.clinicalQuestionBodyPartList[foundIndex].clinicalRubricViewList));
                    this.setState({
                        selectedOptions2: null,
                        SectionId: 0,
                        SectionIdForBodyPart: 0,
                        selectedSubSection: null,
                        Question: ''
                    })
                }

            })

        } else {
            new Promise((resolve, reject) => {
                console.log('this.state.selectedSubSection == ', this.state.selectedSubSection.length)
                this.state.selectedSubSection.map((item, index) => {
                    if (this.state.selectedOptions1?.label?.toLowerCase() !== 'location') {
                        rubic.push({
                            "clinicalRubricID": 0,
                            "subsectionID": item.value,
                            "subsectionName": item.label,
                        })
                        finalRubric.push({
                            "subsectionID": item.value,
                            "clinicalQuestionBodyPartID": 0,
                            "clinicalQuestionRubricID": 0
                        })
                        index === this.state.selectedSubSection.length - 1 && resolve(true)
                    } else {
                        rubic.push({
                            "clinicalRubricID": 0,
                            "subsectionID": item.value,
                            "subsectionName": item.label,
                        })
                        finalRubric.push({
                            "subsectionID": item.value,
                            "clinicalQuestionBodyPartID": 0,
                            "clinicalQuestionRubricID": 0
                        })
                        index === this.state.selectedSubSection.length - 1 && resolve(true)
                    }

                })
            }).then((result) => {
                debugger
                // console.log('rubic = ', JSON.stringify(rubic))
                // console.log('result = ', result)
                // console.log('this.state.selectedOptions2.value == ', this.state.selectedOptions2)
                if (result) {
                    let newObject = {
                        "questionsBodyPartId": 0,
                        "questionsBodyPartName": null,
                        "sectionId": parseInt(this.state.SectionId),
                        "bodyPartId": parseInt(this.state.selectedOptions2.value),
                        "qbType": null,
                        "clinicalQueKeywordId": 0,
                        "keywordQuestion": this.state.selectedOptions1?.label?.toLowerCase() !== 'location' ? this.state.Question : null,
                        "bodyPartName": this.state.selectedOptions1?.label?.toLowerCase() === 'location' ? this.state.selectedOptions2.label : null,
                        "clinicalQuestionBodyPartId": null,
                        "clinicalRubricViewList": rubic
                    }
                    this.state.clinicalQuestionBodyPartList.push(newObject);


                    if (this.state.selectedOptions1?.label?.toLowerCase() === 'location') {
                        var finalObject = {
                            "clinicalQuestionBodyPartID": 0,
                            "questionID": this.props.match.params.id,
                            "bodypartID": this.state.selectedOptions2?.value,
                            "clinicalBodyPartRubricList": finalRubric
                        }
                        this.state.sendArrayToApi.clinicalBodyPartList.push(finalObject)
                    } else {
                        var finalObject = {
                            "clinicalQuestionKeywordID": 0,
                            "questionID": this.props.match.params.id,
                            "keyWords": this.state.Question,
                            "clinicalQuestionRubricList": finalRubric
                        }
                        this.state.sendArrayToApi.clinicalQuestionList.push(finalObject)
                    }


                    this.setState({
                        //selectedOptions2: null,
                        SectionId: 0,
                        // SectionIdForBodyPart: 0,
                        selectedSubSection: null,
                        Question: ''
                    })
                }
            })
        }

    }

    deleteSubsSection = (parentIndex, childIndex) => {
        debugger;
        console.log('parentIndex', parentIndex);
        console.log('childIndex', childIndex)
        console.log('this.state.sendArrayToApi === ', JSON.stringify(this.state.sendArrayToApi))
        if (this.state.copyOfSelectedSubQuestionGroup?.toLowerCase() !== 'location') {

            var array = [...this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList]; // make a separate copy of the array
            var finalArray = [...this.state.sendArrayToApi.clinicalQuestionList[parentIndex].clinicalQuestionRubricList]

            if (childIndex !== -1) {
                if (childIndex === 0 && this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList.length === 1) {
                    this.deleteSingleRubricFormTable(this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList[childIndex].clinicalQuestionRubricID, this.state.clinicalQuestionBodyPartList[parentIndex].clinicalQueKeywordId, this.props.match.params.QBType);
                    this.deleteSingleRubricFormTable(0, this.state.clinicalQuestionBodyPartList[parentIndex].clinicalQueKeywordId, this.props.match.params.QBType);
                    array.splice(childIndex, 1);
                    finalArray.splice(childIndex, 1);
                    this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList = array
                    this.state.sendArrayToApi.clinicalQuestionList[parentIndex].clinicalQuestionRubricList = finalArray
                    var tempArray = [...this.state.clinicalQuestionBodyPartList];
                    var finalTempArray = [...this.state.sendArrayToApi.clinicalQuestionList]
                    tempArray.splice(parentIndex, 1);
                    finalTempArray.splice(parentIndex, 1);
                    this.state.sendArrayToApi.clinicalQuestionList = finalTempArray;
                    this.setState({ sendArrayToApi: this.state.sendArrayToApi });
                    this.setState({ clinicalQuestionBodyPartList: tempArray });
                } else {
                    this.deleteSingleRubricFormTable(this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList[childIndex].clinicalQuestionRubricID, 0, this.props.match.params.QBType);
                    array.splice(childIndex, 1);
                    finalArray.splice(childIndex, 1);
                    this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList = array
                    this.state.sendArrayToApi.clinicalQuestionList[parentIndex].clinicalQuestionRubricList = finalArray
                    this.setState({ clinicalQuestionBodyPartList: this.state.clinicalQuestionBodyPartList });
                    this.setState({ sendArrayToApi: this.state.sendArrayToApi });


                }

            }
        } else {

            var array = [...this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList]; // make a separate copy of the array
            var finalArray = [...this.state.sendArrayToApi.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList]

            console.log(this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList.length)
            if (childIndex !== -1) {
                if (childIndex === 0 && this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList.length === 1) {
                    this.deleteSingleRubricFormTable(this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList[childIndex].clinicalQuestionRubricID, this.state.clinicalQuestionBodyPartList[parentIndex].clinicalQuestionBodyPartId, this.props.match.params.QBType);
                    this.deleteSingleRubricFormTable(0, this.state.clinicalQuestionBodyPartList[parentIndex].clinicalQuestionBodyPartId, this.props.match.params.QBType);
                    array.splice(childIndex, 1);
                    finalArray.splice(childIndex, 1);
                    this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList = array
                    this.state.sendArrayToApi.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList = finalArray
                    var tempArray = [...this.state.clinicalQuestionBodyPartList];
                    var finalTempArray = [...this.state.sendArrayToApi.clinicalBodyPartList]
                    tempArray.splice(parentIndex, 1);
                    finalTempArray.splice(parentIndex, 1);
                    this.setState({ clinicalQuestionBodyPartList: tempArray });
                    this.setState({ sendArrayToApi: this.state.sendArrayToApi });
                } else {
                    console.log(this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList[childIndex])
                    this.deleteSingleRubricFormTable(this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList[childIndex].clinicalQuestionRubricID, 0, this.props.match.params.QBType);
                    array.splice(childIndex, 1);
                    finalArray.splice(childIndex, 1);
                    this.state.clinicalQuestionBodyPartList[parentIndex].clinicalRubricViewList = array
                    this.state.sendArrayToApi.clinicalBodyPartList[parentIndex].clinicalBodyPartRubricList = finalArray
                    this.setState({ clinicalQuestionBodyPartList: this.state.clinicalQuestionBodyPartList });
                    this.setState({ sendArrayToApi: this.state.sendArrayToApi });
                }
            }
        }
    }

    deleteSingleRubricFormTable(clinicalRubricId, clinicalQuestionBodyPartId, qbType) {
        debugger
        console.log(`/clinicalquestions/DeleteQuestionBodyPartRubricData?clinicalRubricId=${clinicalRubricId}&clinicalQuestionBodyPartId=${clinicalQuestionBodyPartId}&qbType=${qbType}`)
        try {
            CommonServices.postData({}, `/clinicalquestions/DeleteQuestionBodyPartRubricData?clinicalRubricId=${clinicalRubricId}&clinicalQuestionBodyPartId=${clinicalQuestionBodyPartId}&qbType=${qbType}`).then(async (res) => {
                console.log('deleteSingleRubricFormTable = ', JSON.stringify(res));

            })
        } catch (error) {
            console.log('error ===', error)
        }
    }

    /* get data for edit questions from server */
    async getClinicalQuestionBodyPartDataById(questionId, qbType) {
        debugger;
        console.log('questionId =', questionId);
        console.log('qbType', qbType);
        CommonServices.getData(`/clinicalquestions/GetClinicalQuestionBodyPartDataById?questionId=${questionId}&QBType=${qbType}`).then(async (res) => {
            console.log('getClinicalQuestionBodyPartDataById = ', JSON.stringify(res));

            this.getSubGroupQuestionSection(res.questionGroupId, res.questionSectionId).then(() => {
                console.log('this.state.optionList1 ==', this.state.optionList1);
                var existance = this.state.optionList.filter((item) => item.value === res.questionSectionId);
                var questionGroup = this.state.optionList3.filter((item) => item.value === res.questionGroupId);
                var subQuestionGroup = this.state.optionList1.filter((item) => item.value === res.questionSubgroupId);

                console.log('subQuestionGroup = ', subQuestionGroup)

                var bodyPartList = [];
                var clinicalQuestionList = [];
                var sendArrayToApi = {}
                if (subQuestionGroup[0]?.label?.toLowerCase() !== 'location') {
                    res.clinicalQuestionBodyPartViewList.map((item) => {
                        var rubricObject = {
                            "clinicalQuestionKeywordID": item.clinicalQueKeywordId,
                            "questionID": this.props.match.params.id,
                            "keyWords": item.keywordQuestion,
                            "clinicalQuestionRubricList": this.removeKeysFromArray(item.clinicalRubricViewList, "clinicalRubricID", "subsectionName", "clinicalQuestionKeywordID")
                        }
                        clinicalQuestionList.push(rubricObject);
                    });

                    sendArrayToApi = {
                        "questionsId": res.questionsId,
                        "questionSectionID": res.questionSectionId,
                        "questionGroupId": res.questionGroupId,
                        "questionSubGroupID": res.questionSubgroupId,
                        "qbType": qbType,
                        "clinicalQuestionList": clinicalQuestionList
                    }
                } else {
                    res.clinicalQuestionBodyPartViewList.map((item) => {
                        var rubricObject = {
                            "clinicalQuestionBodyPartID": item.clinicalQuestionBodyPartId,
                            "questionID": this.props.match.params.id,
                            "bodypartID": item.bodyPartId,
                            "clinicalBodyPartRubricList": this.removeKeysFromArray(item.clinicalRubricViewList, "clinicalRubricID", "subsectionName", "clinicalQuestionKeywordID")
                        }
                        bodyPartList.push(rubricObject);
                    });
                    sendArrayToApi = {
                        "questionsId": res.questionsId,
                        "questionSectionID": res.questionSectionId,
                        "questionGroupId": res.questionGroupId,
                        "questionSubGroupID": res.questionSubgroupId,
                        "qbType": qbType,
                        "clinicalBodyPartList": bodyPartList
                    }
                }
                console.log('sendArrayToApi == ', sendArrayToApi)


                console.log('existance ==', existance)
                console.log('questionGroup ==', questionGroup)
                console.log('subQuestionGroup ==', subQuestionGroup)
                this.setState({
                    QuestionsId: res.questionsId,
                    QuestionGroupIdNew: res.questionGroupId,
                    questionSectionId: res.questionSectionId,
                    questionSubgroupId: res.questionSubgroupId,
                    selectedOptions: existance[0],
                    selectedOptions3: questionGroup[0],
                    selectedOptions1: subQuestionGroup[0],
                    copyOfSelectedSubQuestionGroup: subQuestionGroup[0]?.label,
                    clinicalQuestionBodyPartList: res.clinicalQuestionBodyPartViewList,
                    sendArrayToApi: sendArrayToApi,
                });
            });
        });
    }

    // Function to remove keys from each object in the array
    removeKeysFromArray = (array, ...keysToRemove) => {
        return array.map(obj => {
            const newObj = { ...obj }; // Create a new object to avoid mutating the original
            keysToRemove.forEach(key => delete newObj[key]); // Remove each specified key
            return newObj;
        });
    }

    /* For type and search dropdown Existance  */
    getQuestionSection() {
        debugger;
        CommonServices.getData(`/DropdownList/GetQuestionSectionsDDL`).then((temp) => {
            // console.log(temp);
            debugger;
            var copyTableData = temp;
            let array = []
            copyTableData.forEach(element => {
                debugger;
                let obj = {
                    value: parseInt(element.questionSectionId),
                    label: element.questionSectionName
                }
                array.push(obj);
            });
            this.setState({
                optionList: array,
            })
        });
    }

    /* For body part type and search dropdown */
    handlebodypart(data) {
        console.log('pranavsir++++====>>>>>', data)
        this.setState({
            selectedOptions2: data,
        })
    }

    /*For type and search dropdown Existance */
    handleSelect(data) {
        console.log('data = ', data)
        this.setState({
            selectedOptions: data,
            SelectedGuestionsectionId: data.value
        })
    }

    /* For the type and serch dropdown questionGroup */
    handleSelectedQuestionGroup(data) {
        this.setState({
            selectedOptions3: data,
            SelectedQuestionGroupId: data.value
        })

        this.getSubGroupQuestionSection(data.value, this.state.SelectedGuestionsectionId);
    }

    handleSetionChange = (event) => {
        debugger
        console.log('event.name', event.target.name);
        console.log('event.name', event.target.value);

        this.setState({ [event.target.name]: event.target.value });
        this.setState({
            SubSectionId: null,
        });
        this.getBodyPart(event.target.value, undefined);
    }

    handleSelectSubGroup(data) {
        console.log('pranavsir++++====>>>>>', data)
        this.setState({
            selectedOptions1: data,
            copyOfSelectedSubQuestionGroup: data.label,
            subQuestionGroupId: data.value
        })
    }

    GetAllSubsections = (sectionId) => {
        CommonServices.getDataById(sectionId, `/mastersAPI/GetSubsectionBySection`).then((subSections) => {
            this.setState({
                SubSectionModel: subSections,
            })
        });
    }

    GetAllSections = () => {
        CommonServices.getData(`/mastersAPI/GetSections`).then((sections) => {
            this.setState({
                SectionModel: sections,
            })
        })
    }

    getSubGroupQuestionSection(questiongroupId, questionsectionId) {

        return new Promise((resolve, reject) => {
            CommonServices.getData(`/DropdownList/GetSubQuestionGroupByQGIDQSIDDDL/${questiongroupId}/${questionsectionId}`).then((temp) => {
                //debugger;
                console.log('getSubGroupQuestionSection====>>>>>>>', temp);

                var copyTableData = temp;
                let array = []
                copyTableData.forEach(element => {
                    debugger;
                    let obj = {
                        value: parseInt(element.questionSubgroupId),
                        label: element.questionSubgroup1
                    }
                    array.push(obj)
                });
                this.setState({
                    optionList1: array,
                })
                resolve(true);
            });
        })
    }

    /* Method is used to get all Question group for dropdown.*/

    getQuestionGroup() {
        CommonServices.getData('/DropdownList/GetQuestionGroupDDL').then((res) => {
            var copyTableData = res;
            let array = []
            copyTableData.forEach(element => {
                //console.log("printed====>>>>", element)
                //debugger;
                let obj = {
                    value: element.questionGroupId,
                    label: element.questionGroupName
                }
                array.push(obj)
            });
            this.setState({
                optionList3: array,
                //QuestionGroup: res
            });
        })
    }

    /**
    * Handle change event of every control to update the state
    * @param {*} event 
    */
    handleChange(event) {
        this.setState({ [event.target.name]: event.target.value });
    }

    /**
     * Method to get clinical question of selected question group.
     * @param {*} QuestionGroupId 
     */
    getClinicalQuestions(QuestionGroupId) {
        debugger;
        CommonServices.getDataById(QuestionGroupId, `/clinicalquestions/GetClinicalQuestionsByGroup`).then((result) => {
            console.log(result);
            if (result.length > 0) {
                debugger;
                this.setState({
                    QuestionsId: result[0].questionsId,
                    // Description: result[0].description,
                    Questions: result
                })
            }
        })
    }

    /**
     * Get question for edit.
     */
    editQuestion(questionId) {
        var Question = this.state.Questions.filter(x => x.questionsId == questionId);
        console.log(Question);
        debugger;
        this.setState({
            QuestionsId: Question[0].questionsId,
            Question: Question[0].questions,
            Description: Question[0].description,
            SeqNo: Question[0].seqNo,
            QuestionGroupId: Question[0].questionGroupId,
        });
    }

    /**
     * Method is used to handle save 
     */
    handleSave() {
        debugger;
        /* console.log(this.state);
        if (this.state.QuestionGroupId == '') {
            alert("Please select Question group");
        }
        else if (this.state.Question == "") {
            alert("Please select question to edit");
        }
        else if (this.state.Questions.length == 0) {
            alert("There are no questions to edit");
        }
        else {
            var clinicalquestionsModel = [];
            var item = {
                QuestionsId: this.state.QuestionsId,
                QuestionGroupId: this.state.QuestionGroupId,
                Questions: this.state.Question,
                Description: this.state.Description,
                EnteredBy: localStorage.getItem("UserName"),
                SeqNo: this.state.SeqNo,
            }
            clinicalquestionsModel.push(item);
            Save Request
            CommonServices.postData(clinicalquestionsModel, `/clinicalquestions`).then((res) => {
                alert(res.data);
                this.props.history.push('/ListClinicalQuestions');
                this.getClinicalQuestions(this.state.QuestionGroupId);
            });
        } */ //commented by pranav on 29-jan-2024. Reason :- code not usefully

        var finalRequest = {};

        console.log('clinicalQuestionBodyPartList == ', JSON.stringify(this.state.clinicalQuestionBodyPartList));
        console.log('this.state.sendArrayToApi == ', JSON.stringify(this.state.sendArrayToApi));

        /* if (this.state.selectedOptions1?.label?.toLowerCase() !== 'location') {

            finalRequest = {
                "questionSectionID": this.state.SelectedGuestionsectionId,
                "questionGroupId": this.state.SelectedQuestionGroupId,
                "questionSubGroupID": this.state.subQuestionGroupId,
                "qbType": 1,
                "clinicalQuestionList": [{
                    "keyWords": this.state.Question,
                    //"clinicalQuestionRubricList": sendToApi
                }],
                "clinicalBodyPartList": []
            }

            console.log('finalreq = ', finalRequest);

        } else {

        } */


        CommonServices.postData(this.state.sendArrayToApi, `/clinicalquestions/AddEditClinicalQuestionsBodyPart`).then((res) => {
            debugger;
            if (res.data == undefined) {
                // alert('All field are requerd', res.data);
                this.props.history.push('/EditClinicalQuestions');
            }
            else {
                alert(res.data);
                this.props.history.push('/ListClinicalQuestions');
                this.setState({
                    QuestionsId: 0,
                    QuestionGroupId: 0,
                    Question: '',
                    Description: '',
                    EnteredBy: '',
                    SeqNo: 0,
                    Questions: [
                    ],
                    questionSectionId: 0,
                    questionSubgroupId: 0,
                    sendFinalReuest: {}
                })
            }
        })
    }

    /**
     * Method is used to Delete Quesion.
     */
    handleDelete(QuestionsId) {
        console.log(this.state);
        debugger;
        var DeleteClinicalQuestions = {
            QuestionsId: QuestionsId,
            DeleteStatus: true,
            EnteredBy: localStorage.getItem("UserName"),
            QuestionGroupId: this.state.QuestionGroupId,
            Questions: "Test",
        };
        CommonServices.postData(DeleteClinicalQuestions, `/clinicalquestions/DeleteClinicalQuestions`).then((result) => {
            console.log(result);
            alert(result.data);
            this.getClinicalQuestions(this.state.QuestionGroupId);
        });
    }


    GetSubsections = async (sectionId) => {
        var subSectionsList = [];
        return (CommonServices.getDataById(sectionId, `/mastersAPI/GetSubsectionBySection`).then((subSections) => {
            subSectionsList = subSections;
            return subSectionsList;

        }))
    }

    /**
     * Load data on demand for subsections
     */
    loadOptions = async (search, prevOptions) => {
        debugger;
        const options = [];
        var subsectionList = this.state.SubSectionModel;
        await this.GetSubsections(this.state.SectionId).then((result) => {
            subsectionList = result;
        })

        subsectionList.map(x => options.push({ value: x.subSectionId, label: x.subSectionName }));
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

    SubsectionChanged(item) {

        /*  console.log('selectedSubSection === ', this.state.selectedSubSection);
        if (this.state.isEditButtonClicked) {
    
        } else {
    
        } */

        /*   console.log('e.label====>>>>>', item.value)
          console.log('e.label====>>>>>', item.label) */
        if (item != null) {
            this.setState({
                /*  SubSectionId: item.value,
                 SubSectionName: item.label, */
                selectedSubSection: item
            })
        }
        else {
            this.setState({
                SubSectionId: 0
            })

        }

        /* console.log('subSectionId ==== ', this.state.subSectionId) */
    }

    getBodyPart(sectionId, resolve) {
        debugger;
        CommonServices.getDataById(parseInt(sectionId), `/bodypart/GetBodyPartsBySection`).then((temp) => {
            //debugger;
            //console.log('getBodyPart===>>>>>>>>>>>>>>>>>',temp);

            var copyTableData = temp;
            let array = []
            copyTableData.forEach(element => {
                //debugger;
                let obj = {
                    value: parseInt(element.bodyPartId),
                    label: element.bodyPartName
                }
                array.push(obj)
            });
            this.setState({
                optionList2: array,
            })
            resolve !== undefined && resolve(true);
        });
    }

    getSections() {
        CommonServices.getData(`/section`).then((result) => {
            console.log('getSections == ', result)
            if (result.length > 0) {
                let data = result.map((value, index) => {
                    let subSectonList = value.listSubSectionModel;
                    let treeStructure = this.list_to_tree(subSectonList, null);
                    return {
                        subSectionName: value.sectionName,
                        subSectionId: value.sectionId,
                        children: treeStructure
                    }
                });
                this.setState({
                    treeNodes: data
                });
            }
        });
    }

    list_to_tree(data, root) {
        var r = [], o = {};
        data.forEach(function (a) {
            if (o[a.subSectionId] && o[a.subSectionId].children) {
                a.children = o[a.subSectionId] && o[a.subSectionId].children;
            }
            o[a.subSectionId] = a;
            if (a.parentSubSectionId === root) {
                r.push(a);
            } else {
                o[a.parentSubSectionId] = o[a.parentSubSectionId] || {};
                o[a.parentSubSectionId].children = o[a.parentSubSectionId].children || [];
                //debugger;
                // console.log(a);
                o[a.parentSubSectionId].children.push(a);
            }
        });
        // debugger;
        // console.log(r);
        return r;
    }

}