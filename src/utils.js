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
        vertices.push(startVertex);
    }
    return vertices;
}

function getPrism(sides, rotateAxis, radius, height) {
    let circleVertices = getPolygon(sides, 2, radius);
    const cylinderHeight = Math.min(height, 2);
    let bottom = [];
    let top = [];
    for (let vertexIdx = 0; vertexIdx < circleVertices.length; vertexIdx++) {
        bottom.push(matrixVectorProd(translate(0, 0, -cylinderHeight / 2), circleVertices[vertexIdx]));
        top.push(matrixVectorProd(translate(0, 0, cylinderHeight / 2), circleVertices[vertexIdx]));
    }
    let indices = [];
    let vertices = bottom.concat(top);
    for (let side = 0; side < sides; side++) {
        let bottomIndices = [(side % sides), ((side + 1) % sides)];
        let topIndices = [(side % sides) + sides, ((side + 1) % sides) + sides];
        quad(topIndices[0], bottomIndices[0], bottomIndices[1], topIndices[0], );
    }
    return [vertices, indices];
}

function quad(a, b, c, d, indices) {
    indices.push(a);
    indices.push(b);
    indices.push(c);
    indices.push(d);
}

//sphere
function triangle(a, b, c, pointsArray, index) {
     pointsArray.push(a);
     pointsArray.push(b);      
     pointsArray.push(c);
     /* For shading
     normalsArray.push(a[0],a[1], a[2], 0.0);
     normalsArray.push(b[0],b[1], b[2], 0.0);
     normalsArray.push(c[0],c[1], c[2], 0.0);
	*/
     index += 3;
     
}


function divideTriangle(a, b, c, count) {
    if ( count > 0 ) {
                
        var ab = mix( a, b, 0.5);
        var ac = mix( a, c, 0.5);
        var bc = mix( b, c, 0.5);
                
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


function tetrahedron(a, b, c, d, n) {
    divideTriangle(a, b, c, n);
    divideTriangle(d, c, b, n);
    divideTriangle(a, d, b, n);
    divideTriangle(a, c, d, n);
}
