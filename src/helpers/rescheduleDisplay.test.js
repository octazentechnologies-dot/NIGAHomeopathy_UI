import { coerceAppointmentTime, formatRescheduleDate, formatRescheduleTime, readRescheduleFailure } from "./rescheduleDisplay";

describe("reschedule display", () => {
  test("shows the current date and time for the modal", () => {
    expect(formatRescheduleDate("2026-09-23T00:00:00")).toBe("23-09-2026");
    expect(formatRescheduleDate("23-09-2026")).toBe("23-09-2026");
    expect(formatRescheduleTime("16:00:00")).toBe("4:00 PM");
    expect(formatRescheduleTime({ hour: 9, minute: 5 })).toBe("9:05 AM");
    expect(coerceAppointmentTime("")).toBe("");
  });

  test("reason stays optional and a taken slot returns alternatives", () => {
    expect(readRescheduleFailure("Could not reschedule.")).toEqual({
      message: "Could not reschedule.",
      alternatives: [],
    });
    const failure = readRescheduleFailure({
      message: "This patient is already booked at that time.",
      data: {
        alternatives: [{ time: "17:00:00", label: "5:00 PM" }],
      },
    });
    expect(failure.message).toBe("This patient is already booked at that time.");
    expect(failure.alternatives).toEqual([{ time: "17:00:00", label: "5:00 PM" }]);
  });
});
