// Hotspot definitions by body part (matches `guessBodyPartFromMeshName`).
// Use `anchor: { ux, uy, uz }` with each value in [0,1]: position = lerp(min, max, u) per axis
// of the union bounding box of the selected part’s mesh(es). This stays correct after
// HumanModel centers/scales the GLB (fixed world coords would drift to wrong screen areas).

import * as THREE from "three";

const RUBRIC_SAMPLES = [
  { id: "gen1", subsection: "General", title: "Pain, stitching" },
  { id: "gen2", subsection: "General", title: "Weakness, sudden" },
  { id: "mod1", subsection: "Modalities", title: "Worse motion" },
  { id: "mod2", subsection: "Modalities", title: "Better rest" },
];

function hs(id, name, anchor, rubrics = RUBRIC_SAMPLES) {
  return { id, name, anchor, rubrics };
}

export const HOTSPOTS_BY_PART = {
  Head: [
    hs(1, "Eyes", { ux: 0.5, uy: 0.58, uz: 0.88 }),
    // Nose / Ear: swapped anchors vs first bbox guess (this GLB maps lateral ↔ front on these fractions).
    hs(2, "Nose", { ux: 0.88, uy: 0.52, uz: 0.48 }),
    hs(3, "Ear", { ux: 0.5, uy: 0.46, uz: 0.96 }),
    hs(4, "Vertex", { ux: 0.5, uy: 0.94, uz: 0.5 }),
  ],
  head: [
    hs(1, "Eyes", { ux: 0.5, uy: 0.58, uz: 0.88 }),
    hs(2, "Nose", { ux: 0.88, uy: 0.52, uz: 0.48 }),
    hs(3, "Ear", { ux: 0.5, uy: 0.46, uz: 0.96 }),
  ],
  Chest: [
    hs(1, "Sternum", { ux: 0.5, uy: 0.55, uz: 0.58 }),
    hs(2, "Heart", { ux: 0.42, uy: 0.52, uz: 0.55 }),
  ],
  chest: [
    hs(1, "Sternum", { ux: 0.5, uy: 0.55, uz: 0.58 }),
    hs(2, "Heart region", { ux: 0.42, uy: 0.52, uz: 0.55 }),
  ],
  Abdomen: [hs(1, "Navel", { ux: 0.5, uy: 0.45, uz: 0.55 })],
  stomach: [
    hs(1, "Epigastrium", { ux: 0.5, uy: 0.62, uz: 0.58 }),
    hs(2, "Umbilical region", { ux: 0.5, uy: 0.48, uz: 0.56 }),
  ],
  neck: [hs(1, "Cervical spine", { ux: 0.5, uy: 0.5, uz: 0.35 })],
  back: [
    hs(1, "Scapula", { ux: 0.35, uy: 0.62, uz: 0.45 }),
    hs(2, "Lumbar", { ux: 0.5, uy: 0.38, uz: 0.42 }),
  ],
  left_hand: [hs(1, "Wrist", { ux: 0.55, uy: 0.45, uz: 0.55 })],
  right_hand: [hs(1, "Wrist", { ux: 0.45, uy: 0.45, uz: 0.55 })],
  left_leg: [hs(1, "Knee", { ux: 0.55, uy: 0.52, uz: 0.52 })],
  right_leg: [hs(1, "Knee", { ux: 0.45, uy: 0.52, uz: 0.52 })],
  "Male reproductive": [hs(1, "Pelvic floor", { ux: 0.5, uy: 0.42, uz: 0.62 })],
  "Female reproductive": [
    hs(1, "Pelvic region", { ux: 0.5, uy: 0.45, uz: 0.6 }),
    hs(2, "Lower abdomen", { ux: 0.5, uy: 0.58, uz: 0.58 }),
  ],
  men_reproducible_part: [hs(1, "Pelvic floor", { ux: 0.5, uy: 0.42, uz: 0.62 })],
};

/**
 * Map anchor-based hotspot defs to world-space positions from the selected meshes’ AABB.
 */
export function resolveHotspotsToWorld(hotspots, partMeshes) {
  if (!hotspots?.length) return [];
  const list = Array.isArray(partMeshes) ? partMeshes.filter((m) => m?.isMesh) : [];
  if (!list.length) return [];

  const box = new THREE.Box3();
  let hasBox = false;
  list.forEach((m) => {
    const b = new THREE.Box3().setFromObject(m);
    if (b.isEmpty()) return;
    if (!hasBox) {
      box.copy(b);
      hasBox = true;
    } else {
      box.union(b);
    }
  });
  if (!hasBox || box.isEmpty()) return [];

  return hotspots.map((h) => {
    const a = h.anchor;
    if (a && [a.ux, a.uy, a.uz].every((n) => Number.isFinite(n))) {
      const x = THREE.MathUtils.lerp(box.min.x, box.max.x, THREE.MathUtils.clamp(a.ux, 0, 1));
      const y = THREE.MathUtils.lerp(box.min.y, box.max.y, THREE.MathUtils.clamp(a.uy, 0, 1));
      const z = THREE.MathUtils.lerp(box.min.z, box.max.z, THREE.MathUtils.clamp(a.uz, 0, 1));
      const { anchor, ...rest } = h;
      return { ...rest, position: [x, y, z] };
    }
    if (Array.isArray(h.position) && h.position.length >= 3) {
      return { ...h, position: [...h.position] };
    }
    return h;
  });
}

/** Map API hotspot rows to anchor-based defs for 3D placement on the selected part bbox. */
export function mapApiHotspotsForViewer(apiList) {
  if (!apiList?.length) return [];
  const count = apiList.length;
  return apiList.map((item, index) => {
    const spread = count === 1 ? 0.5 : index / (count - 1);
    return {
      id: item.sectionHotspotId ?? item.sectionHotspotID,
      name: item.hotspotName || "Hotspot",
      sectionId: item.sectionId,
      anchor: {
        ux: THREE.MathUtils.clamp(0.32 + spread * 0.36, 0.12, 0.88),
        uy: THREE.MathUtils.clamp(0.42 + (index % 3) * 0.1, 0.2, 0.82),
        uz: THREE.MathUtils.clamp(0.48 + ((index * 0.19) % 0.34), 0.15, 0.9),
      },
      rubrics: [],
    };
  });
}

export function getHotspotsForPart(partName) {
  if (!partName) return [];
  if (HOTSPOTS_BY_PART[partName]) return HOTSPOTS_BY_PART[partName];
  const lower = String(partName).toLowerCase();
  const key = Object.keys(HOTSPOTS_BY_PART).find((k) => k.toLowerCase() === lower);
  if (key) return HOTSPOTS_BY_PART[key];
  const aliases = {
    "Chest/Stomach": HOTSPOTS_BY_PART.Chest || HOTSPOTS_BY_PART.chest,
    Unknown: [],
    women_reproducible_part: HOTSPOTS_BY_PART["Female reproductive"],
    men_reproducible_part: HOTSPOTS_BY_PART["Male reproductive"],
  };
  return aliases[partName] || [];
}
