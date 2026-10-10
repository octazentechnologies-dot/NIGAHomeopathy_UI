import {
  setPackageLoading,
  setPackageList,
  setPackageError,
  setPackageSuccess,
} from "./reducer";
import {
  getPackageList as getPackageListApi,
  deletePackage as deletePackageApi,
  savePackage as savePackageApi,
} from "../../../helpers/realbackend_helper";
import { getAuditUserName } from "../../../helpers/api_helper";

/** GetAllPackages caps PageSize at 150; the list page searches and pages on the client. */
const PACKAGE_PAGE_SIZE = 150;

const unwrapList = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.Data)) return response.Data;
  if (Array.isArray(response?.resultObject)) return response.resultObject;
  return [];
};

const unwrapMessage = (response, fallback) => {
  if (typeof response === "string" && response.trim()) return response;
  return response?.message || response?.Message || fallback;
};

const responseStatus = (response) => response?.status ?? response?.Status;

const errorMessage = (error, fallback) =>
  (typeof error === "string" && error) || error?.message || error?.Message || fallback;

const toPackageModel = (data) => {
  const auditUser = getAuditUserName();
  return {
    PackageId: Number(data.packageId ?? data.PackageId ?? 0),
    PackageName: (data.packageName ?? data.PackageName ?? "").trim(),
    CaseCount: Number(data.caseCount ?? data.CaseCount ?? 0),
    ValidityInDays: Number(data.validityInDays ?? data.ValidityInDays ?? 0),
    Amount: Number(data.amount ?? data.Amount ?? 0),
    // Save validates EnteredBy and ChangedBy as required; on update the API stores EnteredBy as ChangedBy.
    EnteredBy: auditUser,
    ChangedBy: auditUser,
    DeleteStatus: false,
  };
};

export const getPackageList = () => async (dispatch) => {
  try {
    dispatch(setPackageLoading(true));
    const response = await getPackageListApi({ PageNumber: 1, PageSize: PACKAGE_PAGE_SIZE });
    dispatch(setPackageList(unwrapList(response)));
  } catch (error) {
    dispatch(setPackageList([]));
    dispatch(setPackageError(errorMessage(error, "Failed to load packages")));
  } finally {
    dispatch(setPackageLoading(false));
  }
};

export const deletePackage = (packageModel) => async (dispatch) => {
  const packageId = packageModel?.packageId ?? packageModel?.PackageId;
  try {
    dispatch(setPackageLoading(true));
    const response = await deletePackageApi(packageId, getAuditUserName());
    const status = responseStatus(response);
    if (status && status !== 200) {
      dispatch(setPackageError(unwrapMessage(response, "Failed to delete package")));
      return;
    }
    dispatch(setPackageSuccess(unwrapMessage(response, "Package deleted successfully")));
    dispatch(getPackageList());
  } catch (error) {
    dispatch(setPackageError(errorMessage(error, "Failed to delete package")));
  } finally {
    dispatch(setPackageLoading(false));
  }
};

const savePackage = (data, failMessage, okMessage) => async (dispatch) => {
  try {
    dispatch(setPackageLoading(true));
    const response = await savePackageApi(toPackageModel(data));
    const status = responseStatus(response);
    if (status && status !== 200) {
      dispatch(setPackageError(unwrapMessage(response, failMessage)));
      return response;
    }
    dispatch(setPackageSuccess(unwrapMessage(response, okMessage)));
    return response;
  } catch (error) {
    dispatch(setPackageError(errorMessage(error, failMessage)));
    return undefined;
  } finally {
    dispatch(setPackageLoading(false));
  }
};

export const createPackage = (data) =>
  savePackage({ ...data, packageId: 0 }, "Failed to create package", "Package created successfully");

export const updatePackage = (data) =>
  savePackage(data, "Failed to update package", "Package updated successfully");
