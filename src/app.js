let gl;
let canvas;
let program;
let spherePointCount;
let toSubdivide = 4;

var radius = 0.3;
var theta  = 0.0;
var phi    = 0.0;
var dr = 5.0 * Math.PI/180.0;

let sphereMetadata = {};
let cylinderMetadata = {};
let prismMetadata = {};

let animationFrames= "";
let currentFrame = "";
let keyFrame = 0;
let blockAnimation = false;

let vertexCount = 0;

let alpha = [ // alpha is the joint angle
    [0, 30, 115],      // torso
    [0, 30, 0],     // leftTentacle
    [0, 0, 0],      // rightTentacle
    [0, 0, 0],      // lowerTorso
    [0, 35, 135],    // leftUpperLeg1
    [0, 25, 0],      // leftMidLeg1
    [0, 30, 0],      // leftLowerLeg1
    [0, 35, 135],    // leftUpperLeg2
    [0, 25, 0],      // leftMidLeg2Id
    [0, 30, 0],      // leftLowerLeg2
    [0, 35, 200],    // leftUpperLeg3
    [0, 25, 0],      // leftMidLeg3
    [0, 30, 0],      // leftLowerLeg3
    [0, 35, 225],    // leftUpperLeg4
    [0, 25, 0],      // leftMidLeg4
    [0, 30, 0],      // leftLowerLeg4
    [0, 35, 35],     // rightUpperLeg1
    [0, 25, 0],      // rightMidLeg1
    [0, 30, 0],      // rightLowerLeg1
    [0, 35, 35],     // rightUpperLeg2
    [0, 25, 0],      // rightMidLeg2
    [0, 30, 0],      // rightLowerLeg2
    [0, 35, 315],    // rightUpperLeg3
    [0, 25, 0],      // rightMidLeg3
    [0, 30, 0],      // rightLowerLeg3
    [0, 35, 315],    // rightUpperLeg4
    [0, 25, 0],      // rightMidLeg4
    [0, 30, 0]       // rightLowerLeg4
];

moveAmounts = [0,0,0];
let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

//light stuff
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.7, 0.3, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var ambientColor, diffuseColor, specularColor;
var materialShininess = 500.0;
let modelViewMatrix, projectionMatrix;
let mvMatrixLoc, prjMatrixLoc;

var normalMatrix, normalMatrixLoc;

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
    gl.clearColor(0.0, 0.0, 0.0, 0.0);

    
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ambientProduct = mult(lightAmbient, materialAmbient);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
    specularProduct = mult(lightSpecular, materialSpecular);
  
  // Generate Sphere Points
    let sphere = tetrahedron(toSubdivide);
    let sphereVertices = sphere[1];
    let sphereNormals = sphere[2];
    vertexCount += sphereVertices.length;
    spherePointCount = sphere[0];
    sphereMetadata.vertexCount = sphereVertices.length;
    sphereMetadata.vertices = sphereVertices;
    sphereMetadata.normals = sphereNormals;
  
    

    // Generate Cylinder Points - uses index structure
    let cylinder = getPrism(30, 0, 0.2, 5, vertexCount);
    let cylinderVertices = cylinder[0];
    vertexCount += cylinderVertices.length;
    let cylinderIndices = cylinder[1];
    let cylinderNormals = cylinder[2];
    cylinderMetadata.noOfSides = 30;
    cylinderMetadata.vertexCount = cylinderVertices.length;
    cylinderMetadata.vertices = cylinderVertices;
    //cylinderMetadata.indexCount = cylinderIndices.length;
    //cylinderMetadata.indices = cylinderIndices;
    cylinderMetadata.normals = cylinderNormals;

  

    // Generate Square Prism - uses index structure
    let prism = getPrism(4, 2, 0.5, 0.5, vertexCount);
    let prismVertices = prism[0];
    vertexCount += prismVertices.length;
    let prismIndices = prism[1];
    let prismNormals = prism[2];
    prismMetadata.noOfSides = 4;
    prismMetadata.vertexCount = prismVertices.length;
    prismMetadata.vertices = prismVertices;
    prismMetadata.normals = prismNormals;

    // All data transfer to the buffers are done here

      //NORMALS
    
    //SPHERE BUFFERS
    let vertices = sphereMetadata.vertices;
    vertices = vertices.concat(cylinderMetadata.vertices);
    vertices = vertices.concat(prismMetadata.vertices);

    let normals = sphereMetadata.normals;
    normals = normals.concat(cylinderMetadata.normals);
    normals = normals.concat(prismMetadata.normals);

    let nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );

    let vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vNormal);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);


    mvMatrixLoc = gl.getUniformLocation(program, "modelViewMatrix");
    prjMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );

    instanceMatrix = mat4(); // Initialize as identity matrix
    projectionMatrix = ortho(-canvas.width/40, canvas.width/40, -canvas.height/40, canvas.height/40,-25.0,25.0);
	
    modelViewMatrix = mat4();
    normalMatrix = mat3();
    
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv( gl.getUniformLocation( program, "normalMatrix"), false, flatten(normalMatrix));
    document.getElementById("Button2").onclick = function(){theta += dr;};
    document.getElementById("Button3").onclick = function(){theta -= dr;};
    document.getElementById("Button4").onclick = function(){phi += dr;};
    document.getElementById("Button5").onclick = function(){phi -= dr;};

    for(let i=0; i< numNodes; i++) initNodes(i);
    gl.uniform4fv( gl.getUniformLocation(program, 
        "ambientProduct"),flatten(ambientProduct) );
     gl.uniform4fv( gl.getUniformLocation(program, 
        "diffuseProduct"),flatten(diffuseProduct) );
     gl.uniform4fv( gl.getUniformLocation(program, 
        "specularProduct"),flatten(specularProduct) );	
     gl.uniform4fv( gl.getUniformLocation(program, 
        "lightPosition"),flatten(lightPosition) );
     gl.uniform1f( gl.getUniformLocation(program, 
        "shininess"),materialShininess );
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
        gl.drawArrays(gl.TRIANGLES, pointIdx, 3); // Render in triangular wires
    }
}

