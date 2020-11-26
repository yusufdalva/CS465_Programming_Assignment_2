let gl;
let canvas;
let program;
let approxSides = 10;
let spherePointCount;
let toSubdivide = 5;

let sphereMetadata = {};
let cylinderMetadata = {};
let prismMetadata = {};

let vertexCount = 0;

let alpha = [0, 0, 0, 0, 0, 0, 180, 0, 180, 0, 0]; // alpha is the joint angle

let torsoId = 0;
let leftTentacleId  = 1;
let rightTentacleId = 2;
let lowerTorsoId = 3;

//left side of spider
let leftUpperLeg1Id = 4;
let leftMidLeg1Id = 5;
let leftLowerLeg1Id = 6;

let leftUpperLeg2Id = 7;
let leftMidLeg2Id = 8;
let leftLowerLeg2Id = 9;

let leftUpperLeg3Id = 10;
let leftMidLeg3Id = 11;
let leftLowerLeg3Id = 12;

let leftUpperLeg4Id = 13;
let leftMidLeg4Id = 14;
let leftLowerLeg4Id = 15;

//right side of spider
let rightUpperLeg1Id = 16;
let rightMidLeg1Id = 17;
let rightLowerLeg1Id = 18;

let rightUpperLeg2Id = 19;
let rightMidLeg2Id = 20;
let rightLowerLeg2Id = 21;

let rightUpperLeg3Id = 22;
let rightMidLeg3Id = 23;
let rightLowerLeg3Id = 24;

let rightUpperLeg4Id = 25;
let rightMidLeg4Id = 26;
let rightLowerLeg4Id = 27;


//sizes of body parts uydurdum değiştiririz

let torsoHeight = 4.0;
let torsoWidth = 2.0;

let upperLegHeight = 5.0;
let upperLegWidth = 1.0;

let midLegHeight = 4.0;
let midLegWidth = 1.0;

let lowerLegHeight = 3.0;
let lowerLegWidth = 1.0;

let tentacleHeight = 3.0;
let tentacleMid = 0.5;

let indexOffset = 0;
let vertexOffset = 0;


let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let modelViewMatrix, projectionMatrix;
let modelViewMatrixLoc, projectionMatrixLoc;

let numNodes = 28;
let stack = [];

let spider = [];

// for( let i=0; i<numNodes; i++) spider[i] = createNode(null, null, null, null);

function init() {
    canvas = document.getElementById("gl-canvas");
    gl = WebGLUtils.setupWebGL(canvas);
    if (!gl) {
        alert("Your browser does not support WebGL");
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);
    gl.enable(gl.DEPTH_TEST);

    // Generate Sphere Points

    // Generate Cylinder Points - uses index structure
    let cylinder = getPrism(30, 0, 0.5, 0.5, vertexCount);
    let cylinderVertices = cylinder[0];
    vertexCount += cylinderVertices.length;
    let cylinderIndices = cylinder[1];
    cylinderMetadata.noOfSides = 30;
    cylinderMetadata.vertexCount = cylinderVertices.length;
    cylinderMetadata.vertices = cylinderVertices;
    cylinderMetadata.indexCount = cylinderIndices.length;
    cylinderMetadata.indices = cylinderIndices;

    // Generate Square Prism - uses index structure
    let prism = getPrism(4, 0, 0.5, 0.5, vertexCount);
    let prismVertices = prism[0];
    vertexCount += prismVertices.length;
    let prismIndices = prism[1];
    prismMetadata.noOfSides = 4;
    prismMetadata.vertexCount = prismVertices.length;
    prismMetadata.vertices = prismVertices;
    prismMetadata.indexCount = prismIndices.length;
    prismMetadata.indices = prismIndices;

    let sphere = tetrahedron(toSubdivide);
    let sphereVertices = sphere[1];
    vertexCount += sphereVertices.length;
    spherePointCount = sphere[0];
    sphereMetadata.vertexCount = sphereVertices.length;
    sphereMetadata.vertices = sphereVertices;

    let indices = cylinderIndices.concat(prismIndices);

    let vertices = cylinderVertices;
    vertices = vertices.concat(prismVertices);
    vertices = vertices.concat(sphereVertices);

    console.log("Total number of vertices: " + vertices.length.toString());
    console.log("Total Number of indices: " + indices.length.toString());


    let iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    // modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    // projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );

    // for(let i=0; i<numNodes; i++) initNodes(i);

    render();
}

window.onload = init;

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    //renderSphere();
    renderCylinder();
    //renderPrism();
    //traverse(torsoId);
    requestAnimFrame(render);
}

