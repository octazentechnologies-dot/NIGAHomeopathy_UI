import React from "react";
import fs from "fs";
import path from "path";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";

import Register from "./Register";
import { registerUser, apiError, resetRegisterFlag } from "../../slices/thunks";
import {
  getRegistrationCountries,
  getRegistrationStates,
  getRegistrationDistricts,
  getRegistrationCities,
  getRegistrationPinCodes,
  getRegistrationQualifications,
} from "../../helpers/realbackend_helper";

jest.mock("../../helpers/realbackend_helper", () => ({
  getRegistrationCountries: jest.fn(),
  getRegistrationStates: jest.fn(),
  getRegistrationDistricts: jest.fn(),
  getRegistrationCities: jest.fn(),
  getRegistrationPinCodes: jest.fn(),
  getRegistrationQualifications: jest.fn(),
}));

jest.mock("../../slices/thunks", () => ({
  registerUser: jest.fn((payload) => ({ type: "test/register", payload })),
  apiError: jest.fn(() => ({ type: "test/apiError" })),
  resetRegisterFlag: jest.fn(() => ({ type: "test/reset" })),
}));

const makeStore = () =>
  configureStore({
    reducer: {
      Account: (
        state = {
          success: false,
          error: null,
          loading: false,
          registrationError: null,
          message: "",
          user: null,
        }
      ) => state,
      Login: (state = {}) => state,
    },
  });

const seedLookups = () => {
  getRegistrationCountries.mockResolvedValue([
    { countryId: 78, countryName: "India", countryCode: "+91" },
    { countryId: 32, countryName: "Canada", countryCode: "+1" },
  ]);
  getRegistrationStates.mockResolvedValue([
    { stateId: 14, stateName: "Maharashtra" },
  ]);
  getRegistrationDistricts.mockResolvedValue([
    { districtId: 270, districtName: "Pune" },
  ]);
  getRegistrationCities.mockResolvedValue([
    { cityId: 7062, cityName: "Haveli" },
  ]);
  getRegistrationPinCodes.mockResolvedValue([
    { pinCodeId: 1, pinCode: "411001", cityId: 7062 },
    { pinCodeId: 2, pinCode: "Other", cityId: 7062 },
  ]);
  getRegistrationQualifications.mockResolvedValue([
    { qualificationId: 3, qualificationName: "BHMS" },
  ]);
};

const renderRegister = () => {
  const store = makeStore();
  const dispatchSpy = jest.spyOn(store, "dispatch");
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    </Provider>
  );
  return dispatchSpy;
};

const openSelectAndPick = async (user, placeholderText, optionText) => {
  await user.click(screen.getByText(placeholderText));
  await user.click(await screen.findByText(optionText));
};

const fillStep1 = async (user) => {
  await user.type(screen.getByPlaceholderText("First name"), "Sumit");
  await user.type(screen.getByPlaceholderText("Last name"), "B");
  await user.type(screen.getByPlaceholderText("Choose a login user name"), "doc1");
  await user.type(screen.getByPlaceholderText("name@example.com"), "doc1@example.com");
  await user.type(screen.getByPlaceholderText("e.g. 9876543210"), "9876543210");
  await user.type(screen.getByPlaceholderText("Create a password"), "pass1234");
  await user.type(screen.getByPlaceholderText("Re-enter password"), "pass1234");
};

describe("Register (post-merge)", () => {
  beforeEach(() => {
    // CRA jest uses resetMocks: true, so factory implementations are wiped
    // before each test — (re)assign them here.
    registerUser.mockImplementation((payload) => ({ type: "test/register", payload }));
    apiError.mockReturnValue({ type: "test/apiError" });
    resetRegisterFlag.mockReturnValue({ type: "test/reset" });
    seedLookups();
  });

  test("file contains no unresolved merge conflict markers", () => {
    const source = fs.readFileSync(
      path.join(__dirname, "Register.js"),
      "utf8"
    );
    expect(source).not.toMatch(/^<{7} /m);
    expect(source).not.toMatch(/^={7}$/m);
    expect(source).not.toMatch(/^>{7} /m);
  });

  test("renders wizard with API-bound dial code and blocks empty submit", async () => {
    const user = userEvent.setup();
    renderRegister();

    expect(await screen.findByText("Account details")).toBeInTheDocument();
    // Dial-code dropdown is bound to the countries API (not the old static list).
    expect(await screen.findByText("India (+91)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Please enter first name")).toBeInTheDocument();
  });

  test("full cascade submits a contract-preserving payload", async () => {
    const user = userEvent.setup();
    renderRegister();
    await screen.findByText("Account details");

    await fillStep1(user);
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Clinic & location")).toBeInTheDocument();

    await user.type(
      screen.getByPlaceholderText("Enter clinic or company name"),
      "City Care Clinic"
    );
    // Country defaults to India; cascade state -> district -> city -> PIN.
    await openSelectAndPick(user, "Select state (optional)", "Maharashtra");
    await openSelectAndPick(user, "Select district (optional)", "Pune");
    await openSelectAndPick(user, "Select city (optional)", "Haveli");
    await openSelectAndPick(user, "Select PIN code (optional)", "411001");

    await user.type(
      screen.getByPlaceholderText("Building / clinic name, street"),
      "MG Road"
    );
    await user.type(
      screen.getByPlaceholderText("Area / locality, apartment / floor"),
      "Shivaji Nagar"
    );

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Professional credentials")).toBeInTheDocument();

    await openSelectAndPick(user, "Select qualification", "BHMS");
    await user.click(
      screen.getByRole("button", { name: "Create doctor account" })
    );

    await waitFor(() => expect(registerUser).toHaveBeenCalledTimes(1));
    const formData = registerUser.mock.calls[0][0];
    const payload = Object.fromEntries(formData.entries());

    expect(payload.mobileNo).toBe("+919876543210");
    expect(payload.countryId).toBe("78");
    expect(payload.stateId).toBe("14");
    expect(payload.city).toBe("Haveli");
    expect(payload.companyName).toBe("City Care Clinic");
    expect(payload.qualificationId).toBe("3");
    expect(payload.permanantAddress).toBe("MG Road, Shivaji Nagar, 411001");
    // Contract preserved: no new backend keys leak through.
    expect(formData.has("districtId")).toBe(false);
    expect(formData.has("cityId")).toBe(false);
    expect(formData.has("countryCode")).toBe(false);
    expect(formData.has("confirmPassword")).toBe(false);
  }, 30000);
});
