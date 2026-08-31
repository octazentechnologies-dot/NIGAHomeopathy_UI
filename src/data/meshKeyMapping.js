import { groupMeshesByBodyPart } from "./bodyParts";

/** Map admin mesh-key labels (API) to grouped GLB part names from `guessBodyPartFromMeshName`. */
const MESH_KEY_TO_PART = {
  head: "Head",
  eye: "Head",
  eyes: "Head",
  ear: "Head",
  nose: "Head",
  mouth: "Head",
  mind: "Head",
  vertigo: "Head",
  "left arm": "Left Arm",
  "right arm": "Right Arm",
  "left leg": "Left Leg",
  "right leg": "Right Leg",
  back: "Back",
  chest: "Chest/Stomach",
  stomach: "Chest/Stomach",
  "chest/stomach": "Chest/Stomach",
  reproductive: "Reproductive",
  "male reproductive": "Male reproductive",
  "female reproductive": "Female reproductive",
};

function norm(s) {
  return String(s || "")
    .trim()
    .toLowerCase();
}

/**
 * Resolve GLB mesh names for a mesh-key master record name (e.g. "Head", "Eye").
 */
export function resolveMeshesForMeshKey(meshKeyName, meshNames) {
  const groups = groupMeshesByBodyPart(meshNames || []);
  const key = norm(meshKeyName);

  if (!key) {
    return { partName: "", meshes: [] };
  }

  for (const [part, meshes] of Object.entries(groups)) {
    if (norm(part) === key) {
      return { partName: part, meshes };
    }
  }

  const mappedPart = MESH_KEY_TO_PART[key];
  if (mappedPart && groups[mappedPart]?.length) {
    return { partName: mappedPart, meshes: groups[mappedPart] };
  }

  const byName = (meshNames || []).filter((name) => norm(name).includes(key));
  if (byName.length) {
    return { partName: meshKeyName, meshes: byName };
  }

  return { partName: meshKeyName, meshes: [] };
}

/** Find API mesh-key record for a GLB body part (e.g. click "Head" → Head mesh key). */
export function findMeshKeyForPart(partName, meshKeys, meshNames) {
  const part = norm(partName);
  if (!part || !meshKeys?.length) return null;

  const exact = meshKeys.find(
    (k) => norm(k.ThreeD_BodyPart_MeshKey_Name) === part
  );
  if (exact) return exact;

  for (const key of meshKeys) {
    const { partName: mapped } = resolveMeshesForMeshKey(
      key.ThreeD_BodyPart_MeshKey_Name,
      meshNames
    );
    if (norm(mapped) === part) return key;
  }

  return null;
}
