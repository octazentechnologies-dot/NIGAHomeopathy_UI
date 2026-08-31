import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userLoading: false,
  userList: [],
  userError: null,
  userSuccess: null,
  totalCount: 0,
  totalPageCount: 0,
  roleList: [],
  roleLoading: false,
  roleError: null,
  selectedUser: null
};

const UserSlice = createSlice({
  name: "User",
  initialState,
  reducers: {
    setUserLoading: (state, action) => {
      state.userLoading = action.payload;
    },
    setUserList: (state, action) => {
      state.userList = action.payload;
    },
    setUserError: (state, action) => {
      state.userError = action.payload;
    },
    setUserSuccess: (state, action) => {
      state.userSuccess = action.payload;
    },
    setUserTotals: (state, action) => {
      state.totalCount = action.payload?.totalCount || 0;
      state.totalPageCount = action.payload?.totalPageCount || 0;
    },
    setRoleList: (state, action) => {
      state.roleList = action.payload;
    },
    setRoleLoading: (state, action) => {
      state.roleLoading = action.payload;
    },
    setRoleError: (state, action) => {
      state.roleError = action.payload;
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    }
  }
});

export const {
  setUserLoading,
  setUserList,
  setUserError,
  setUserSuccess,
  setUserTotals,
  setRoleList,
  setRoleLoading,
  setRoleError,
  setSelectedUser
} = UserSlice.actions;

export default UserSlice.reducer;