function renderCylinder() {
    let drawnPoints = 0;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + sphereMetadata.vertexCount, cylinderMetadata.noOfSides);
    drawnPoints += cylinderMetadata.noOfSides;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + sphereMetadata.vertexCount, cylinderMetadata.noOfSides);
    drawnPoints += cylinderMetadata.noOfSides;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + sphereMetadata.vertexCount, cylinderMetadata.vertexCount - drawnPoints);
}

function renderPrism() {
    let drawnPoints = 0;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + cylinderMetadata.vertexCount + sphereMetadata.vertexCount, prismMetadata.noOfSides);
    drawnPoints += prismMetadata.noOfSides;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + cylinderMetadata.vertexCount + sphereMetadata.vertexCount, prismMetadata.noOfSides);
    drawnPoints += prismMetadata.noOfSides;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + cylinderMetadata.vertexCount + sphereMetadata.vertexCount, prismMetadata.vertexCount - drawnPoints);
}

function scale4(a, b, c) {
    var result = mat4();
    result[0][0] = a;
    result[1][1] = b;
    result[2][2] = c;
    return result;
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
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, spider[Id].transform);
   eye = vec3(radius*Math.sin(theta)*Math.cos(phi), 
        radius*Math.sin(theta)*Math.sin(phi), radius*Math.cos(theta));
    modelViewMatrix = mult(modelViewMatrix,lookAt(eye,at,up));
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
        case torsoId: // y - DONE

            m = mult(m, rotate(alpha[torsoId][2], 0, 0, 1));
            m = mult(m, rotate(alpha[torsoId][1], 0, 1,0)); // Rotate around y - by euler angle
            m = mult(m, rotate(alpha[torsoId][0], 1, 0, 0));
            m = mult(m,translate(moveAmounts[0],moveAmounts[1],moveAmounts[2]));
            spider[torsoId] = createNode(m, torso, null, leftTentacleId);
            break;
        case leftTentacleId: // y - DONE
            m = translate(-(torsoWidth/2), torsoHeight,0.0);
            m = mult(m, rotate(alpha[leftTentacleId][2], 0, 0, 1));
            m = mult(m, rotate(alpha[leftTentacleId][1], 0, 1, 0));
            m = mult(m, rotate(alpha[leftTentacleId][0], 1, 0, 0));
            spider[leftTentacleId] = createNode(m, tentacle, rightTentacleId, null);
            break;

        case rightTentacleId: // y - DONE
            m = translate(torsoWidth/2, torsoHeight, 0.0);
            m = mult(m, rotate(alpha[rightTentacleId][2], 0, 0, 1));
            m = mult(m, rotate(alpha[rightTentacleId][1], 0, 1, 0));
            m = mult(m, rotate(alpha[rightTentacleId][0], 1, 0, 0));
            spider[rightTentacleId] = createNode(m, tentacle, lowerTorsoId, null);
            break;

        case lowerTorsoId: // DONE
            m = translate(0.0, -(2.1* torsoHeight), 0.0);
            spider[lowerTorsoId] = createNode(m, lowerTorso, leftUpperLeg1Id, null);
            break;
        // Left Leg 1
        case leftUpperLeg1Id: // z - DONE
            m = translate(-(torsoWidth * 0.7), 0.7 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[leftUpperLeg1Id][2], 0, 0, 1));
            m = mult(m,rotate(alpha[leftUpperLeg1Id][1], 0, 1, 0));
            m = mult(m,rotate(alpha[leftUpperLeg1Id][0], 1, 0, 0));
            spider[leftUpperLeg1Id] = createNode(m,upperLeg,leftUpperLeg2Id,leftMidLeg1Id);
            break;

        case leftMidLeg1Id: // z
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[leftMidLeg1Id][2],0,0,1));
            m = mult(m,rotate(alpha[leftMidLeg1Id][1],0,1,0));
            m = mult(m,rotate(alpha[leftMidLeg1Id][0],1,0,0));
            spider[leftMidLeg1Id] = createNode(m, midLeg,null,leftLowerLeg1Id);
            break;	
	
	case leftLowerLeg1Id: // z
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftLowerLeg1Id][2],0,0,1));
        m = mult(m,rotate(alpha[leftLowerLeg1Id][1],0,1,0));
        m = mult(m,rotate(alpha[leftLowerLeg1Id][0],1,0,0));
	    spider[leftLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	    break;
	//left leg 2
	case leftUpperLeg2Id: // z
        m = translate(-(torsoWidth * 0.9), 0.3 * torsoHeight, 0.0);
        m = mult(m,rotate(alpha[leftUpperLeg2Id][2], 0, 0, 1));
        m = mult(m,rotate(alpha[leftUpperLeg2Id][1], 0, 1, 0));
        m = mult(m,rotate(alpha[leftUpperLeg2Id][0], 1, 0, 0));
        spider[leftUpperLeg2Id] = createNode(m,upperLeg,leftUpperLeg3Id,leftMidLeg2Id);
        break;

        case leftMidLeg2Id: // z
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[leftMidLeg2Id][2],0,0,1));
            m = mult(m,rotate(alpha[leftMidLeg2Id][1],0,1,0));
            m = mult(m,rotate(alpha[leftMidLeg2Id][0],1,0,0));
            spider[leftMidLeg2Id] = createNode(m, midLeg,null,leftLowerLeg2Id);
            break;
		    
	case leftLowerLeg2Id: // z
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftLowerLeg2Id][2],0,0,1));
        m = mult(m,rotate(alpha[leftLowerLeg2Id][1],0,1,0));
        m = mult(m,rotate(alpha[leftLowerLeg2Id][0],1,0,0));
	    spider[leftLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	    break;
	
	//left leg 3
	case leftUpperLeg3Id: // z
	     m = translate(-(0.85*torsoWidth), -0.4*torsoHeight, 0.0);
	     m = mult(m,rotate(alpha[leftUpperLeg3Id][2],0,0,1));
	     m = mult(m,rotate(alpha[leftUpperLeg3Id][1],0,1,0));
	     m = mult(m,rotate(alpha[leftUpperLeg3Id][0],1,0,0));
	     spider[leftUpperLeg3Id] = createNode(m,upperLeg,leftUpperLeg4Id,leftMidLeg3Id);
	     break;
	
	case leftMidLeg3Id: // z
	     m = translate(2*upperLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftMidLeg3Id][2],0,0,1));
	     m = mult(m,rotate(alpha[leftMidLeg3Id][1],0,1,0));
	     m = mult(m,rotate(alpha[leftMidLeg3Id][0],1,0,0));
	     spider[leftMidLeg3Id] = createNode(m,midLeg,null,leftLowerLeg3Id);
	     break;
		
	case leftLowerLeg3Id: // z
	     m = translate(2*midLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftLowerLeg3Id][2],0,0,1));
	     m = mult(m,rotate(alpha[leftLowerLeg3Id][1],0,1,0));
	     m = mult(m,rotate(alpha[leftLowerLeg3Id][0],1,0,0));
	     spider[leftLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	     break;
			
	//left leg 4
	case leftUpperLeg4Id: // z
	     m = translate(-(0.6*torsoWidth), -0.8*torsoHeight, 0.0);
	     m = mult(m,rotate(alpha[leftUpperLeg4Id][2],0,0,1));
	     m = mult(m,rotate(alpha[leftUpperLeg4Id][1],0,1,0));
	     m = mult(m,rotate(alpha[leftUpperLeg4Id][0],1,0,0));
	     spider[leftUpperLeg4Id] = createNode(m,upperLeg,rightUpperLeg1Id,leftMidLeg4Id);
	     break;
	
	case leftMidLeg4Id: // z
	    m = translate(2*upperLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftMidLeg4Id][2],0,0,1));
        m = mult(m,rotate(alpha[leftMidLeg4Id][1],0,1,0));
        m = mult(m,rotate(alpha[leftMidLeg4Id][0],1,0,0));
	    spider[leftMidLeg4Id] = createNode(m,midLeg,null,leftLowerLeg4Id);
	    break;
		
	case leftLowerLeg4Id: // z
	     m = translate(2*midLegHeight, 0.0, 0.0);
	     m = mult(m,rotate(alpha[leftLowerLeg4Id][2],0,0,1));
         m = mult(m,rotate(alpha[leftLowerLeg4Id][1],0,1,0));
         m = mult(m,rotate(alpha[leftLowerLeg4Id][0],1,0,0));
	     spider[leftLowerLeg4Id] = createNode(m,lowerLeg,null,null);
	     break;
	//right leg 1
	case rightUpperLeg1Id: // z
        m = translate((torsoWidth * 0.7), 0.7 * torsoHeight, 0.0);
        m = mult(m,rotate(alpha[rightUpperLeg1Id][2], 0, 0, 1));
        m = mult(m,rotate(alpha[rightUpperLeg1Id][1], 0, 1, 0));
        m = mult(m,rotate(alpha[rightUpperLeg1Id][0], 1, 0, 0));
        spider[rightUpperLeg1Id] = createNode(m,upperLeg,rightUpperLeg2Id,rightMidLeg1Id);
        break;

        case rightMidLeg1Id: // z
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg1Id][2],0,0,1));
            m = mult(m,rotate(alpha[rightMidLeg1Id][1],0,1,0));
            m = mult(m,rotate(alpha[rightMidLeg1Id][0],1,0,0));
            spider[rightMidLeg1Id] = createNode(m, midLeg,null,rightLowerLeg1Id);
            break;
			
	case rightLowerLeg1Id: // z
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg1Id][2],0,0,1));
        m = mult(m,rotate(alpha[rightLowerLeg1Id][1],0,1,0));
        m = mult(m,rotate(alpha[rightLowerLeg1Id][0],1,0,0));
	    spider[rightLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	    break;
			
	//right leg 2
	case rightUpperLeg2Id: // z
	    m = translate((0.9*torsoWidth * 0.95), 0.3 * torsoHeight, 0.0);
	    m = mult(m,rotate(alpha[rightUpperLeg2Id][2], 0, 0, 1));
        m = mult(m,rotate(alpha[rightUpperLeg2Id][1], 0, 1, 0));
        m = mult(m,rotate(alpha[rightUpperLeg2Id][0], 1, 0, 0));
	    spider[rightUpperLeg2Id] = createNode(m,upperLeg,rightUpperLeg3Id,rightMidLeg2Id);
	    break;

        case rightMidLeg2Id: // z
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg2Id][2],0,0,1));
            m = mult(m,rotate(alpha[rightMidLeg2Id][1],0,1,0));
            m = mult(m,rotate(alpha[rightMidLeg2Id][0],1,0,0));
            spider[rightMidLeg2Id] = createNode(m, midLeg,null,rightLowerLeg2Id);
            break;
			
	case rightLowerLeg2Id: // z
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg2Id][2],0,0,1));
        m = mult(m,rotate(alpha[rightLowerLeg2Id][1],0,1,0));
        m = mult(m,rotate(alpha[rightLowerLeg2Id][0],1,0,0));
	    spider[rightLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	    break;
	//right leg 3
	case rightUpperLeg3Id: // z
        m = translate((0.85*torsoWidth), -0.4*torsoHeight, 0.0);
        m = mult(m,rotate(alpha[rightUpperLeg3Id][2], 0, 0, 1));
        m = mult(m,rotate(alpha[rightUpperLeg3Id][1], 0, 1, 0));
        m = mult(m,rotate(alpha[rightUpperLeg3Id][0], 1, 0, 0));
        spider[rightUpperLeg3Id] = createNode(m,upperLeg,rightUpperLeg4Id,rightMidLeg3Id);
        break;

        case rightMidLeg3Id: // z
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg3Id][2],0,0,1));
            m = mult(m,rotate(alpha[rightMidLeg3Id][1],0,1,0));
            m = mult(m,rotate(alpha[rightMidLeg3Id][0],1,0,0));
            spider[rightMidLeg3Id] = createNode(m, midLeg,null,rightLowerLeg3Id);
            break;
			
	case rightLowerLeg3Id: // z
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg3Id][2],0,0,1));
        m = mult(m,rotate(alpha[rightLowerLeg3Id][1],0,1,0));
        m = mult(m,rotate(alpha[rightLowerLeg3Id][0],1,0,0));
	    spider[rightLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	    break;
	//right leg 4
	case rightUpperLeg4Id: // z
        m = translate((0.6*torsoWidth), -0.8*torsoHeight, 0.0);
        m = mult(m,rotate(alpha[rightUpperLeg4Id][2], 0, 0, 1));
        m = mult(m,rotate(alpha[rightUpperLeg4Id][1], 0, 1, 0));
        m = mult(m,rotate(alpha[rightUpperLeg4Id][0], 1, 0, 0));
        spider[rightUpperLeg4Id] = createNode(m,upperLeg,null,rightMidLeg4Id);
        break;

        case rightMidLeg4Id: // z
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg4Id][2],0,0,1));
            m = mult(m,rotate(alpha[rightMidLeg4Id][1],0,1,0));
            m = mult(m,rotate(alpha[rightMidLeg4Id][0],1,0,0));
            spider[rightMidLeg4Id] = createNode(m, midLeg,null,rightLowerLeg4Id);
            break;
			
	case rightLowerLeg4Id: // z
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg4Id][2],0,0,1));
        m = mult(m,rotate(alpha[rightLowerLeg4Id][1],0,1,0));
        m = mult(m,rotate(alpha[rightLowerLeg4Id][0],1,0,0));
	    spider[rightLowerLeg4Id] = createNode(m,lowerLeg,null,null);
	    break;
    }
}



