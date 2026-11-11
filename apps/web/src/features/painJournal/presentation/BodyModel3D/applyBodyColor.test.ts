import { Group, Mesh, MeshStandardMaterial } from 'three';
import { expect, it, vi } from 'vitest';
import { applyBodyColor } from './applyBodyColor';

it('TC-860 — đổi màu hình người, giữ vùng raycast và khôi phục vật liệu khi tháo', () => {
  const model = new Group();
  const original = new MeshStandardMaterial();
  const body = new Mesh(undefined, original);
  const region = new Mesh(undefined, original);
  region.name = 'region__knee__left';
  model.add(body, region);
  const restore = applyBodyColor(model, 'red');
  const colored = body.material as MeshStandardMaterial;
  const dispose = vi.spyOn(colored, 'dispose');
  expect(colored).not.toBe(original);
  expect(colored.color.getHex()).toBe(0xff0000);
  expect(original.color.getHex()).toBe(0xffffff);
  expect(region.material).toBe(original);
  restore();
  expect(body.material).toBe(original);
  expect(dispose).toHaveBeenCalledOnce();
});
