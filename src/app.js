let gl;
let canvas;
let program;
let spherePointCount;
let toSubdivide = 4;

let sphereMetadata = {};
let cylinderMetadata = {};
let prismMetadata = {};

let vertexCount = 0;

let alpha = [0, 0, 0, 0, 135, 0, 180, 135, 0, 0, 225,0,0,225,0,0,45,0,0,45,0,0,315,0,0,315,0,0]; // alpha is the joint angle

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

let modelViewMatrix, projectionMatrix;
let mvMatrixLoc, prjMatrixLoc;

let instanceMatrix;

let numNodes = 28;
let stack = [];

let spider = [];

for( let i=0; i<numNodes; i++) { // Preparing necessary variables
    spider[i] = createNode(null, null, null, null);
}

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
    let cylinder = getPrism(30, 0, 0.2, 5, vertexCount);
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

    // All data transfer to the buffers are done here
    let iBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint8Array(indices), gl.STATIC_DRAW);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);

    mvMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    prjMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

    instanceMatrix = mat4(); // Initialize as identity matrix
    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();

    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );

    for(let i=0; i< numNodes; i++) initNodes(i);

    render();
}

window.onload = init;

function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    traverse(torsoId);
    requestAnimFrame(render);
}

// Renders a sphere primitive
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
   console.log(Id);
   console.log(spider[Id]);
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, spider[Id].transform);
   spider[Id].render();
   if(spider[Id].child != null) traverse(spider[Id].child);
    modelViewMatrix = stack.pop();
   if(spider[Id].sibling != null) traverse(spider[Id].sibling);
}



