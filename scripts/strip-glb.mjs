/**
 * Strip every embedded image from a GLB, keeping geometry only.
 *
 * heart_in_glass.glb ships 7 baked textures and weighs 12.9MB — unusable for a
 * hero. We re-texture the model in code anyway (dark volcanic rock on the heart,
 * glass on the shell), so the baked maps are dead weight. Dropping them leaves
 * the 868-triangle mesh at a few tens of KB.
 *
 * usage: node scripts/strip-glb.mjs <in.glb> <out.glb>
 */
import fs from "node:fs";

const [IN, OUT] = [process.argv[2], process.argv[3]];
const src = fs.readFileSync(IN);
if (src.slice(0, 4).toString() !== "glTF") throw new Error("not a GLB");

const jsonLen = src.readUInt32LE(12);
const json = JSON.parse(src.slice(20, 20 + jsonLen).toString("utf8"));
const bin = src.slice(20 + jsonLen + 8);

// Keep only the bufferViews the accessors actually reference.
const keep = new Map();
const chunks = [];
let offset = 0;
for (const acc of json.accessors ?? []) {
  if (acc.bufferView == null || keep.has(acc.bufferView)) continue;
  const bv = json.bufferViews[acc.bufferView];
  const start = bv.byteOffset ?? 0;
  const data = bin.slice(start, start + bv.byteLength);
  const pad = (4 - (offset % 4)) % 4;
  if (pad) { chunks.push(Buffer.alloc(pad)); offset += pad; }
  keep.set(acc.bufferView, {
    index: keep.size,
    def: { buffer: 0, byteOffset: offset, byteLength: bv.byteLength, ...(bv.byteStride != null ? { byteStride: bv.byteStride } : {}) },
  });
  chunks.push(data);
  offset += bv.byteLength;
}

for (const acc of json.accessors ?? []) {
  if (acc.bufferView != null) acc.bufferView = keep.get(acc.bufferView).index;
}
json.bufferViews = [...keep.values()].sort((a, b) => a.index - b.index).map((v) => v.def);

// Drop the image pipeline entirely, and every material reference into it.
delete json.images;
delete json.textures;
delete json.samplers;
for (const m of json.materials ?? []) {
  delete m.emissiveTexture;
  delete m.normalTexture;
  delete m.occlusionTexture;
  const p = m.pbrMetallicRoughness;
  if (p) { delete p.baseColorTexture; delete p.metallicRoughnessTexture; }
}

const newBin = Buffer.concat(chunks);
json.buffers = [{ byteLength: newBin.length }];

const jsonBuf = Buffer.from(JSON.stringify(json), "utf8");
const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
const jsonChunk = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);
const binPad = (4 - (newBin.length % 4)) % 4;
const binChunk = Buffer.concat([newBin, Buffer.alloc(binPad)]);

const header = Buffer.alloc(12);
header.write("glTF", 0, "ascii");
header.writeUInt32LE(2, 4);
header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binChunk.length, 8);

const jsonHdr = Buffer.alloc(8);
jsonHdr.writeUInt32LE(jsonChunk.length, 0);
jsonHdr.write("JSON", 4, "ascii");
const binHdr = Buffer.alloc(8);
binHdr.writeUInt32LE(binChunk.length, 0);
binHdr.write("BIN\0", 4, "ascii");

fs.writeFileSync(OUT, Buffer.concat([header, jsonHdr, jsonChunk, binHdr, binChunk]));
console.log(
  `${IN} ${(src.length / 1048576).toFixed(2)}MB -> ${OUT} ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`
);
