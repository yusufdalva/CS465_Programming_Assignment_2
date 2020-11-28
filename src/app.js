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

let vertexCount = 0;

let alpha = [0, 30, 0, 0, 135, 0, 0, 135, 0, 0, 225,0,0,225,0,0,45,0,0,45,0,0,315,0,0,315,0,0]; // alpha is the joint angle

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);

//light stuff
var lightPosition = vec4(1.0, 1.0, 1.0, 0.0 );
var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
var ambientColor, diffuseColor, specularColor;
var materialShininess = 100.0;
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
    gl.clearColor(1.0, 1.0, 1.0, 1.0);

    
    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vertex-shader", "fragment-shader");
    gl.useProgram(program);

    ambientProduct = mult(lightAmbient, materialAmbient);
	console.log("AMBIENTT " +ambientProduct);
    diffuseProduct = mult(lightDiffuse, materialDiffuse);
	console.log(diffuseProduct);
    specularProduct = mult(lightSpecular, materialSpecular);
	console.log(specularProduct);
  
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

    console.log(cylinderMetadata.vertexCount);
  

    // Generate Square Prism - uses index structure
    let prism = getPrism(4, 2, 0.5, 0.5, vertexCount);
    let prismVertices = prism[0];
    vertexCount += prismVertices.length;
    let prismIndices = prism[1];
    let prismNormals = prism[2];
    prismMetadata.noOfSides = 4;
    prismMetadata.vertexCount = prismVertices.length;
    console.log(prismMetadata.vertexCount);
    prismMetadata.vertices = prismVertices;
    prismMetadata.normals = prismNormals;
   
    

    
   
    
    
    //console.log("Total number of vertices: " + vertices.length.toString());
    //console.log("Total Number of indices: " + indices.length.toString());

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
    projectionMatrix = ortho(-10.0,10.0,-10.0, 10.0,-10.0,10.0);
    modelViewMatrix = mat4();
    normalMatrix = mat3();
    
    gl.uniformMatrix4fv(gl.getUniformLocation( program, "modelViewMatrix"), false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( gl.getUniformLocation( program, "projectionMatrix"), false, flatten(projectionMatrix) );
    gl.uniformMatrix3fv( gl.getUniformLocation( program, "normalMatrix"), false, flatten(normalMatrix));
    document.getElementById("Button2").onclick = function(){theta += dr;};
    document.getElementById("Button3").onclick = function(){theta -= dr;};
    document.getElementById("Button4").onclick = function(){phi += dr;};
    document.getElementById("Button5").onclick = function(){phi -= dr;};

    //SLIDERSSS********************
    /*document.getElementById("slider0").onchange = function() {
        theta[torsoId ] = event.srcElement.value;
        initNodes(torsoId);
    };
        document.getElementById("slider1").onchange = function() {
        theta[head1Id] = event.srcElement.value;
        initNodes(head1Id);
    };

    document.getElementById("slider2").onchange = function() {
         theta[leftUpperArmId] = event.srcElement.value;
         initNodes(leftUpperArmId);
    };
    document.getElementById("slider3").onchange = function() {
         theta[leftLowerArmId] =  event.srcElement.value;
         initNodes(leftLowerArmId);
    };
     
        document.getElementById("slider4").onchange = function() {
        theta[rightUpperArmId] = event.srcElement.value;
        initNodes(rightUpperArmId);
    };
    document.getElementById("slider5").onchange = function() {
         theta[rightLowerArmId] =  event.srcElement.value;
         initNodes(rightLowerArmId);
    };
        document.getElementById("slider6").onchange = function() {
        theta[leftUpperLegId] = event.srcElement.value;
        initNodes(leftUpperLegId);
    };
    document.getElementById("slider7").onchange = function() {
         theta[leftLowerLegId] = event.srcElement.value;
         initNodes(leftLowerLegId);
    };
    document.getElementById("slider8").onchange = function() {
         theta[rightUpperLegId] =  event.srcElement.value;
         initNodes(rightUpperLegId);
    };
        document.getElementById("slider9").onchange = function() {
        theta[rightLowerLegId] = event.srcElement.value;
        initNodes(rightLowerLegId);
    };
    document.getElementById("slider10").onchange = function() {
         theta[head2Id] = event.srcElement.value;
         initNodes(head2Id);
    };*/

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
    //renderPrism();
    requestAnimFrame(render);
}

