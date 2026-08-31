// Utilities to keep mesh/body-part handling extensible.

export function guessBodyPartFromMeshName(meshName) {
  if (!meshName) return "Unknown";

  const n = String(meshName).toLowerCase().trim();

  // Explicit mapping for your current GLB naming.
  // Examples:
  // head_front, head_back, left_arm_front, right_leg_back, chest_stomac_front, reproducible_part
  if (n === "heap") return "Head"; // seen in your mesh list
  if (n.startsWith("head_")) return "Head";
  if (n.startsWith("left_arm_")) return "Left Arm";
  if (n.startsWith("right_arm_")) return "Right Arm";
  if (n.startsWith("left_leg_")) return "Left Leg";
  if (n.startsWith("right_leg_")) return "Right Leg";
  if (n === "back") return "Back";
  if (n === "stomach") return "stomach";
  if (n === "chest") return "chest";
  if (n === "neck") return "neck";
  if (n === "head") return "head";
  if (n === "left_hand") return "left_hand";
  if (n === "right_hand") return "right_hand";
  if (n === "left_leg") return "left_leg";
  if (n === "right_leg") return "right_leg";
  if (n === "men_reproducible_part") return "Male reproductive";
  if (n === "women_reproducible_part") return "Female reproductive";
  if (n.startsWith("chest_stomac_")) return "Chest/Stomach";
  if (n === "reproducible_part") return "Reproductive";

  // Fallback: treat full name as its own body part.
  return meshName;
}

export function groupMeshesByBodyPart(meshNames) {
  const groups = {};
  (meshNames || []).forEach((name) => {
    const part = guessBodyPartFromMeshName(name);
    if (!groups[part]) groups[part] = [];
    groups[part].push(name);
  });

  // stable ordering
  Object.keys(groups).forEach((k) => groups[k].sort());
  return groups;
}

