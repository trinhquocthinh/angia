const GLB_MAGIC = 0x46546c67; // "glTF"
const JSON_CHUNK = 0x4e4f534a; // "JSON"

/** Đọc tên node từ chunk JSON đầu tiên của GLB (glTF 2.0 binary); không giải nén mesh. */
export function readGlbNodeNames(glb: Uint8Array): string[] {
  const view = new DataView(glb.buffer, glb.byteOffset, glb.byteLength);
  if (
    glb.byteLength < 20 ||
    view.getUint32(0, true) !== GLB_MAGIC ||
    view.getUint32(16, true) !== JSON_CHUNK
  ) {
    throw new Error('Không phải tệp GLB hợp lệ (thiếu header glTF hoặc chunk JSON).');
  }
  const jsonText = new TextDecoder().decode(glb.subarray(20, 20 + view.getUint32(12, true)));
  const { nodes = [] } = JSON.parse(jsonText) as { nodes?: { name?: string }[] };
  return nodes.map((node) => node.name).filter((name): name is string => Boolean(name));
}
