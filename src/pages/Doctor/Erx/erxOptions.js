export const FREQUENCY_OPTIONS = [
  "Once a day",
  "2 times a day",
  "3 times a day",
  "4 times a day",
  "Once a week",
  "SOS (when needed)",
];

export const DURATION_OPTIONS = ["3 days", "5 days", "1 week", "2 weeks", "1 month", "2 months", "3 months"];

export const INSTRUCTION_OPTIONS = [
  "After food",
  "Before food",
  "Empty stomach",
  "At bedtime",
  "Dissolve in water",
  "Avoid coffee & mint",
];

export const formatDosage = (item) =>
  [item?.frequency, item?.duration, item?.instructions].filter(Boolean).join(" · ");
