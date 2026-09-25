import PropTypes from "prop-types";
import React, { useEffect } from "react";

import { logoutWithBackupPrompt } from "../../slices/thunks";

//redux
import { useSelector, useDispatch } from "react-redux";

import withRouter from "../../Components/Common/withRouter";
import { createSelector } from "reselect";
import { getHomeDashboardPath } from "../../helpers/dashboard_helper";
import { useProfile } from "../../Components/Hooks/UserHooks";

const Logout = (props) => {
  const dispatch = useDispatch();
  const { userProfile } = useProfile();

  const logoutData = createSelector(
    (state) => state.Login,
    (isUserLogout) => isUserLogout.isUserLogout
  );
  const isUserLogout = useSelector(logoutData);

  useEffect(() => {
    const performLogout = async () => {
      const loggedOut = await dispatch(logoutWithBackupPrompt());
      if (!loggedOut) {
        const fallbackPath = getHomeDashboardPath(userProfile?.role) || "/doctordashboard";
        props.router.navigate(fallbackPath, { replace: true });
        return;
      }
      window.location.replace("/login");
    };

    performLogout();
  }, [dispatch, props.router, userProfile?.role]);

  if (isUserLogout) {
    return null;
  }

  return <></>;
};

Logout.propTypes = {
  history: PropTypes.object,
};


export default withRouter(Logout);
