import React, { useEffect, useState } from 'react';
import { Card, CardBody, CardHeader, Col, Container, Row, Button, Spinner } from 'reactstrap';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from "react-redux";
import { getAllopathicDrugList, deleteAllopathicDrug } from "../../../../slices/admin/allopathicdrug/thunk";
import Swal from "sweetalert2";

const ListAllopathicDrug = () => {
    const dispatch = useDispatch();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [searchQuery, setSearchQuery] = useState("");

    // Redux state
    const allopathicDrugLoading = useSelector((state) => state?.AllopathicDrug?.allopathicDrugLoading || false);
    const allopathicDrugs = useSelector((state) => state?.AllopathicDrug?.allopathicDrugList?.resultObject || []);
    const totalPages = useSelector((state) => state?.AllopathicDrug?.allopathicDrugList?.totalPageCount || 1);

    useEffect(() => {
        dispatch(getAllopathicDrugList({ 
            PageNumber: currentPage, 
            PageSize: pageSize,
            queryString: searchQuery 
        }));
    }, [currentPage, searchQuery]);

    // Search Handler
    const handleSearch = (e) => {
        const value = e.target.value;
        setSearchQuery(value);
        setCurrentPage(1); // Reset to first page when searching
    };

    // Delete Handler
    const handleDelete = (allopathicDrugId) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                dispatch(deleteAllopathicDrug({ allopathicDrugId }));
                Swal.fire(
                    'Deleted!',
                    'Your allopathic drug has been deleted.',
                    'success'
                );
            }
        });
    };

    // Pagination Handlers
    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
        }
    };

    document.title = "List Allopathic Drug";
    return (
        <React.Fragment>
            <div className="page-content">
                <Container fluid>
                    <Row>
                        <Col lg={12}>
                            <Card>
                                <CardHeader>
                                    <Row className="g-4">
                                        <Col className="col-sm">
                                            <div className="d-flex justify-content-sm-start">
                                                <div className="search-box">
                                                    <input 
                                                        type="text" 
                                                        className="form-control form-control-sm search" 
                                                        placeholder="Search..." 
                                                        value={searchQuery}
                                                        onChange={handleSearch}
                                                    />
                                                    <i className="ri-search-line search-icon"></i>
                                                </div>
                                            </div>
                                        </Col>
                                        <Col className="col-sm-auto">
                                            <div className="d-inline-flex gap-2">
                                                <button type="button" className="btn btn-soft-primary btn-sm">
                                                    <i className=" ri-newspaper-line align-middle"></i> Import
                                                </button>
                                                <button type="button" className="btn btn-soft-secondary btn-sm">
                                                    <i className="ri-file-list-3-line align-middle"></i> Export
                                                </button>
                                                <Link to="/admin/addallopathicdrug">
                                                    <button type="button" className="btn btn-soft-info btn-sm">
                                                        <i className="ri-add-line align-middle"></i> New
                                                    </button>
                                                </Link>
                                            </div>
                                        </Col>
                                    </Row>
                                </CardHeader>
                                <CardBody>
                                    <div className="listjs-table" id="customerList">
                                        <div className="table-responsive table-card">
                                            <table className="table align-middle table-nowrap" id="customerTable">
                                                <thead>
                                                    <tr>
                                                        <th scope="col" style={{ width: "50px" }}>ID</th>
                                                        <th>Allopathic Drug Name</th>
                                                        <th>Drug Group Name</th>
                                                        <th className='text-center' style={{ width: '10%' }}>Action</th>
                                                    </tr>
                                                </thead>
                                                {allopathicDrugLoading ? (
                                                    <tbody>
                                                        <tr>
                                                            <td colSpan="4" className="text-center">
                                                                <Spinner color="primary" />
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                ) : (
                                                    <tbody>
                                                        {allopathicDrugs?.length > 0 ? (
                                                            allopathicDrugs.map((drug, index) => (
                                                                <tr key={index}>
                                                                    <td>{drug.allopathicDrugId}</td>
                                                                    <td>{drug.allopathicDrugName}</td>
                                                                    <td>{drug.drugGroupName}</td>
                                                                    <td className="text-center">
                                                                        <div className="d-inline-flex gap-2">
                                                                            <div className="edit">
                                                                                <Link to="/admin/editallopathicdrug" state={{ selectedAllopathicDrug: drug }}>
                                                                                    <button className="btn btn-sm btn-soft-success edit-item-btn">
                                                                                        <i className="ri-pencil-fill" />
                                                                                    </button>
                                                                                </Link>
                                                                            </div>
                                                                            <div className="remove">
                                                                                <button
                                                                                    className="btn btn-sm btn-soft-danger remove-item-btn"
                                                                                    onClick={() => handleDelete(drug.allopathicDrugId)}
                                                                                >
                                                                                    <i className="ri-delete-bin-5-line" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan="4" className="text-center">No Allopathic Drugs Available</td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                )}
                                            </table>
                                        </div>

                                        {/* Pagination */}
                                        <div className="align-items-center g-3 text-center text-sm-start row mt-3">
                                            <div className="col-sm">
                                                <div className="text-muted">
                                                    Showing <span className="fw-semibold ms-1">{currentPage}</span> of <span className="fw-semibold">{totalPages}</span> Pages
                                                </div>
                                            </div>
                                            <div className="col-sm-auto">
                                                <ul className="pagination pagination-separated pagination-md justify-content-center justify-content-sm-start mb-0">
                                                    {/* Previous Button */}
                                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={handlePrevPage}>Previous</button>
                                                    </li>

                                                    {/* First Page */}
                                                    {currentPage > 3 && (
                                                        <>
                                                            <li className="page-item">
                                                                <button className="page-link" onClick={() => setCurrentPage(1)}>1</button>
                                                            </li>
                                                            {currentPage > 4 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                                        </>
                                                    )}

                                                    {/* Dynamic Page Numbers */}
                                                    {[...Array(totalPages)].map((_, index) => {
                                                        const page = index + 1;
                                                        if (
                                                            page === currentPage || // Current Page
                                                            page === currentPage - 1 || // One Before Current
                                                            page === currentPage + 1 // One After Current
                                                        ) {
                                                            return (
                                                                <li key={index} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                                    <button className="page-link" onClick={() => setCurrentPage(page)}>{page}</button>
                                                                </li>
                                                            );
                                                        }
                                                        return null;
                                                    })}

                                                    {/* Last Page */}
                                                    {currentPage < totalPages - 2 && (
                                                        <>
                                                            {currentPage < totalPages - 3 && <li className="page-item disabled"><span className="page-link">...</span></li>}
                                                            <li className="page-item">
                                                                <button className="page-link" onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
                                                            </li>
                                                        </>
                                                    )}

                                                    {/* Next Button */}
                                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                        <button className="page-link" onClick={handleNextPage}>Next</button>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
};

export default ListAllopathicDrug;