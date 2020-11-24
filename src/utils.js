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