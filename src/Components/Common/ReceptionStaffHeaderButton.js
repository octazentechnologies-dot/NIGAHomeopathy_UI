import React, { useMemo, useState } from 'react';
import {
  Button,
  Input,
  Label,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Pagination,
  PaginationItem,
  PaginationLink,
  UncontrolledTooltip,
} from 'reactstrap';
import Swal from 'sweetalert2';
import ModalActionButton from './ModalActionButton';
import { UserRole } from '../constants/roles';

const INITIAL_RECEPTION_STAFF = [
  {
    id: 1,
    staffName: 'Amit Verma',
    email: 'amit@clinic.com',
    mobile: '9876543210',
    status: 'Active',
    addedOn: '12 Jan 2024',
    lastLogin: 'Today, 09:15 AM',
  },
  {
    id: 2,
    staffName: 'Pooja Singh',
    email: 'pooja@clinic.com',
    mobile: '9123456789',
    status: 'Active',
    addedOn: '10 Feb 2024',
    lastLogin: 'Today, 08:45 AM',
  },
  {
    id: 3,
    staffName: 'Rahul Nair',
    email: 'rahul@clinic.com',
    mobile: '9888766554',
    status: 'Disabled',
    addedOn: '05 Mar 2024',
    lastLogin: '15 Dec 2024',
  },
  {
    id: 4,
    staffName: 'Sneha Patel',
    email: 'sneha@clinic.com',
    mobile: '9876123456',
    status: 'Active',
    addedOn: '20 Mar 2024',
    lastLogin: 'Today, 10:00 AM',
  },
];

const emptyStaffForm = {
  staffName: '',
  email: '',
  mobile: '',
  status: 'Active',
};

const getStatusBadgeClass = (status) => {
  const normalized = String(status || '').toLowerCase();
  if (normalized === 'active') return 'bg-success-subtle text-success';
  if (normalized === 'disabled') return 'bg-danger-subtle text-danger';
  return 'bg-secondary-subtle text-secondary';
};

