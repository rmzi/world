import { NodeIO, Document } from '@gltf-transform/core';
import { dedup, prune } from '@gltf-transform/functions';

const io = new NodeIO();

// Load the model
const doc = await io.read('./model.glb');
const root = doc.getRoot();

// Find all nodes and their indices
const nodes = root.listNodes();
const nodeNames = nodes.map(n => n.getName());

console.log('All nodes:', nodeNames);

// Find the head bone index
const headIndex = nodeNames.indexOf('Head');
const neckIndex = nodeNames.indexOf('Neck');
console.log(`Head bone index: ${headIndex}, Neck bone index: ${neckIndex}`);

// Get the skin to find joint indices
const skins = root.listSkins();
if (skins.length === 0) {
    console.error('No skin found!');
    process.exit(1);
}

const skin = skins[0];
const joints = skin.listJoints();
const jointNames = joints.map(j => j.getName());
console.log('Joints in skin:', jointNames);

// Find head-related joint indices within the skin
const headJointIdx = jointNames.indexOf('Head');
const neckJointIdx = jointNames.indexOf('Neck');
console.log(`Head joint index in skin: ${headJointIdx}, Neck joint index in skin: ${neckJointIdx}`);

// Get the mesh
const meshes = root.listMeshes();
const mesh = meshes[0];
const primitives = mesh.listPrimitives();
const prim = primitives[0];

// Get vertex attributes
const positionAccessor = prim.getAttribute('POSITION');
const normalAccessor = prim.getAttribute('NORMAL');
const texcoordAccessor = prim.getAttribute('TEXCOORD_0');
const jointsAccessor = prim.getAttribute('JOINTS_0');
const weightsAccessor = prim.getAttribute('WEIGHTS_0');
const indicesAccessor = prim.getIndices();

const positions = positionAccessor.getArray();
const normals = normalAccessor.getArray();
const texcoords = texcoordAccessor.getArray();
const jointIndices = jointsAccessor.getArray();
const weights = weightsAccessor.getArray();
const indices = indicesAccessor.getArray();

const vertexCount = positions.length / 3;
console.log(`Total vertices: ${vertexCount}`);

// Determine which vertices belong to the head
// A vertex belongs to head if its dominant weight is on head/neck joints
const headJoints = new Set([headJointIdx, neckJointIdx]);
const headVertices = new Set();

// Height threshold - head should be roughly above y=1.5 (adjust based on model)
const HEAD_Y_THRESHOLD = 1.45;

for (let v = 0; v < vertexCount; v++) {
    const y = positions[v * 3 + 1];
    
    // Check if vertex is high enough to be head
    if (y >= HEAD_Y_THRESHOLD) {
        // Also verify it's weighted to head/neck bones
        let headWeight = 0;
        for (let j = 0; j < 4; j++) {
            const jointIdx = jointIndices[v * 4 + j];
            const weight = weights[v * 4 + j];
            if (headJoints.has(jointIdx)) {
                headWeight += weight;
            }
        }
        
        // If significantly weighted to head/neck, include it
        if (headWeight > 0.3 || y > 1.55) {
            headVertices.add(v);
        }
    }
}

console.log(`Head vertices: ${headVertices.size}`);

// Create a mapping from old vertex index to new vertex index
const oldToNew = new Map();
const newPositions = [];
const newNormals = [];
const newTexcoords = [];

let newIdx = 0;
for (const oldIdx of headVertices) {
    oldToNew.set(oldIdx, newIdx++);
    
    newPositions.push(
        positions[oldIdx * 3],
        positions[oldIdx * 3 + 1],
        positions[oldIdx * 3 + 2]
    );
    newNormals.push(
        normals[oldIdx * 3],
        normals[oldIdx * 3 + 1],
        normals[oldIdx * 3 + 2]
    );
    newTexcoords.push(
        texcoords[oldIdx * 2],
        texcoords[oldIdx * 2 + 1]
    );
}

// Filter triangles - only keep those where all 3 vertices are head vertices
const newIndices = [];
for (let i = 0; i < indices.length; i += 3) {
    const a = indices[i];
    const b = indices[i + 1];
    const c = indices[i + 2];
    
    if (headVertices.has(a) && headVertices.has(b) && headVertices.has(c)) {
        newIndices.push(oldToNew.get(a), oldToNew.get(b), oldToNew.get(c));
    }
}

console.log(`New vertices: ${newPositions.length / 3}, New triangles: ${newIndices.length / 3}`);

// Create new document with just the head
const headDoc = new Document();
const buffer = headDoc.createBuffer();

// Create accessors
const newPosAccessor = headDoc.createAccessor()
    .setArray(new Float32Array(newPositions))
    .setType('VEC3')
    .setBuffer(buffer);

const newNormAccessor = headDoc.createAccessor()
    .setArray(new Float32Array(newNormals))
    .setType('VEC3')
    .setBuffer(buffer);

const newTexAccessor = headDoc.createAccessor()
    .setArray(new Float32Array(newTexcoords))
    .setType('VEC2')
    .setBuffer(buffer);

const newIdxAccessor = headDoc.createAccessor()
    .setArray(new Uint16Array(newIndices))
    .setType('SCALAR')
    .setBuffer(buffer);

// Copy the texture from original
const originalTextures = root.listTextures();
let baseColorTexture = null;
let normalTexture = null;

// Find and copy textures
const materials = root.listMaterials();
if (materials.length > 0) {
    const mat = materials[0];
    baseColorTexture = mat.getBaseColorTexture();
    normalTexture = mat.getNormalTexture();
}

// Create new texture copies
let newBaseColorTex = null;
let newNormalTex = null;

if (baseColorTexture) {
    const imgData = baseColorTexture.getImage();
    const mimeType = baseColorTexture.getMimeType();
    newBaseColorTex = headDoc.createTexture()
        .setImage(imgData)
        .setMimeType(mimeType);
}

if (normalTexture) {
    const imgData = normalTexture.getImage();
    const mimeType = normalTexture.getMimeType();
    newNormalTex = headDoc.createTexture()
        .setImage(imgData)
        .setMimeType(mimeType);
}

// Create material
const newMaterial = headDoc.createMaterial('head_material')
    .setDoubleSided(true)
    .setRoughnessFactor(0.7)
    .setMetallicFactor(0.0);

if (newBaseColorTex) {
    newMaterial.setBaseColorTexture(newBaseColorTex);
}
if (newNormalTex) {
    newMaterial.setNormalTexture(newNormalTex);
}

// Create primitive and mesh
const newPrim = headDoc.createPrimitive()
    .setAttribute('POSITION', newPosAccessor)
    .setAttribute('NORMAL', newNormAccessor)
    .setAttribute('TEXCOORD_0', newTexAccessor)
    .setIndices(newIdxAccessor)
    .setMaterial(newMaterial);

const newMesh = headDoc.createMesh('head').addPrimitive(newPrim);

// Create node and scene
const newNode = headDoc.createNode('Head').setMesh(newMesh);
const newScene = headDoc.createScene('Scene').addChild(newNode);

// Clean up
await headDoc.transform(dedup(), prune());

// Write output
await io.write('./head.glb', headDoc);
console.log('Wrote head.glb');