// Renders a sphere primitive
function renderSphere() {
    /*
    var snBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, snBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereMetadata.normals), gl.STATIC_DRAW );
    
    var svNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( svNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( svNormal);

    var svBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, svBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(sphereMetadata.vertices), gl.STATIC_DRAW);
    
    var svPosition = gl.getAttribLocation( program, "vPosition");
    gl.vertexAttribPointer(svPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(svPosition);
     */
    for (let pointIdx = 0; pointIdx < sphereMetadata.vertexCount; pointIdx += 3) {
        gl.drawArrays(gl.TRIANGLES, pointIdx, 3); // Render in triangular wires
    }
}

function renderCylinder() {
    /*
    let vertices = cylinderMetadata.vertices;
    vertices = vertices.concat(prismMetadata.vertices);
   
    let normals = cylinderMetadata.normals;
    normals = normals.concat(prismMetadata.normals);
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
      
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vNormal);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
     */
    let drawnPoints = 0;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + sphereMetadata.vertexCount, cylinderMetadata.noOfSides);
    drawnPoints += cylinderMetadata.noOfSides;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + sphereMetadata.vertexCount, cylinderMetadata.noOfSides);
    drawnPoints += cylinderMetadata.noOfSides;
    gl.drawArrays(gl.TRIANGLE_FAN, drawnPoints + sphereMetadata.vertexCount, cylinderMetadata.vertexCount - drawnPoints);
}

