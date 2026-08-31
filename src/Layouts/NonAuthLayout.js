import React, { useEffect } from 'react';
import withRouter from '../Components/Common/withRouter';

//redux
import { useSelector } from "react-redux";
import { createSelector } from 'reselect';

const NonAuthLayout = ({ children }) => {

    const nonauthData = createSelector(
        (state) => state.Layout,
        (layoutModeType) => layoutModeType.layoutModeType
      );
    // Inside your component
    const layoutModeType = useSelector(nonauthData);

    useEffect(() => {
        const root = document.documentElement;
        if (layoutModeType === "dark") {
            root.setAttribute("data-bs-theme", "dark");
        } else {
            root.setAttribute("data-bs-theme", "light");
        }
        return () => {
            root.removeAttribute("data-bs-theme");
        };
    }, [layoutModeType]);
    return (
        <div>
            {children}
        </div>
    );
};

export default withRouter(NonAuthLayout);