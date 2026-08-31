import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';

//import images
import avatar1 from "../../assets/images/users/avatar-1.jpg";
import { createSelector } from 'reselect';

const ProfileDropdown = () => {

    const profiledropdownData = createSelector(
        (state) => state.Profile,
        (user) => user.user
    );
    // Inside your component
    const user = useSelector(profiledropdownData);

    const [userName, setUserName] = useState("Admin");
    const [userRole, setUserRole] = useState("Admin");
    const [displayName, setDisplayName] = useState("J. Nikhil");
    const [userData, setUserData] = useState(null);

    // Function to format name to initials (e.g., "NIKHIL JAMDAR" -> "J. Nikhil")
    const formatNameToInitials = (fullName) => {
        if (!fullName || fullName.trim() === "") return "Admin";
        
        const nameParts = fullName.trim().split(/\s+/);
        if (nameParts.length === 1) {
            // Single name: show first letter + rest of name
            return nameParts[0].charAt(0).toUpperCase() + ". " + nameParts[0].substring(1);
        } else if (nameParts.length >= 2) {
            // Format: Last initial + ". " + First name (e.g., "NIKHIL JAMDAR" -> "J. Nikhil")
            const firstName = nameParts[0].charAt(0).toUpperCase() + nameParts[0].substring(1).toLowerCase();
            const lastInitial = nameParts[nameParts.length - 1].charAt(0).toUpperCase() + ".";
            return `${lastInitial} ${firstName}`;
        }
        return fullName;
    };

    useEffect(() => {
        const authUserStr = sessionStorage.getItem("authUser");
        if (authUserStr) {
            try {
                const obj = JSON.parse(authUserStr);
                // Handle both direct user object and wrapped in data property
                const userInfo = obj.data || obj;
                
                if (userInfo) {
                    setUserData(userInfo);
                    setUserName(userInfo.userName || "Admin");
                    setUserRole(userInfo.role || "Admin");
                    setDisplayName(formatNameToInitials(userInfo.userName || "Admin"));
                }
            } catch (error) {
                console.error("Error parsing authUser:", error);
            }
        }
    }, []);

    //Dropdown Toggle
    const [isProfileDropdown, setIsProfileDropdown] = useState(false);
    const toggleProfileDropdown = () => {
        setIsProfileDropdown(!isProfileDropdown);
    };
    return (
        <React.Fragment>
            <Dropdown isOpen={isProfileDropdown} toggle={toggleProfileDropdown} className="header-item topbar-user">
                <DropdownToggle tag="button" type="button" className="btn">
                    <span className="d-flex align-items-center">
                        <img className="rounded-circle header-profile-user" src={avatar1}
                            alt="Header Avatar" />
                        <span className="text-start ms-xl-2">
                            <span className="d-none d-xl-inline-block ms-1 fw-medium user-name-text">{displayName}</span>
                            <span className="d-none d-xl-block ms-1 fs-12 text-muted user-name-sub-text">{userRole}</span>
                        </span>
                    </span>
                </DropdownToggle>
                <DropdownMenu className="dropdown-menu-end">
                    <h6 className="dropdown-header">Welcome {userName ? userName.toUpperCase() : "USER"}!</h6>
                    <DropdownItem className='p-0'>
                        <Link to="/profile" className="dropdown-item">
                            <i className="mdi mdi-account-circle text-muted fs-16 align-middle me-1"></i>
                            <span className="align-middle">Profile</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/apps-chat" className="dropdown-item">
                            <i className="mdi mdi-message-text-outline text-muted fs-16 align-middle me-1"></i> <span
                                className="align-middle">Messages</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="#" className="dropdown-item">
                            <i className="mdi mdi-calendar-check-outline text-muted fs-16 align-middle me-1"></i> <span
                                className="align-middle">Taskboard</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-faqs" className="dropdown-item">
                            <i
                                className="mdi mdi-lifebuoy text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle">Help</span>
                        </Link>
                    </DropdownItem>
                    <div className="dropdown-divider"></div>
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile" className="dropdown-item">
                            <i
                                className="mdi mdi-wallet text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle">Balance : <b>$5971.67</b></span>
                        </Link>
                    </DropdownItem >
                    <DropdownItem className='p-0'>
                        <Link to="/pages-profile-settings" className="dropdown-item">
                            <span
                                className="badge bg-success-subtle text-success mt-1 float-end">New</span><i
                                    className="mdi mdi-cog-outline text-muted fs-16 align-middle me-1"></i> <span
                                        className="align-middle">Settings</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/auth-lockscreen-basic" className="dropdown-item">
                            <i
                                className="mdi mdi-lock text-muted fs-16 align-middle me-1"></i> <span className="align-middle">Lock screen</span>
                        </Link>
                    </DropdownItem>
                    <DropdownItem className='p-0'>
                        <Link to="/logout" className="dropdown-item">
                            <i
                                className="mdi mdi-logout text-muted fs-16 align-middle me-1"></i> <span
                                    className="align-middle" data-key="t-logout">Logout</span>
                        </Link>
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </React.Fragment>
    );
};

export default ProfileDropdown;