// Render Functions for parts
// Applies post-multiplication
function torso() {
    
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(torsoWidth, torsoHeight, torsoWidth));
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderSphere();
}

function tentacle() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, tentacleHeight * 0.35, 0));
    instanceMatrix = mult(instanceMatrix, scale4(tentacleMid, tentacleHeight, tentacleMid));
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderPrism();
}

function lowerTorso() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerTorsoWidth, lowerTorsoHeight, lowerTorsoWidth));
   normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderSphere();
}

function upperLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(upperLegHeight, upperLegWidth, upperLegHeight));
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderCylinder();
}

function midLeg() {
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(midLegHeight, midLegWidth, midLegHeight));
   normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderCylinder();
}

function lowerLeg(){
    instanceMatrix = mult(modelViewMatrix, translate(0.0, 0.0, 0.0));
    instanceMatrix = mult(instanceMatrix, scale4(lowerLegHeight, lowerLegWidth, lowerLegHeight));
    normalMatrix = [
        vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
        vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
        vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])
    ];
    gl.uniformMatrix3fv(normalMatrixLoc, false, flatten(normalMatrix) );
    gl.uniformMatrix4fv(mvMatrixLoc, false, flatten(instanceMatrix));
    renderCylinder();
}
//*********FRAMES AND ANIMATIONS******************** */
//ADDING FRAMES 
function addFrame(){
    
    currentFrame = alpha[torsoId][0] +","+ alpha[torsoId][1] +","+ alpha[torsoId][2] +"," + alpha[leftTentacleId][0] +","
    + alpha[leftTentacleId][1] +","+ alpha[leftTentacleId][2] +"," + alpha[rightTentacleId][0] +","
    + alpha[rightTentacleId][1] +","+ alpha[rightTentacleId][2] +"," + alpha[lowerTorsoId][0] +","
    + alpha[lowerTorsoId][1] +","+ alpha[lowerTorsoId][2] +"," + alpha[leftUpperLeg1Id][0] +","
    + alpha[leftUpperLeg1Id][1] +","+ alpha[leftUpperLeg1Id][2] +","+ alpha[leftMidLeg1Id][0] +","
    + alpha[leftMidLeg1Id][1] +","+ alpha[leftMidLeg1Id][2] +"," + alpha[leftLowerLeg1Id][0] +","
    + alpha[leftLowerLeg1Id][1] +","+ alpha[leftLowerLeg1Id][2] +"," + alpha[leftUpperLeg2Id][0] +","
    + alpha[leftUpperLeg2Id][1] +","+ alpha[leftUpperLeg2Id][2] +","+ alpha[leftMidLeg2Id][0] +","
    + alpha[leftMidLeg2Id][1] +","+ alpha[leftMidLeg2Id][2] +"," + alpha[leftLowerLeg2Id][0] +","
    + alpha[leftLowerLeg2Id][1] +","+ alpha[leftLowerLeg2Id][2] +"," + alpha[leftUpperLeg3Id][0] +","
    + alpha[leftUpperLeg3Id][1] +","+ alpha[leftUpperLeg3Id][2] +","+ alpha[leftMidLeg3Id][0] +","
    + alpha[leftMidLeg3Id][1] +","+ alpha[leftMidLeg3Id][2] +"," + alpha[leftLowerLeg3Id][0] +","
    + alpha[leftLowerLeg3Id][1] +","+ alpha[leftLowerLeg3Id][2] +"," + alpha[leftUpperLeg4Id][0] +","
    + alpha[leftUpperLeg4Id][1] +","+ alpha[leftUpperLeg4Id][2] +","+ alpha[leftMidLeg4Id][0] +","
    + alpha[leftMidLeg4Id][1] +","+ alpha[leftMidLeg4Id][2] +"," + alpha[leftLowerLeg4Id][0] +","
    + alpha[leftLowerLeg4Id][1] +","+ alpha[leftLowerLeg4Id][2] +","+ alpha[rightUpperLeg1Id][0] +","
    + alpha[rightUpperLeg1Id][1] +","+ alpha[rightUpperLeg1Id][2] +","+ alpha[rightMidLeg1Id][0] +","
    + alpha[rightMidLeg1Id][1] +","+ alpha[rightMidLeg1Id][2] +"," + alpha[rightLowerLeg1Id][0] +","
    + alpha[rightLowerLeg1Id][1] +","+ alpha[rightLowerLeg1Id][2] +"," + alpha[rightUpperLeg2Id][0] +","
    + alpha[rightUpperLeg2Id][1] +","+ alpha[rightUpperLeg2Id][2] +","+ alpha[rightMidLeg2Id][0] +","
    + alpha[rightMidLeg2Id][1] +","+ alpha[rightMidLeg2Id][2] +"," + alpha[rightLowerLeg2Id][0] +","
    + alpha[rightLowerLeg2Id][1] +","+ alpha[rightLowerLeg2Id][2] +"," + alpha[rightUpperLeg3Id][0] +","
    + alpha[rightUpperLeg3Id][1] +","+ alpha[rightUpperLeg3Id][2] +","+ alpha[rightMidLeg3Id][0] +","
    + alpha[rightMidLeg3Id][1] +","+ alpha[rightMidLeg3Id][2] +"," + alpha[rightLowerLeg3Id][0] +","
    + alpha[rightLowerLeg3Id][1] +","+ alpha[rightLowerLeg3Id][2] +"," + alpha[rightUpperLeg4Id][0] +","
    + alpha[rightUpperLeg4Id][1] +","+ alpha[rightUpperLeg4Id][2] +","+ alpha[rightMidLeg4Id][0] +","
    + alpha[rightMidLeg4Id][1] +","+ alpha[rightMidLeg4Id][2] +"," + alpha[rightLowerLeg4Id][0] +","
    + alpha[rightLowerLeg4Id][1] +","+ alpha[rightLowerLeg4Id][2] + "," + moveAmounts[0] +","
    + moveAmounts[1] +","+ moveAmounts[2];
    animationFrames += currentFrame +  "\n";//each frame is splited bu new line
}

