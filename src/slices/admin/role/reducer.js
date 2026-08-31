import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  roleLoading: false,
  roleList: [],
  roleError: null,
  roleSuccess: null,
  selectedRole: null,
  firmList: [],
  firmLoading: false,
  firmError: null
};

const RoleSlice = createSlice({
  name: "Role",
  initialState,
  reducers: {
    setRoleLoading: (state, action) => {
      state.roleLoading = action.payload;
    },
    setRoleList: (state, action) => {
      state.roleList = action.payload;
    },
    setRoleError: (state, action) => {
      state.roleError = action.payload;
    },
    setRoleSuccess: (state, action) => {
      state.roleSuccess = action.payload;
    },
    setSelectedRole: (state, action) => {
      state.selectedRole = action.payload;
    },
    setFirmList: (state, action) => {
      state.firmList = action.payload;
    },
    setFirmLoading: (state, action) => {
      state.firmLoading = action.payload;
    },
    setFirmError: (state, action) => {
      state.firmError = action.payload;
    }
  }
});

export const {
  setRoleLoading,
  setRoleList,
  setRoleError,
  setRoleSuccess,
  setSelectedRole,
  setFirmList,
  setFirmLoading,
  setFirmError
} = RoleSlice.actions;

export default RoleSlice.reducer;

