let index = 0;
let pointsArray = [];
let indices = [];
let normalsArray = [];
let vertices = [];//vertices of prism
let normals = [];//normals of prism
function matrixVectorProd(matrix, vector) {
    if (matrix.length !== vector.length) {
        return null;
    }
    let result = [];
    for (let rowIdx = 0; rowIdx < matrix.length; rowIdx++) {
        if (matrix[rowIdx].length !== vector.length){
            return null;
        }
        let sum = 0;
        for (let colIdx = 0; colIdx < vector.length; colIdx++) {
            sum += matrix[rowIdx][colIdx] * vector[colIdx];
        }
        result[rowIdx] = sum;
    }
    return vec4(result);
}

function getPolygon(sides, rotateAxis, r) {
    const radius = Math.min(r, 1);
    const rotateAngle = 360 / sides;
    let startVertex;
    let rotateMatrix;
    if (rotateAxis == 0) {
        startVertex = vec4(0.0, radius, 0.0, 1.0);
        rotateMatrix = rotate(rotateAngle, 1, 0, 0)
    } else if (rotateAxis == 1) {
        startVertex = vec4(0.0, 0.0, radius, 1.0);
        rotateMatrix = rotate(rotateAngle, 0, 1, 0)
    } else {
        startVertex = vec4(radius, 0.0, 0.0, 1.0);
        rotateMatrix = rotate(rotateAngle, 0, 0, 1)
    }
    let vertices = [startVertex];
    for (let rotationCount = 0; vertices.length < sides; rotationCount++) {
        startVertex = matrixVectorProd(rotateMatrix, startVertex);
        //startVertex = normalize(startVertex,true);
        vertices.push(startVertex);
    }
    return vertices;
}

function getPrism(sides, rotateAxis, radius, height, startIndex) {
    indices = [];
    normals = [];
    let circleVertices = getPolygon(sides, rotateAxis, radius);
    vertices = [];
    for (let i = 0; i < 2 * sides; i++) { indices.push(i + startIndex); }
    const cylinderHeight = Math.min(height, 2);
    let bottom = [];
    let top = [];
    
    
    for (let vertexIdx = 0; vertexIdx < circleVertices.length; vertexIdx++) {
        if (rotateAxis == 2) {
            let down = matrixVectorProd(translate(0, 0, 0), circleVertices[vertexIdx]);
            let up = matrixVectorProd(translate(0, 0, cylinderHeight), circleVertices[vertexIdx]);

            bottom.push(down);
            top.push(up);
            
        } else if (rotateAxis == 1) {
            let down = matrixVectorProd(translate(0, 0, 0), circleVertices[vertexIdx]); 
            let up = matrixVectorProd(translate(0, cylinderHeight, 0), circleVertices[vertexIdx]);
            
            bottom.push(down);
            top.push(up);
           
        } else if (rotateAxis == 0) {
            let down = matrixVectorProd(translate(0, 0, 0), circleVertices[vertexIdx]);
            let up = matrixVectorProd(translate(cylinderHeight, 0, 0), circleVertices[vertexIdx]);
        
            bottom.push(down);
            top.push(up);
            
        }
    }
    
   generateNormals(bottom,top,sides);
    
    return [vertices, indices,normals];
}

//generate normals
function generateNormals(bottom,top,sides){
    //find bottom normals
    
    let t1 = subtract(bottom[1], bottom[0]);
    let t2 = subtract(bottom[2], bottom[1]);
    let normal = cross(t1, t2);
    bottomNormal = vec3(normal);
    for(let i = 0; i < sides;i++){
        vertices.push(bottom[i]);
        normals.push(bottomNormal);
    }
    
    //setting side normals and vertices
    startVertex = 0;
    for(let j = 0; j < sides; j++){
        
        quad(top[j],bottom[j],bottom[(j+1)%sides],top[(j+1)%sides]);
    }
    //top normals
    for(let k = 0; k < sides;k++){
        vertices.push(top[k]);
        normals.push(-bottomNormal);
    }
}
//generating vertices and normals for sides of prism
//quad(top[j],bottom[j],bottom[(j+1)%sides],top[(j+1)%sides]);
function quad(a, b, c, d) {
    console.log(a);
    let t1 = subtract(d, c);
    let t2 = subtract(c, a);
    let normal = cross(t1, t2);
    normal = vec3(normal);


    vertices.push(a); 
    normals.push(normal); 
    vertices.push(b); 
    normals.push(normal); 
    vertices.push(c); 
    normals.push(normal); 
    vertices.push(a); 
    normals.push(normal);
    vertices.push(c); 
    normals.push(normal);
    vertices.push(d); 
    normals.push(normal);

}


//sphere
function triangle(a, b, c) {
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
    
     normalsArray.push(vec4(a[0],a[1], a[2], 0.0));
     normalsArray.push(vec4(b[0],b[1], b[2], 0.0));
     normalsArray.push(vec4(c[0],c[1], c[2], 0.0));
	
     index += 3;
}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        let ab = mix( a, b, 0.5);
        let ac = mix( a, c, 0.5);
        let bc = mix( b, c, 0.5);
                
        ab = normalize(ab, true);
        ac = normalize(ac, true);
        bc = normalize(bc, true);
                                
        divideTriangle( a, ab, ac, count - 1 );
        divideTriangle( ab, b, bc, count - 1 );
        divideTriangle( bc, c, ac, count - 1 );
        divideTriangle( ab, bc, ac, count - 1 );
    }
    else { 
        triangle( a, b, c );
    }
}


function tetrahedron(n) {
    index = 0;
    pointsArray = [];
    normalsArray = [];
    let a = vec4(0.0, 0.0, -1.0, 1);
    let b = vec4(0.0, 0.942809, 0.333333, 1);
    let c = vec4(-0.816497, -0.471405, 0.333333, 1);
    let d = vec4(0.816497, -0.471405, 0.333333, 1);
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
    return [index, pointsArray,normalsArray];
}
