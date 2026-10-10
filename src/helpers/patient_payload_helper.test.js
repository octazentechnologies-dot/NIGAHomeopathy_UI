import {
  extractPatientFieldErrors,
  sanitizePatientSaveMessage,
} from "./patient_payload_helper";

describe("extractPatientFieldErrors", () => {
  test("returns {} for missing or unstructured bodies", () => {
    expect(extractPatientFieldErrors(null)).toEqual({});
    expect(extractPatientFieldErrors(undefined)).toEqual({});
    expect(extractPatientFieldErrors("boom")).toEqual({});
    expect(extractPatientFieldErrors({ message: "error" })).toEqual({});
  });

  test("maps ASP.NET ModelState dicts case-insensitively", () => {
    expect(
      extractPatientFieldErrors({
        errors: {
          MobileNo: ["Mobile number is invalid."],
          Email: ["Invalid email."],
        },
      })
    ).toEqual({
      mobileNo: "Mobile number is invalid.",
      email: "Invalid email.",
    });
  });

  test("handles PascalCase root and phone/reference aliases", () => {
    expect(
      extractPatientFieldErrors({
        Errors: {
          Phone: ["Bad phone."],
          RefBy: ["Bad reference."],
          PatientName: ["Bad name."],
        },
      })
    ).toEqual({
      phoneNo: "Bad phone.",
      refBy: "Bad reference.",
      patientName: "Bad name.",
    });
  });

  test("handles array-shaped field errors and keeps first message", () => {
    expect(
      extractPatientFieldErrors({
        fieldErrors: [
          { field: "mobileNo", message: "First." },
          { field: "mobileNo", message: "Second." },
          { field: "unknownThing", message: "Ignored." },
        ],
      })
    ).toEqual({ mobileNo: "First." });
  });

  test("ignores empty messages", () => {
    expect(extractPatientFieldErrors({ errors: { Email: ["", null] } })).toEqual({});
  });
});

describe("sanitizePatientSaveMessage", () => {
  test("replaces raw technical text", () => {
    expect(
      sanitizePatientSaveMessage(
        "An error occurred while saving the entity changes. See the inner exception for details."
      )
    ).toBe("Could not save the patient. Please check the details and try again.");
  });

  test("uses field-specific fallback when fields are highlighted", () => {
    expect(sanitizePatientSaveMessage("", true)).toBe(
      "Could not save the patient. Please check the highlighted fields and try again."
    );
    expect(sanitizePatientSaveMessage("Some SQL failure", true)).toBe(
      "Could not save the patient. Please check the highlighted fields and try again."
    );
  });

  test("keeps friendly backend messages intact", () => {
    expect(sanitizePatientSaveMessage("Mobile number already exists.", false)).toBe(
      "Mobile number already exists."
    );
  });
});
