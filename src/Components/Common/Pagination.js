import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Row } from "reactstrap";
import { pageWindow } from "../../helpers/pageWindow";

const Pagination = ({ data, currentPage, setCurrentPage, perPageData }) => {
    const totalPages = Math.max(1, Math.ceil((data?.length || 0) / (perPageData || 1)) || 1);
    const visiblePages = pageWindow(currentPage, totalPages);

    const handleClick = (e) => {
        setCurrentPage(e);
    };

    const handleprevPage = () => {
        setCurrentPage(currentPage - 1);
    };
    const handlenextPage = () => {
        setCurrentPage(currentPage + 1);
    };

    useEffect(() => {
        if (totalPages && totalPages < currentPage) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage, setCurrentPage]);

    return (
        <React.Fragment>
            <Row className="g-0 justify-content-end mb-4">
                <div className="col-sm-auto">
                    <ul className="pagination-block pagination pagination-separated justify-content-center justify-content-sm-end mb-sm-0">
                        {currentPage <= 1 ? (
                            <Link className="page-item pagination-prev disabled" href="#!">
                                Previous
                            </Link>
                        ) :
                            <li className="page-item">
                                <Link to="#!" className="page-link" onClick={handleprevPage}>Previous</Link>
                            </li>
                        }
                        {visiblePages.map((item, key) => (
                            item === "…" ? (
                                <li key={`gap-${key}`} className="page-item disabled">
                                    <span className="page-link">…</span>
                                </li>
                            ) : (
                                <li className="page-item" key={item}>
                                    <Link to="#!" className={currentPage === item ? "page-link active" : "page-link"} onClick={() => handleClick(item)}>{item}</Link>
                                </li>
                            )
                        ))}
                        {currentPage >= totalPages ? (
                            <Link className="page-item pagination-next disabled" href="#!">
                                Next
                            </Link>
                        ) :
                            <li className="page-item">
                                <Link to="#!" className="page-link" onClick={handlenextPage}>Next</Link>
                            </li>
                        }
                    </ul>
                </div>
            </Row>
        </React.Fragment>
    );
};

export default Pagination;