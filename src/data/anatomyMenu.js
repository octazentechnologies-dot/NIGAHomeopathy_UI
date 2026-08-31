// Right-side accordion menu (modeled after your reference UI).
// Each item maps to one of the detected GLB "parts" (from `guessBodyPartFromMeshName`).

export const ANATOMY_MENU = [
  {
    id: "mind",
    title: "Mind",
    items: [{ id: "mind_general", label: "General", part: null }],
  },
  {
    id: "headneck",
    title: "Head and Neck",
    items: [{ id: "head", label: "Head", part: "Head" }],
  },
  {
    id: "brain_nerves",
    title: "Brain and Nerves",
    items: [{ id: "head2", label: "Head", part: "Head" }],
  },
  {
    id: "eyes",
    title: "Eyes",
    items: [{ id: "eyes", label: "Head (Eyes)", part: "Head" }],
  },
  {
    id: "mouth",
    title: "Mouth",
    items: [{ id: "mouth", label: "Head (Mouth)", part: "Head" }],
  },
  {
    id: "ent",
    title: "Ear, Nose & Throat",
    items: [{ id: "ent", label: "Head (ENT)", part: "Head" }],
  },
  {
    id: "bjm",
    title: "Bones, Joints, Muscles",
    items: [
      { id: "left_arm", label: "Left Arm", part: "Left Arm" },
      { id: "right_arm", label: "Right Arm", part: "Right Arm" },
      { id: "left_leg", label: "Left Leg", part: "Left Leg" },
      { id: "right_leg", label: "Right Leg", part: "Right Leg" },
    ],
  },
  {
    id: "blood_lymph",
    title: "Blood, Lymphatic Fluid",
    items: [{ id: "chest", label: "Chest/Stomach", part: "Chest/Stomach" }],
  },
  {
    id: "skin",
    title: "Skin",
    items: [{ id: "skin", label: "Back (Skin)", part: "Back" }],
  },
  {
    id: "general",
    title: "General",
    items: [{ id: "general2", label: "Back", part: "Back" }],
  },
  {
    id: "infectious",
    title: "Infectious Diseases",
    items: [{ id: "infectious2", label: "Chest/Stomach", part: "Chest/Stomach" }],
  },
  {
    id: "autoimmune",
    title: "Autoimmune Diseases",
    items: [{ id: "autoimmune2", label: "Chest/Stomach", part: "Chest/Stomach" }],
  },
  {
    id: "repro",
    title: "Reproductive",
    items: [{ id: "repro2", label: "Reproductive", part: "Reproductive" }],
  },
];

