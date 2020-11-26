let gl;
let canvas;
let program;
let approxSides = 10;

var alpha = [0, 0, 0, 0, 0, 0, 180, 0, 180, 0, 0];//alpha is the joint angle

var torsoId = 0;
var leftTentacleId  = 1;
var righTentacleId = 2;
var lowerTorsoId = 3;

//left side of spider
var leftUpperLeg1Id = 4;
var leftMidLeg1Id = 5;
var leftLowerLeg1Id = 6;

var leftUpperLeg2Id = 7;
var leftMidLeg2Id = 8;
var leftLowerLeg2Id = 9;

var leftUpperLeg3Id = 10;
var leftMidLeg3Id = 11;
var leftLowerLeg3Id = 12;

var leftUpperLeg4Id = 13;
var leftMidLeg4Id = 14;
var leftLowerLeg4Id = 15;

//right side of spider
var rightUpperLeg1Id = 16;
var rightMidLeg1Id = 17;
var rightLowerLeg1Id = 18;

var rightUpperLeg2Id = 19;
var rightMidLeg2Id = 20;
var rightLowerLeg2Id = 21;

var rightUpperLeg3Id = 22;
var rightMidLeg3Id = 23;
var rightLowerLeg3Id = 24;

var rightUpperLeg4Id = 25;
var rightMidLeg4Id = 26;
var rightLowerLeg4Id = 27;


//sizes of body parts uydurdum değiştiririz
var torsoHeight = 4.0;
var torsoWidth = 2.0;

var upperLegHeight = 5.0;
var upperLegWidth = 1.0;

var midLegHeight = 4.0;
var midLegWidth = 1.0;

var lowerLegHeight = 3.0;
var lowerLegWidth = 1.0;

var tentacleHeigt = 3.0;
var tentacleMid = 0.5;


var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var modelViewMatrix, projectionMatrix;
var modelViewMatrixLoc, projectionMatrixLoc;

var numNodes = 28;
var stack = [];

var spider = [];

for( var i=0; i<numNodes; i++) spider[i] = createNode(null, null, null, null);

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

    let circleVertices = getPolygon(approxSides, 2, 0.7);
    let vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(circleVertices), gl.STATIC_DRAW);

    let vPosition = gl.getAttribLocation(program, "vPosition");
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    for(i=0; i<numNodes; i++) initNodes(i);
    
    render();

}
window.onload = init;

function render() {
    /*gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, approxSides);*/
    gl.clear( gl.COLOR_BUFFER_BIT );
    traverse(torsoId);
    requestAnimFrame(render);
}

function createNode(transform, render, sibling, child){
    var node = {
    transform: transform,
    render: render,
    sibling: sibling,
    child: child,
    }
    return node;
}

function traverse(Id) {
   
   if(Id == null) return; 
   stack.push(modelViewMatrix);
   modelViewMatrix = mult(modelViewMatrix, figure[Id].transform);
   figure[Id].render();
   if(figure[Id].child != null) traverse(figure[Id].child); 
    modelViewMatrix = stack.pop();
   if(figure[Id].sibling != null) traverse(figure[Id].sibling); 
}

//initializing nodes
function initNodes(Id) {

    var m = mat4();
    
    switch(Id) {
    
    case torsoId:
    
    m = rotate(alpha[torsoId], 0, 1, 0 );
	//m = translate(x,y,z);//root a tüm örümceğe yaptırmak isteğimiz hareketleri koymalıyız
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