const ReceptionStaffHeaderButton = ({ userRole }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [staffList, setStaffList] = useState(INITIAL_RECEPTION_STAFF);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('add'); // 'add' | 'edit'
  const [editingStaff, setEditingStaff] = useState(null);
  const [staffForm, setStaffForm] = useState(emptyStaffForm);
  const pageSize = 10;

  const isDoctor = userRole === UserRole.DOCTOR;

  const filtered = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) return staffList;
    return staffList.filter((staff) => {
      return (
        staff.staffName.toLowerCase().includes(needle) ||
        staff.email.toLowerCase().includes(needle) ||
        staff.mobile.includes(needle) ||
        staff.status.toLowerCase().includes(needle)
      );
    });
  }, [staffList, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = filtered.slice(startIndex, startIndex + pageSize);
  const showingFrom = filtered.length === 0 ? 0 : startIndex + 1;
  const showingTo = startIndex + pageItems.length;

  if (!isDoctor) {
    return null;
  }

  const openModal = () => {
    setModalOpen(true);
    setSearchTerm('');
    setCurrentPage(1);
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setEditingStaff(null);
    setStaffForm(emptyStaffForm);
    setFormMode('add');
  };

  const closeModal = () => {
    setModalOpen(false);
    closeFormModal();
  };

  const openAddModal = () => {
    setFormMode('add');
    setEditingStaff(null);
    setStaffForm(emptyStaffForm);
    setFormModalOpen(true);
  };

  const openEditModal = (staff) => {
    setFormMode('edit');
    setEditingStaff(staff);
    setStaffForm({
      staffName: staff.staffName || '',
      email: staff.email || '',
      mobile: staff.mobile || '',
      status: staff.status || 'Active',
    });
    setFormModalOpen(true);
  };

  const updateStaffField = (field, value) => {
    setStaffForm((prev) => ({ ...prev, [field]: value }));
  };

  const validateStaffForm = () => {
    if (!staffForm.staffName.trim() || !staffForm.email.trim() || !staffForm.mobile.trim()) {
      Swal.fire({
        title: 'Missing details',
        text: 'Please fill staff name, email, and mobile.',
        icon: 'warning',
        timer: 1800,
        showConfirmButton: false,
      });
      return false;
    }
    return true;
  };

  const formatAddedOnDate = () =>
    new Date().toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const handleSaveStaff = () => {
    if (!validateStaffForm()) return;

    if (formMode === 'edit' && editingStaff) {
      setStaffList((prev) =>
        prev.map((staff) =>
          staff.id === editingStaff.id
            ? {
                ...staff,
                staffName: staffForm.staffName.trim(),
                email: staffForm.email.trim(),
                mobile: staffForm.mobile.trim(),
                status: staffForm.status,
              }
            : staff
        )
      );
      closeFormModal();
      Swal.fire({
        title: 'Updated!',
        text: 'Receptionist staff details have been updated.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    const nextId = staffList.reduce((max, staff) => Math.max(max, staff.id), 0) + 1;
    setStaffList((prev) => [
      {
        id: nextId,
        staffName: staffForm.staffName.trim(),
        email: staffForm.email.trim(),
        mobile: staffForm.mobile.trim(),
        status: staffForm.status,
        addedOn: formatAddedOnDate(),
        lastLogin: '—',
      },
      ...prev,
    ]);
    setCurrentPage(1);
    closeFormModal();
    Swal.fire({
      title: 'Added!',
      text: 'New receptionist staff has been added.',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleDeleteStaff = (staff) => {
    Swal.fire({
      title: 'Are you sure you want to delete this staff member?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (!result.isConfirmed) return;
      setStaffList((prev) => prev.filter((item) => item.id !== staff.id));
      Swal.fire({
        title: 'Deleted!',
        text: 'The receptionist staff member has been deleted.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
      });
    });
  };

  const formModalTitle =
    formMode === 'edit' ? 'Edit Receptionist Staff' : 'Add Receptionist Staff';
  const formSubmitLabel = formMode === 'edit' ? 'Update' : 'Add';

  return (
    <>
      <div className="ms-1 header-item">
        <button
          type="button"
          className="btn btn-icon btn-topbar btn-ghost-secondary rounded-circle"
          title="Receptionist Staff"
          aria-label="Receptionist Staff"
          onClick={openModal}
        >
          <i className="ri-user-star-line fs-20" />
        </button>
      </div>

      <Modal
        size="xl"
        isOpen={modalOpen}
        toggle={closeModal}
        className="patient-list-modal reception-staff-modal"
      >
        <ModalHeader className="patient-list-modal__header" toggle={closeModal}>
          <span className="patient-list-modal__title patient-list-modal__title--simple">
            <i className="ri-user-star-line" style={{ color: '#25a0e2', fontSize: 15 }} aria-hidden="true" />
            <span className="patient-list-modal__title-text">Receptionist Staff</span>
          </span>
          <div className="patient-list-modal__header-actions">
            <Button
              type="button"
              color="primary"
              outline
              size="sm"
              className="reception-staff-add-btn doctor-dashboard-create-new-btn d-inline-flex align-items-center"
              onClick={openAddModal}
            >
              <i className="ri-user-add-line me-1" aria-hidden="true" />
              Add
            </Button>
            <div className="patient-list-modal__search">
              <i className="ri-search-line patient-list-modal__search-icon" aria-hidden="true" />
              <Input
                size="sm"
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="table-responsive patient-list-modal__table-wrap">
            <table className="table mb-0 align-middle patient-list-modal__table">
              <thead>
                <tr>
                  <th scope="col" className="text-center patient-list-modal__th-index" style={{ width: '5%' }}>
                    #
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-user-line" aria-hidden="true" />
                      Staff Name
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-mail-line" aria-hidden="true" />
                      Email
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-phone-line" aria-hidden="true" />
                      Mobile
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-flag-line" aria-hidden="true" />
                      Status
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-calendar-line" aria-hidden="true" />
                      Added On
                    </span>
                  </th>
                  <th scope="col">
                    <span className="patient-list-modal__th">
                      <i className="ri-time-line" aria-hidden="true" />
                      Last Login
                    </span>
                  </th>
                  <th scope="col" className="text-center">
                    <span className="patient-list-modal__th">
                      <i className="ri-settings-3-line" aria-hidden="true" />
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((staff, index) => (
                  <tr key={staff.id}>
                    <td className="text-center patient-list-modal__index">{startIndex + index + 1}</td>
                    <td>
                      <span className="fw-semibold text-body">{staff.staffName}</span>
                    </td>
                    <td>
                      <span className="patient-list-modal__meta text-muted">{staff.email}</span>
                    </td>
                    <td>
                      <span className="patient-list-modal__meta">{staff.mobile}</span>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${getStatusBadgeClass(staff.status)}`}>
                        {staff.status}
                      </span>
                    </td>
                    <td>
                      <span className="patient-list-modal__meta">{staff.addedOn}</span>
                    </td>
                    <td>
                      <span className="patient-list-modal__meta">{staff.lastLogin}</span>
                    </td>
                    <td className="text-center">
                      <div className="d-inline-flex gap-2">
                        <div className="edit">
                          <button
                            id={`reception-staff-edit-${staff.id}`}
                            type="button"
                            className="btn btn-sm btn-soft-success edit-item-btn"
                            onClick={() => openEditModal(staff)}
                          >
                            <i className="ri-pencil-fill" />
                          </button>
                          <UncontrolledTooltip placement="top" target={`reception-staff-edit-${staff.id}`}>
                            Edit Staff
                          </UncontrolledTooltip>
                        </div>
                        <div className="remove">
                          <button
                            id={`reception-staff-del-${staff.id}`}
                            type="button"
                            className="btn btn-sm btn-soft-danger remove-item-btn"
                            onClick={() => handleDeleteStaff(staff)}
                          >
                            <i className="ri-delete-bin-5-line" />
                          </button>
                          <UncontrolledTooltip placement="top" target={`reception-staff-del-${staff.id}`}>
                            Delete Staff
                          </UncontrolledTooltip>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {pageItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center text-muted">
                      <div className="patient-list-modal__empty">
                        <span className="patient-list-modal__empty-icon" aria-hidden="true">
                          <i className="ri-inbox-2-line" />
                        </span>
                        <span>
                          {searchTerm
                            ? 'No receptionist staff found matching your search'
                            : 'No receptionist staff available'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="d-flex align-items-center justify-content-between patient-list-modal__footer">
            <div className="text-muted patient-list-modal__footer-text">
              {`Showing ${showingFrom} to ${showingTo} of ${filtered.length} staff`}
            </div>
            <Pagination className="pagination-separated mb-0 doctor-dashboard-pagination">
              <PaginationItem disabled={safePage === 1}>
                <PaginationLink
                  href="#"
                  previous
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.max(1, safePage - 1));
                  }}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem active={page === safePage} key={page}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setCurrentPage(page);
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem disabled={safePage === totalPages}>
                <PaginationLink
                  href="#"
                  next
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(Math.min(totalPages, safePage + 1));
                  }}
                />
              </PaginationItem>
            </Pagination>
          </div>
        </ModalBody>
      </Modal>

      <Modal isOpen={formModalOpen} toggle={closeFormModal} centered className="reception-staff-edit-modal">
        <ModalHeader toggle={closeFormModal}>{formModalTitle}</ModalHeader>
        <ModalBody>
          <div className="mb-3">
            <Label for="receptionStaffName" className="form-label">
              Staff Name
            </Label>
            <Input
              id="receptionStaffName"
              type="text"
              value={staffForm.staffName}
              onChange={(e) => updateStaffField('staffName', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <Label for="receptionStaffEmail" className="form-label">
              Email
            </Label>
            <Input
              id="receptionStaffEmail"
              type="email"
              value={staffForm.email}
              onChange={(e) => updateStaffField('email', e.target.value)}
            />
          </div>
          <div className="mb-3">
            <Label for="receptionStaffMobile" className="form-label">
              Mobile
            </Label>
            <Input
              id="receptionStaffMobile"
              type="text"
              value={staffForm.mobile}
              onChange={(e) => updateStaffField('mobile', e.target.value)}
            />
          </div>
          <div className="mb-0">
            <Label for="receptionStaffStatus" className="form-label">
              Status
            </Label>
            <Input
              id="receptionStaffStatus"
              type="select"
              value={staffForm.status}
              onChange={(e) => updateStaffField('status', e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
            </Input>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={closeFormModal}>
            Cancel
          </Button>
          <ModalActionButton color="primary" onClick={handleSaveStaff}>
            {formSubmitLabel}
          </ModalActionButton>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default ReceptionStaffHeaderButton;
