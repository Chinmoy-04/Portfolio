import { DataTexture, FloatType, NearestFilter, RGBAFormat } from "three";
import type { Cloud } from "./sample";

/*
  Packs emblem clouds into one floating-point texture (RGBA = x, y, z, accent).
  Particle i of emblem e lives at texel (i % width, e * rowsPerEmblem + i / width).
  The shader picks an emblem by its row offset, so switching emblems is one
  uniform, with no upload.
*/
export type TargetAtlas = {
  texture: DataTexture;
  width: number;
  rowsPerEmblem: number;
};

export function packTargets(clouds: Cloud[], count: number): TargetAtlas {
  const width = Math.ceil(Math.sqrt(count));
  const rowsPerEmblem = Math.ceil(count / width);
  const height = rowsPerEmblem * clouds.length;
  const data = new Float32Array(width * height * 4);

  clouds.forEach((cloud, e) => {
    if (cloud.length < count * 4) throw new Error(`Emblem ${e} has fewer than ${count} points`);
    data.set(cloud.subarray(0, count * 4), e * rowsPerEmblem * width * 4);
  });

  const texture = new DataTexture(data, width, height, RGBAFormat, FloatType);
  texture.minFilter = NearestFilter;
  texture.magFilter = NearestFilter;
  texture.needsUpdate = true;
  return { texture, width, rowsPerEmblem };
}