function renderSphere() {
    for (let pointIdx = 0; pointIdx < sphereMetadata.vertexCount; pointIdx += 3) {
        gl.drawArrays(gl.LINE_LOOP, pointIdx + cylinderMetadata.vertexCount + prismMetadata.vertexCount, 3); // Render in triangular wires
    }
}

function renderCylinder() {
    let drawnPoints = 0;
    gl.drawElements(gl.LINE_LOOP, cylinderMetadata.noOfSides, gl.UNSIGNED_BYTE, Uint8Array.BYTES_PER_ELEMENT * drawnPoints);
    drawnPoints += cylinderMetadata.noOfSides;
    gl.drawElements(gl.LINE_LOOP, cylinderMetadata.noOfSides, gl.UNSIGNED_BYTE, Uint8Array.BYTES_PER_ELEMENT * drawnPoints);
    drawnPoints += cylinderMetadata.noOfSides;
    gl.drawElements(gl.LINE_LOOP, cylinderMetadata.indexCount - drawnPoints, gl.UNSIGNED_BYTE, Uint8Array.BYTES_PER_ELEMENT * drawnPoints);

}

function renderPrism() {
    let drawnPoints = 0;
    gl.drawElements(gl.LINE_LOOP, prismMetadata.noOfSides, gl.UNSIGNED_BYTE,
        Uint8Array.BYTES_PER_ELEMENT * (drawnPoints + cylinderMetadata.indexCount));
    drawnPoints += prismMetadata.noOfSides;
    gl.drawElements(gl.LINE_LOOP, prismMetadata.noOfSides, gl.UNSIGNED_BYTE,
        Uint8Array.BYTES_PER_ELEMENT * (drawnPoints + cylinderMetadata.indexCount));
    drawnPoints += prismMetadata.noOfSides;
    gl.drawElements(gl.LINE_LOOP, prismMetadata.indexCount - drawnPoints, gl.UNSIGNED_BYTE,
        Uint8Array.BYTES_PER_ELEMENT * (drawnPoints + cylinderMetadata.indexCount));
}