//initializing nodes
function initNodes(partId) {

    let m = mat4();
    m = mult(m, scale4(0.7, 0.7, 0.7));

    switch (partId) {
        case torsoId:
            m = mult(m, rotate(alpha[torsoId], 0, 1, 0)); // Rotate around y - by euler angle
            spider[torsoId] = createNode(m, torso, null, leftTentacleId);
            break;
        case leftTentacleId:
            m = translate(-(torsoWidth/2), torsoHeight,0.0);
            m = mult(m, rotate(alpha[leftTentacleId], 0, 1, 0));
            spider[leftTentacleId] = createNode(m, tentacle, rightTentacleId, null);
            break;

        case rightTentacleId:
            m = translate(torsoWidth/2, torsoHeight, 0.0);
            spider[rightTentacleId] = createNode(m, tentacle, lowerTorsoId, null);
            break;

        case lowerTorsoId:
            m = translate(0.0, -(2.1* torsoHeight), 0.0);
            spider[lowerTorsoId] = createNode(m, lowerTorso, leftUpperLeg1Id, null);
            break;
        // Left Leg 1
        case leftUpperLeg1Id:
            m = translate(-(torsoWidth * 0.8), 0.7 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[leftUpperLeg1Id], 0, 0, 1));
            spider[leftUpperLeg1Id] = createNode(m,upperLeg,leftUpperLeg2Id,leftMidLeg1Id);
            break;

        case leftMidLeg1Id:
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[leftMidLeg1Id],1,0,0));
            spider[leftMidLeg1Id] = createNode(m, midLeg,null,leftLowerLeg1Id);
            break;	
		    
	case leftLowerLeg1Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftLowerLeg1Id],1,0,0));
	    spider[leftLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	    break;
	//left leg 2
	case leftUpperLeg2Id:
            m = translate(-(torsoWidth * 0.95), 0.3 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[leftUpperLeg2Id], 0, 0, 1));
            spider[leftUpperLeg2Id] = createNode(m,upperLeg,leftUpperLeg3Id,leftMidLeg2Id);
            break;

        case leftMidLeg2Id:
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[leftMidLeg2Id],1,0,0));
            spider[leftMidLeg2Id] = createNode(m, midLeg,null,leftLowerLeg2Id);
            break;
		    
	case leftLowerLeg2Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftLowerLeg2Id],1,0,0));
	    spider[leftLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	    break;
	
	//left leg 3
	case leftUpperLeg3Id:
	     m = translate(-(torsoWidth), -0.4*torsoHeight, 0.0);
	     m = mult(m,rotate(alpha[leftUpperLeg3Id],0,0,1));
	     spider[leftUpperLeg3Id] = createNode(m,upperLeg,leftUpperLeg4Id,leftMidLeg3Id);
	     break;
	
	case leftMidLeg3Id:
	     m = translate(2*upperLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftMidLeg3Id],0,0,1));
	     spider[leftMidLeg3Id] = createNode(m,midLeg,null,leftLowerLeg3Id);
	     break;
		
	case leftLowerLeg3Id:
	     m = translate(2*midLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftLowerLeg3Id],0,0,1));
	     spider[leftLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	     break;
			
	//left leg 4
	case leftUpperLeg4Id:
	     m = translate(-(0.7*torsoWidth), -0.8*torsoHeight, 0.0);
	     m = mult(m,rotate(alpha[leftUpperLeg4Id],0,0,1));
	     spider[leftUpperLeg4Id] = createNode(m,upperLeg,rightUpperLeg1Id,leftMidLeg4Id);
	     break;
	
	case leftMidLeg4Id:
             m = translate(2*upperLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftMidLeg4Id],0,0,1));
	     spider[leftMidLeg4Id] = createNode(m,midLeg,null,leftLowerLeg4Id);
	     break;
		
	case leftLowerLeg4Id:
	     m = translate(2*midLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftLowerLeg4Id],0,0,1));
	     spider[leftLowerLeg4Id] = createNode(m,lowerLeg,null,null);
	     break;
	//right leg 1
	case rightUpperLeg1Id:
            m = translate((torsoWidth * 0.8), 0.7 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg1Id], 0, 0, 1));
            spider[rightUpperLeg1Id] = createNode(m,upperLeg,rightUpperLeg2Id,rightMidLeg1Id);
            break;

        case rightMidLeg1Id:
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg1Id],1,0,0));
            spider[rightMidLeg1Id] = createNode(m, midLeg,null,rightLowerLeg1Id);
            break;
			
	case rightLowerLeg1Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg1Id],1,0,0));
	    spider[rightLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	    break;
			
	//right leg 2
	case rightUpperLeg2Id:
            m = translate((torsoWidth * 0.95), 0.3 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg2Id], 0, 0, 1));
            spider[rightUpperLeg2Id] = createNode(m,upperLeg,rightUpperLeg3Id,rightMidLeg2Id);
            break;

        case rightMidLeg2Id:
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg2Id],1,0,0));
            spider[rightMidLeg2Id] = createNode(m, midLeg,null,rightLowerLeg2Id);
            break;
			
	case rightLowerLeg2Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg2Id],1,0,0));
	    spider[rightLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	    break;
	//right leg 3
	case rightUpperLeg3Id:
            m = translate((torsoWidth), -0.4*torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg3Id], 0, 0, 1));
            spider[rightUpperLeg3Id] = createNode(m,upperLeg,rightUpperLeg4Id,rightMidLeg3Id);
            break;

        case rightMidLeg3Id:
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg3Id],1,0,0));
            spider[rightMidLeg3Id] = createNode(m, midLeg,null,rightLowerLeg3Id);
            break;
			
	case rightLowerLeg3Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg3Id],1,0,0));
	    spider[rightLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	    break;
	//right leg 4
	case rightUpperLeg4Id:
            m = translate((0.7*torsoWidth), -0.8*torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg4Id], 0, 0, 1));
            spider[rightUpperLeg4Id] = createNode(m,upperLeg,null,rightMidLeg4Id);
            break;

        case rightMidLeg4Id:
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg4Id],1,0,0));
            spider[rightMidLeg4Id] = createNode(m, midLeg,null,rightLowerLeg4Id);
            break;
			
	case rightLowerLeg4Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg4Id],1,0,0));
	    spider[rightLowerLeg4Id] = createNode(m,lowerLeg,null,null);
	    break;
    }
}



// Render Functions for parts
// Applies post-multiplication
function torso() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderSphere();
}

function tentacle() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, tentacleHeight * 0.35, 0));
    instanceMatrix = mult(instanceMatrix, scale4(tentacleMid, tentacleHeight, tentacleMid));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderPrism();
}

function lowerTorso() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerTorsoWidth, lowerTorsoHeight, lowerTorsoWidth));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderSphere();
}

function upperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegHeight, upperLegWidth, upperLegHeight));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderCylinder();
}

function midLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(midLegHeight, midLegWidth, midLegHeight));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderCylinder();
}

function lowerLeg(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegHeight, lowerLegWidth, lowerLegHeight));
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderCylinder();
}