function renderPrism() {
    /*
    let vertices = cylinderMetadata.vertices;
    vertices = vertices.concat(prismMetadata.vertices);
   
    let normals = cylinderMetadata.normals;
    normals = normals.concat(prismMetadata.normals);
    var nBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, nBuffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW );
      
    var vNormal = gl.getAttribLocation( program, "vNormal" );
    gl.vertexAttribPointer( vNormal, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray(vNormal);

    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
     */
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
        case torsoId:
            m = mult(m, rotate(alpha[torsoId], 0, 1,0)); // Rotate around y - by euler angle
            //m = mult(m,rotate(225,0,1,0));
            spider[torsoId] = createNode(m, torso, null, leftTentacleId);
            break;
        case leftTentacleId:
            m = translate(-(torsoWidth/2), torsoHeight,0.0);
          //  m = mult(m, rotate(alpha[leftTentacleId], 0, 1, 0));
            m = mult(m,rotate(180,0,1,0));
            spider[leftTentacleId] = createNode(m, tentacle, rightTentacleId, null);
            break;

        case rightTentacleId:
            m = translate(torsoWidth/2, torsoHeight, 0.0);
            m = mult(m,rotate(180,0,1,0));
            spider[rightTentacleId] = createNode(m, tentacle, lowerTorsoId, null);
            break;

        case lowerTorsoId:
            m = translate(0.0, -(2.1* torsoHeight), 0.0);
            spider[lowerTorsoId] = createNode(m, lowerTorso, leftUpperLeg1Id, null);
            break;
        // Left Leg 1
        case leftUpperLeg1Id:
            m = translate(-(torsoWidth * 0.7), 0.7 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[leftUpperLeg1Id], 0, 0, 1));
            spider[leftUpperLeg1Id] = createNode(m,upperLeg,leftUpperLeg2Id,leftMidLeg1Id);
            break;

        case leftMidLeg1Id:
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[leftMidLeg1Id],0,0,1));
            spider[leftMidLeg1Id] = createNode(m, midLeg,null,leftLowerLeg1Id);
            break;	
	//BUNDA Bİ DEĞİŞİKLİK VAR
	case leftLowerLeg1Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftLowerLeg1Id],0,0,1));
	    spider[leftLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	    break;
	//left leg 2
	case leftUpperLeg2Id:
            m = translate(-(torsoWidth * 0.9), 0.3 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[leftUpperLeg2Id], 0, 0, 1));
            spider[leftUpperLeg2Id] = createNode(m,upperLeg,leftUpperLeg3Id,leftMidLeg2Id);
            break;

        case leftMidLeg2Id:
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[leftMidLeg2Id],0,0,1));
            spider[leftMidLeg2Id] = createNode(m, midLeg,null,leftLowerLeg2Id);
            break;
		    
	case leftLowerLeg2Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[leftLowerLeg2Id],0,0,1));
	    spider[leftLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	    break;
	
	//left leg 3
	case leftUpperLeg3Id:
	     m = translate(-(0.85*torsoWidth), -0.4*torsoHeight, 0.0);
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
	     m = translate(-(0.6*torsoWidth), -0.8*torsoHeight, 0.0);
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
            m = translate((torsoWidth * 0.7), 0.7 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg1Id], 0, 0, 1));
            spider[rightUpperLeg1Id] = createNode(m,upperLeg,rightUpperLeg2Id,rightMidLeg1Id);
            break;

        case rightMidLeg1Id:
            m = translate(2*upperLegHeight,0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg1Id],0,0,1));
            spider[rightMidLeg1Id] = createNode(m, midLeg,null,rightLowerLeg1Id);
            break;
			
	case rightLowerLeg1Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg1Id],0,0,1));
	    spider[rightLowerLeg1Id] = createNode(m,lowerLeg,null,null);
	    break;
			
	//right leg 2
	case rightUpperLeg2Id:
            m = translate((0.9*torsoWidth * 0.95), 0.3 * torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg2Id], 0, 0, 1));
            spider[rightUpperLeg2Id] = createNode(m,upperLeg,rightUpperLeg3Id,rightMidLeg2Id);
            break;

        case rightMidLeg2Id:
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg2Id],0,0,1));
            spider[rightMidLeg2Id] = createNode(m, midLeg,null,rightLowerLeg2Id);
            break;
			
	case rightLowerLeg2Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg2Id],0,0,1));
	    spider[rightLowerLeg2Id] = createNode(m,lowerLeg,null,null);
	    break;
	//right leg 3
	case rightUpperLeg3Id:
            m = translate((0.85*torsoWidth), -0.4*torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg3Id], 0, 0, 1));
            spider[rightUpperLeg3Id] = createNode(m,upperLeg,rightUpperLeg4Id,rightMidLeg3Id);
            break;

        case rightMidLeg3Id:
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg3Id],0,0,1));
            spider[rightMidLeg3Id] = createNode(m, midLeg,null,rightLowerLeg3Id);
            break;
			
	case rightLowerLeg3Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg3Id],0,0,1));
	    spider[rightLowerLeg3Id] = createNode(m,lowerLeg,null,null);
	    break;
	//right leg 4
	case rightUpperLeg4Id:
            m = translate((0.6*torsoWidth), -0.8*torsoHeight, 0.0);
            m = mult(m,rotate(alpha[rightUpperLeg4Id], 0, 0, 1));
            spider[rightUpperLeg4Id] = createNode(m,upperLeg,null,rightMidLeg4Id);
            break;

        case rightMidLeg4Id:
            m = translate(2*upperLegHeight,0.0, 0.0);
            m = mult(m,rotate(alpha[rightMidLeg4Id],0,0,1));
            spider[rightMidLeg4Id] = createNode(m, midLeg,null,rightLowerLeg4Id);
            break;
			
	case rightLowerLeg4Id:
	    m = translate(2*midLegHeight, 0.0, 0.0);
	    m = mult(m,rotate(alpha[rightLowerLeg4Id],0,0,1));
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