/*
function createNode(transform, render, sibling, child){
    return {
        transform: transform,
        render: render,
        sibling: sibling,
        child: child,
    }; // Returns a single node
}

function traverse(Id) {

   if(Id == null) return;
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   spider[Id].render();
   if(spider[Id].child != null) traverse(figure[Id].child);
    modelViewMatrix = stack.pop();
   if(spider[Id].sibling != null) traverse(figure[Id].sibling);
}

//initializing nodes
function initNodes(Id) {

    let m = mat4();

    switch(Id) {

    case torsoId:

    m = rotate(alpha[torsoId], 0, 1, 0 );
	//m = translate(x,y,z); // root a tüm örümceğe yaptırmak isteğimiz hareketleri koymalıyız
    spider[torsoId] = createNode( m, torso, null, headId );
    break;

    case leftTentacleId:
	m = translate(-(torsoWidth/2), torsoHeight+0.5*tentacleHeigt, 0.0);
    spider[leftTentacleId] = createNode( m, tentacle, rightTentacleId, null);
    break;

	case rightTentacleId:
	m = translate(torsoWidth/2, torsoHeight+0.5*tentacleHeigt, 0.0);
    spider[rightTentacleId] = createNode( m, tentacle, lowerTorsoId, null);
    break;

	case lowerTorsoId:
	m = translate(0.0, -(torsoHeight+0.1*lowerLegHeight), 0.0);
	m = mult(m,rotate(alpha[lowerTorsoId],1,0,0));
	spider[lowerTorsoId] = createNode(m,lowerTorso,leftUpperLeg1Id,null);
	break;

	//left upper legs
    case leftUpperLeg1Id:
	m = translate(-(torsoWidth+upperLegWidth), 0.8*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[leftUpperLeg1Id],1,0,0));
	spider[leftUpperLeg1Id] = createNode(m,upperLeg,leftUpperLeg2Id,leftMidLeg1Id);
	break;

	case leftUpperLeg2Id:
	m = translate(-(torsoWidth+upperLegWidth), 0.5*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[leftUpperLeg2Id],1,0,0));
	spider[leftUpperLeg2Id] = createNode(m,upperLeg,leftUpperLeg3Id,leftMidLeg2Id);
	break;

	case leftUpperLeg3Id:
	m = translate(-(torsoWidth+upperLegWidth), 0.3*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[leftUpperLeg3Id],1,0,0));
	spider[leftUpperLeg3Id] = createNode(m,upperLeg,leftUpperLeg4Id,leftMidLeg3Id);
	break;

	case leftUpperLeg4Id:
	m = translate(-(torsoWidth+upperLegWidth), 0.1*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[leftUpperLeg4Id],1,0,0));
	spider[leftUpperLeg3Id] = createNode(m,upperLeg,rightUpperLeg1Id,leftMidLeg4Id);
	break;

	//right upper legs
	case rightUpperLeg1Id:
	m = translate((torsoWidth+upperLegWidth), 0.8*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[rightUpperLeg1Id],1,0,0));
	spider[rightUpperLeg1Id] = createNode(m,upperLeg,rightUpperLeg2Id,rightMidLeg1Id);
	break;

	case rightUpperLeg2Id:
	m = translate((torsoWidth+upperLegWidth), 0.5*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[rightUpperLeg2Id],1,0,0));
	spider[rightUpperLeg2Id] = createNode(m,upperLeg,rightUpperLeg3Id,rightMidLeg2Id);
	break;

	case rightUpperLeg3Id:
	m = translate((torsoWidth+upperLegWidth), 0.3*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[rightUpperLeg3Id],1,0,0));
	spider[rightUpperLeg3Id] = createNode(m,upperLeg,rightUpperLeg4Id,rightMidLeg3Id);
	break;

	case rightUpperLeg4Id:
	m = translate((torsoWidth+upperLegWidth), 0.1*torsoHeight, 0.0);
	m = mult(m,rotate(alpha[rightUpperLeg4Id],1,0,0));
	spider[rightUpperLeg2Id] = createNode(m,upperLeg,null,rightMidLeg4Id);
	break;

	//left mid legs
	case leftMidLeg1Id:
	m = translate(-upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftMidLeg1Id],1,0,0));
	spider[leftMidLeg1Id] = createNode(m,midLeg,null,leftLowerLeg1Id);
	break;

	case leftMidLeg2Id:
	m = translate(-upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftMidLeg2Id],1,0,0));
	spider[leftMidLeg2Id] = createNode(m,midLeg,null,leftLowerLeg2Id);
	break;

	case leftMidLeg3Id:
	m = translate(-upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftMidLeg3Id],1,0,0));
	spider[leftMidLeg3Id] = createNode(m,midLeg,null,leftLowerLeg3Id);
	break;

	case leftMidLeg4Id:
	m = translate(-upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftMidLeg4Id],1,0,0));
	spider[leftMidLeg4Id] = createNode(m,midLeg,null,leftLowerLeg4Id);
	break;

    //right mid legs
	case rightMidLeg1Id:
	m = translate(upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightMidLeg1Id],1,0,0));
	spider[rightMidLeg1Id] = createNode(m,midLeg,null,rightLowerLeg1Id);
	break;

	case rightMidLeg2Id:
	m = translate(upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightMidLeg2Id],1,0,0));
	spider[rightMidLeg2Id] = createNode(m,midLeg,null,rightLowerLeg2Id);
	break;

	case rightMidLeg3Id:
	m = translate(upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightMidLeg3Id],1,0,0));
	spider[rightMidLeg3Id] = createNode(m,midLeg,null,rightLowerLeg3Id);
	break;

	case rightMidLeg4Id:
	m = translate(upperLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightMidLeg4Id],1,0,0));
	spider[rightMidLeg4Id] = createNode(m,midLeg,null,rightLowerLeg4Id);
	break;

	//left lower legs
	case leftLowerLeg1Id:
	m = translate(-midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftLowerLeg1Id],1,0,0));
	spider[leftLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	break;

	case leftLowerLeg2Id:
	m = translate(-midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftLowerLeg2Id],1,0,0));
	spider[leftLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	break;

	case leftLowerLeg3Id:
	m = translate(-midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftLowerLeg3Id],1,0,0));
	spider[leftLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	break;

	case leftLowerLeg4Id:
	m = translate(-midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[leftLowerLeg4Id],1,0,0));
	spider[leftLowerLeg4Id] = createNode(m,lowerLeg,null,null);
	break;

	//right lower legs
	case rightLowerLeg1Id:
	m = translate(midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightLowerLeg1Id],1,0,0));
	spider[rightLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	break;

	case rightLowerLeg2Id:
	m = translate(midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightLowerLeg2Id],1,0,0));
	spider[rightLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	break;

	case rightLowerLeg3Id:
	m = translate(midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightLowerLeg3Id],1,0,0));
	spider[rightLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	break;

	case rightLowerLeg4Id:
	m = translate(midLegHeight, 0.0, 0.0);
	m = mult(m,rotate(alpha[rightLowerLeg4Id],1,0,0));
	spider[rightLowerLeg4Id] = createNode(m,lowerLeg,null,null);
	break;


    }


}
*/

