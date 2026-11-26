import type { TryOnMaterial } from './tryOnMaterials';

export interface MaterialGroup {
  id: string;
  title: string;
  titleZh: string;
  materials: TryOnMaterial[];
}

/** Group only the supplied matches, so favorites and search never leak unfiltered variants. */
export function groupMaterials(materials: readonly TryOnMaterial[]): MaterialGroup[] {
  const groups = new Map<string, MaterialGroup>();
  for (const material of materials) {
    const pose = material.pose;
    const paired = material.role === 'pose' && material.poseReference && pose;
    const id = paired
      ? `${pose.groupId}:${pose.posture}:${pose.cameraHeight}:${pose.framing}`
      : material.id;
    const group = groups.get(id);
    if (group) group.materials.push(material);
    else
      groups.set(id, {
        id,
        title: paired ? material.title.split(' · ')[0] : material.title,
        titleZh: paired ? material.titleZh.split('・')[0] : material.titleZh,
        materials: [material],
      });
  }
  return [...groups.values()];
}