//downloading frames to txt file 
function saveAnimation() {
    let file = new Blob([animationFrames], {type: "text"});
    let filename = "Animation.txt"
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        let a = document.createElement("a"),
        url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

//LOAD ANIMATION FILE
function loadAnimation(){
    var files = event.target.files;
    var txt = files[0].text();
    txt.then(function(content_read){
        animationFrames = content_read;
    })
}

/**
 * References:
 *		https://github.com/celikkoseoglu/CS465-Bilkent/tree/master/Assignment2
 *
**/

function renderKeyFrame() {
    var frame = animationFrames.split("\n");

    if (blockAnimation == false) {
        console.log(frame[keyFrame]);
        processFrameMovement(frame[keyFrame]);
        keyFrame++;
    }
}

//Animation start
function playAnimation() {
    keyFrame = 0;
    setInterval(renderKeyFrame, 10);
}


/**
 *Processes frame movements by 30 factor which is half of fp this is for a more smooth animation
 * References:
 *		https://github.com/celikkoseoglu/CS465-Bilkent/tree/master/Assignment2
**/
function processFrameMovement(frames) {
    if (frames) {
        let fullMotion = ""; 
        let txtFrames = frames.split(",");
        //console.log(txtFrames);
        blockAnimation = true; 
        let counter = 0;
        let nodeId = 0;
        for (var j = 0; j < 30; j++) { 
            nodeId = 0;
            counter = 0;
            for (var i = 0; i < txtFrames.length; i += 3){
                let differenceX;
                let differenceY;
                let differenceZ;
                //console.log("i = " + i);
                //console.log("txt length = " + txtFrames.length);
                if(i < txtFrames.length - 3){
                    counter = i;
                    differenceX = parseFloat(txtFrames[counter]) - alpha[nodeId][0];
                    //console.log(differenceX);
                    ++counter;
                    differenceY = parseFloat(txtFrames[counter]) - alpha[nodeId][1];
                    //console.log(differenceY);
                    ++counter;
                    differenceZ = parseFloat(txtFrames[counter]) - alpha[nodeId][2];
                    //console.log(differenceZ);
                    nodeId++;
                }
                
    
                if(i == txtFrames.length - 3){
                   
                    counter = i;
                    differenceX = parseFloat(txtFrames[counter]) - moveAmounts[0];
                    ++counter;
                    differenceY = parseFloat(txtFrames[counter]) - moveAmounts[1];
                    ++counter;
                    differenceZ = parseFloat(txtFrames[counter]) - moveAmounts[2];
                }
                var movingX = (differenceX / 30);
                var movingY = (differenceY / 30);
                var movingZ = (differenceZ / 30);
    
                fullMotion +=  movingX + "," + movingY + "," + movingZ + ",";
            }
            
            fullMotion = fullMotion.substring(0, fullMotion.length - 1); 
            fullMotion += "\n";
        }
        runAnimation(fullMotion);
    }
}

/**
 *,This function renders frame by frame by adding the frame values and alpha values to generate movement
 * References:
 *		https://github.com/celikkoseoglu/CS465-Bilkent/tree/master/Assignment2
**/ 
function runAnimation(fullMotion) {
    let j = 0;
    let motionByKeyFrame = fullMotion.split("\n");
    
    function animate() {
        setTimeout(function () {
            var movement = motionByKeyFrame[j].split(',');
            let counter = 0;
            let nodeId = 0;
            for (var k = 0; k < movement.length; k+=3) {
                
                if(k < movement.length - 3){
                    counter = k;
                    alpha[nodeId][0] = alpha[nodeId][0] + parseFloat(movement[counter]);
                    counter++;
                    alpha[nodeId][1] = alpha[nodeId][1] + parseFloat(movement[counter]);
                    counter++;
                    alpha[nodeId][2] = alpha[nodeId][2] + parseFloat(movement[counter]);
                    nodeId++;
                }
                if(k == movement.length-3){
                    counter = k;
                    moveAmounts[0] = moveAmounts[0] + parseFloat(movement[counter]);
                    counter++;
                    moveAmounts[1] = moveAmounts[1] + parseFloat(movement[counter]);
                    counter++;
                    moveAmounts[2] = moveAmounts[2] + parseFloat(movement[counter]);
                }
                
            }
            for (let i = 0; i < numNodes; i++)
                initNodes(i);
            j++;

            if (j < motionByKeyFrame.length)
                animate();
            else {
                console.log("HERE");
                blockAnimation = false;
            }
        }, 1000 / 240)
    }
    animate();
}




/*******************************END OF FRAMES AND ANIMATIONS**************************************************/

//Translation movement of spider
function moveAlongX(){
    moveAmounts[0] = event.srcElement.value;
    initNodes(torsoId);
}
function moveAlongY(){
    moveAmounts[1] = event.srcElement.value;
    initNodes(torsoId);
}
function moveAlongZ(){
    moveAmounts[2] = event.srcElement.value;
    initNodes(torsoId);
}
//torso movements
function moveHeadX(){
   alpha[torsoId][0]= event.srcElement.value;
   initNodes(torsoId);
}

function moveHeadY(){
   alpha[torsoId][1]= event.srcElement.value;
   initNodes(torsoId);
}
function moveHeadZ(){
   alpha[torsoId][2]= event.srcElement.value;
   initNodes(torsoId);
}
//Left tentacle
function moveLTentacleX(){
    alpha[leftTentacleId][0]= event.srcElement.value;
   initNodes(leftTentacleId);
}

function moveLTentacleY(){
    alpha[leftTentacleId][1]= event.srcElement.value;
   initNodes(leftTentacleId);
}
function moveLTentacleZ(){
    alpha[rightTentacleId][2]= event.srcElement.value;
   initNodes(rightTentacleId);
}

//Right Tentacle
function moveRTentacleX(){
    alpha[rightTentacleId][0]= event.srcElement.value;
   initNodes(rightTentacleId);
}

function moveRTentacleY(){
    alpha[rightTentacleId][1]= event.srcElement.value;
   initNodes(rightTentacleId);
}
function moveRTentacleZ(){
    alpha[rightTentacleId][2]= event.srcElement.value;
   initNodes(rightTentacleId);
}


//FIRST LEFT LEG
function moveLeftUpper1X(){
    alpha[leftUpperLeg1Id][0]= event.srcElement.value;
    initNodes(leftUpperLeg1Id);
}

function moveLeftUpper1Y(){
    alpha[leftUpperLeg1Id][1]= event.srcElement.value;
    initNodes(leftUpperLeg1Id);
}

function moveLeftUpper1Z(){
    alpha[leftUpperLeg1Id][2]= event.srcElement.value;
    initNodes(leftUpperLeg1Id);
}

function moveLeftMid1X(){
    alpha[leftMidLeg1Id][0]= event.srcElement.value;
    initNodes(leftMidLeg1Id);
}

function moveLeftMid1Y(){
    alpha[leftMidLeg1Id][1]= event.srcElement.value;
    initNodes(leftMidLeg1Id);
}

function moveLeftMid1Z(){
    alpha[leftMidLeg1Id][2]= event.srcElement.value;
    initNodes(leftMidLeg1Id);
}

function moveLeftLower1X(){
    alpha[leftLowerLeg1Id][0]= event.srcElement.value;
    initNodes(leftLowerLeg1Id);
}

function moveLeftLower1Y(){
    alpha[leftLowerLeg1Id][1]= event.srcElement.value;
    initNodes(leftLowerLeg1Id);
}

function moveLeftLower1Z(){
    alpha[leftLowerLeg1Id][2]= event.srcElement.value;
    initNodes(leftLowerLeg1Id);
}

//SECOND LEFT LEG
function moveLeftUpper2X(){
    alpha[leftUpperLeg2Id][0]= event.srcElement.value;
    initNodes(leftUpperLeg2Id);
}

function moveLeftUpper2Y(){
    alpha[leftUpperLeg2Id][1]= event.srcElement.value;
    initNodes(leftUpperLeg2Id);
}

function moveLeftUpper2Z(){
    alpha[leftUpperLeg2Id][2]= event.srcElement.value;
    initNodes(leftUpperLeg2Id);
}

function moveLeftMid2X(){
    alpha[leftMidLeg2Id][0]= event.srcElement.value;
    initNodes(leftMidLeg2Id);
}

function moveLeftMid2Y(){
    alpha[leftMidLeg2Id][1]= event.srcElement.value;
    initNodes(leftMidLeg2Id);
}

function moveLeftMid2Z(){
    alpha[leftMidLeg2Id][2]= event.srcElement.value;
    initNodes(leftMidLeg2Id);
}

function moveLeftLower2X(){
    alpha[leftLowerLeg2Id][0]= event.srcElement.value;
    initNodes(leftLowerLeg2Id);
}

function moveLeftLower2Y(){
    alpha[leftLowerLeg2Id][1]= event.srcElement.value;
    initNodes(leftLowerLeg2Id);
}

function moveLeftLower2Z(){
    alpha[leftLowerLeg2Id][2]= event.srcElement.value;
    initNodes(leftLowerLeg2Id);
}

//THIRD LEFT LEG
function moveLeftUpper3X(){
    alpha[leftUpperLeg3Id][0]= event.srcElement.value;
    initNodes(leftUpperLeg3Id);
}

function moveLeftUpper3Y(){
    alpha[leftUpperLeg3Id][1]= event.srcElement.value;
    initNodes(leftUpperLeg3Id);
}

function moveLeftUpper3Z(){
    alpha[leftUpperLeg3Id][2]= event.srcElement.value;
    initNodes(leftUpperLeg3Id);
}

function moveLeftMid3X(){
    alpha[leftMidLeg3Id][0]= event.srcElement.value;
    initNodes(leftMidLeg3Id);
}

function moveLeftMid3Y(){
    alpha[leftMidLeg3Id][1]= event.srcElement.value;
    initNodes(leftMidLeg3Id);
}

function moveLeftMid3Z(){
    alpha[leftMidLeg3Id][2]= event.srcElement.value;
    initNodes(leftMidLeg3Id);
}

function moveLeftLower3X(){
    alpha[leftLowerLeg3Id][0]= event.srcElement.value;
    initNodes(leftLowerLeg3Id);
}

function moveLeftLower3Y(){
    alpha[leftLowerLeg3Id][1]= event.srcElement.value;
    initNodes(leftLowerLeg3Id);
}

function moveLeftLower3Z(){
    alpha[leftLowerLeg3Id][2]= event.srcElement.value;
    initNodes(leftLowerLeg3Id);
}

//FOURTH LEFT LEG
function moveLeftUpper4X(){
    alpha[leftUpperLeg4Id][0]= event.srcElement.value;
    initNodes(leftUpperLeg4Id);
}

function moveLeftUpper4Y(){
    alpha[leftUpperLeg4Id][1]= event.srcElement.value;
    initNodes(leftUpperLeg4Id);
}

function moveLeftUpper4Z(){
    alpha[leftUpperLeg4Id][2]= event.srcElement.value;
    initNodes(leftUpperLeg4Id);
}

function moveLeftMid4X(){
    alpha[leftMidLeg4Id][0]= event.srcElement.value;
    initNodes(leftMidLeg4Id);
}

function moveLeftMid4Y(){
    alpha[leftMidLeg4Id][1]= event.srcElement.value;
    initNodes(leftMidLeg4Id);
}

function moveLeftMid4Z(){
    alpha[leftMidLeg4Id][2]= event.srcElement.value;
    initNodes(leftMidLeg4Id);
}

function moveLeftLower4X(){
    alpha[leftLowerLeg4Id][0]= event.srcElement.value;
    initNodes(leftLowerLeg4Id);
}

function moveLeftLower4Y(){
    alpha[leftLowerLeg4Id][1]= event.srcElement.value;
    initNodes(leftLowerLeg4Id);
}

function moveLeftLower4Z(){
    alpha[leftLowerLeg4Id][2]= event.srcElement.value;
    initNodes(leftLowerLeg4Id);
}

//RIGHT SIDE******
//FIRST RIGHT LEG 
function moveRightUpper1X(){
    alpha[rightUpperLeg1Id][0]= event.srcElement.value;
    initNodes(rightUpperLeg1Id);
}

function moveRightUpper1Y(){
    alpha[rightUpperLeg1Id][1]= event.srcElement.value;
    initNodes(rightUpperLeg1Id);
}

function moveRightUpper1Z(){
    alpha[rightUpperLeg1Id][2]= event.srcElement.value;
    initNodes(rightUpperLeg1Id);
}

function moveRightMid1X(){
    alpha[rightMidLeg1Id][0]= event.srcElement.value;
    initNodes(rightMidLeg1Id);
}

function moveRightMid1Y(){
    alpha[rightMidLeg1Id][1]= event.srcElement.value;
    initNodes(rightMidLeg1Id);
}

function moveRightMid1Z(){
    alpha[rightMidLeg1Id][2]= event.srcElement.value;
    initNodes(rightMidLeg1Id);
}

function moveRightLower1X(){
    alpha[rightLowerLeg1Id][0]= event.srcElement.value;
    initNodes(rightLowerLeg1Id);
}

function moveRightLower1Y(){
    alpha[rightLowerLeg1Id][1]= event.srcElement.value;
    initNodes(rightLowerLeg1Id);
}

function moveRightLower1Z(){
    alpha[rightLowerLeg1Id][2]= event.srcElement.value;
    initNodes(rightLowerLeg1Id);
}

//SECOND right LEG
function moveRightUpper2X(){
    alpha[rightUpperLeg2Id][0]= event.srcElement.value;
    initNodes(rightUpperLeg2Id);
}

function moveRightUpper2Y(){
    alpha[rightUpperLeg2Id][1]= event.srcElement.value;
    initNodes(rightUpperLeg2Id);
}

function moveRightUpper2Z(){
    alpha[rightUpperLeg2Id][2]= event.srcElement.value;
    initNodes(rightUpperLeg2Id);
}

function moveRightMid2X(){
    alpha[rightMidLeg2Id][0]= event.srcElement.value;
    initNodes(rightMidLeg2Id);
}

function moveRightMid2Y(){
    alpha[rightMidLeg2Id][1]= event.srcElement.value;
    initNodes(rightMidLeg2Id);
}

function moveRightMid2Z(){
    alpha[rightMidLeg2Id][2]= event.srcElement.value;
    initNodes(rightMidLeg2Id);
}

function moveRightLower2X(){
    alpha[rightLowerLeg2Id][0]= event.srcElement.value;
    initNodes(rightLowerLeg2Id);
}

function moveRightLower2Y(){
    alpha[rightLowerLeg2Id][1]= event.srcElement.value;
    initNodes(rightLowerLeg2Id);
}

function moveRightLower2Z(){
    alpha[rightLowerLeg2Id][2]= event.srcElement.value;
    initNodes(rightLowerLeg2Id);
}

//THIRD right LEG
function moveRightUpper3X(){
    alpha[rightUpperLeg3Id][0]= event.srcElement.value;
    initNodes(rightUpperLeg3Id);
}

function moveRightUpper3Y(){
    alpha[rightUpperLeg3Id][1]= event.srcElement.value;
    initNodes(rightUpperLeg3Id);
}

function moveRightUpper3Z(){
    alpha[rightUpperLeg3Id][2]= event.srcElement.value;
    initNodes(rightUpperLeg3Id);
}

function moveRightMid3X(){
    alpha[rightMidLeg3Id][0]= event.srcElement.value;
    initNodes(rightMidLeg3Id);
}

function moveRightMid3Y(){
    alpha[rightMidLeg3Id][1]= event.srcElement.value;
    initNodes(rightMidLeg3Id);
}

function moveRightMid3Z(){
    alpha[rightMidLeg3Id][2]= event.srcElement.value;
    initNodes(rightMidLeg3Id);
}

function moverightLower3X(){
    alpha[rightLowerLeg3Id][0]= event.srcElement.value;
    initNodes(rightLowerLeg3Id);
}

function moveRightLower3Y(){
    alpha[rightLowerLeg3Id][1]= event.srcElement.value;
    initNodes(rightLowerLeg3Id);
}

function moveRightLower3Z(){
    alpha[rightLowerLeg3Id][2]= event.srcElement.value;
    initNodes(rightLowerLeg3Id);
}

//FOURTH right LEG
function moveRightUpper4X(){
    alpha[rightUpperLeg4Id][0]= event.srcElement.value;
    initNodes(rightUpperLeg4Id);
}

function moveRightUpper4Y(){
    alpha[rightUpperLeg4Id][1]= event.srcElement.value;
    initNodes(rightUpperLeg4Id);
}

function moveRightUpper4Z(){
    alpha[rightUpperLeg4Id][2]= event.srcElement.value;
    initNodes(rightUpperLeg4Id);
}

function moveRightMid4X(){
    alpha[rightMidLeg4Id][0]= event.srcElement.value;
    initNodes(rightMidLeg4Id);
}

function moveRightMid4Y(){
    alpha[rightMidLeg4Id][1]= event.srcElement.value;
    initNodes(rightMidLeg4Id);
}

function moveRightMid4Z(){
    alpha[rightMidLeg4Id][2]= event.srcElement.value;
    initNodes(rightMidLeg4Id);
}

function moveRightLower4X(){
    alpha[rightLowerLeg4Id][0]= event.srcElement.value;
    initNodes(rightLowerLeg4Id);
}

function moveRightLower4Y(){
    alpha[rightLowerLeg4Id][1]= event.srcElement.value;
    initNodes(rightLowerLeg4Id);
}

function moveRightLower4Z(){
    alpha[rightLowerLeg4Id][2]= event.srcElement.value;
    initNodes(rightLowerLeg4Id);
}