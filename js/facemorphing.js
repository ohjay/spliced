/*
 * facemorphing.js
 * Owen Jow
 *
 * Abridged version (original at https://github.com/ohjay/facemorphing);
 * contains only the core morphing functionality.
 */

function addCornerPoints(points, id) {
  var img = document.getElementById(id);
  points[id].push([0, 0]);
  points[id].push([0, img.clientHeight - 1]);
  points[id].push([img.clientWidth - 1, 0]);
  points[id].push([img.clientWidth - 1, img.clientHeight - 1]);
}

function getMidpoints(pointsFrom, pointsTo, t) {
  var pointF, pointT;
  var midpointX, midpointY;
  var midpoints = [];
  for (var i = 0; i < pointsFrom.length; ++i) {
    pointF = pointsFrom[i];
    pointT = pointsTo[i];
    
    midpointX = pointF[0] * t + pointT[0] * (1.0 - t);
    midpointY = pointF[1] * t + pointT[1] * (1.0 - t);
    midpoints.push([midpointX, midpointY]);
  }
  
  return midpoints;
}

function runTriangulation(points, warpFrac, corners=true) {
  // Add the corner points before triangulating
  if (corners) {
    addCornerPoints(points, ID_IMG_FROM);
    addCornerPoints(points, ID_IMG_TO);
  }
  
  var midpoints = getMidpoints(points[ID_IMG_FROM], points[ID_IMG_TO], warpFrac);
  var triangles = Delaunay.triangulate(midpoints);
  return [midpoints, triangles];
}

/*
 * Returns all of the coordinates inside of the given triangle
 * as a horizontally-joined set of (x, y, 1) vectors –
 * meaning that if there are N such vectors, the returned array
 * would be of size 3 x N.
 *
 * Our triangle should consist of tangible points (as opposed to, say, indices).
 */
function triangleInterior(triangle) {
  var point0 = triangle[0], point1 = triangle[1], point2 = triangle[2];
  var minX = Math.min(point0[0], point1[0], point2[0]);
  var maxX = Math.max(point0[0], point1[0], point2[0]);
  var minY = Math.min(point0[1], point1[1], point2[1]);
  var maxY = Math.max(point0[1], point1[1], point2[1]);
  
  var interior = [];
  
  // Compile a list by filtering points from the bounding box
  for (var x = minX; x <= maxX; ++x) {
    for (var y = minY; y <= maxY; ++y) {
      if (Delaunay.contains(triangle, [x, y], 0.0)) {
        if (interior.length == 0) {
          interior = [[x], [y], [1]];
        } else {
          interior[0].push(x);
          interior[1].push(y);
          interior[2].push(1);
        }
      }
    }
  }
  
  return interior;
}

/*
 * Returns a number whose value is limited to the given range.
 * Example: (x * 255).clip(0, 255)
 */
Number.prototype.clip = function(min, max) {
  return Math.min(Math.max(this, min), max);
};

/*
 * Given six 2D points (three for each triangle), computes the matrix
 * for the affine transformation between triangle 1 and triangle 2.
 */
function computeAffine(X, Y) {
  return math.multiply(Y, math.inv(X));
}

/*
 * Bilinearly interpolates between the four neighbor values
 * associated with a particular RGB value in the image.
 */
function bilerp(x, y, img, width, height) {
  var tlVal, trVal, blVal, brVal;
  var topv, bottomv;
  var output = [];
  
  var yfl = Math.floor(y), xfl = Math.floor(x);
  var vdiff = y - yfl, hdiff = x - xfl;
  var tlIdx, trIdx, blIdx, brIdx;
  var inc;
  
  tlIdx = ( yfl      * width + xfl    ) * 4;
  trIdx = ( yfl      * width + xfl + 1) * 4;
  blIdx = ((yfl + 1) * width + xfl    ) * 4;
  brIdx = ((yfl + 1) * width + xfl + 1) * 4;
  
  for (inc = 0; inc < 3; ++inc) {
    tlVal = img[tlIdx + inc];
    trVal = (xfl < width  - 1) ? img[trIdx + inc] : tlVal;
    blVal = (yfl < height - 1) ? img[blIdx + inc] : tlVal;
    brVal = (xfl < width  - 1 && yfl < height - 1) ? img[brIdx + inc] : tlVal;
    
    topv    = (1.0 - hdiff) * tlVal + hdiff * trVal;
    bottomv = (1.0 - hdiff) * blVal + hdiff * brVal;
    
    output.push((1.0 - vdiff) * topv + vdiff * bottomv);
  }
  
  return output;
}

/*
 * Sets the specified pixel's value to the weighted average of the two passed-in colors.
 * The weights are given by the T0 and T1 parameters.
 */
function colorPixel(data, idx, src0Color, src1Color, t0, t1) {
  data[idx]     = (src0Color[0] * t0 + src1Color[0] * t1).clip(0, 255);
  data[idx + 1] = (src0Color[1] * t0 + src1Color[1] * t1).clip(0, 255);
  data[idx + 2] = (src0Color[2] * t0 + src1Color[2] * t1).clip(0, 255);
  data[idx + 3] = 255;
}

/*
 * Computes and returns a pixel array representing the morphed image.
 */
function computeMidpointImage(midpoints, triangles, fromData, toData,
    fromPts, toPts, width, height, cvs, df0, df1) {
  var idx0, idx1, idx2;
  var fromTri, toTri, targetTri;
  var X0, X1, Y, A0, A1;
  var midCoords, numInterior;
  var warpedSrc0, warpedSrc1;
  var src0X, src0Y, src1X, src1Y, xfl, yfl, src0Color, src1Color, finalIdx;
  
  var finalData = new Array(width * height * 4).fill(0);
  
  var numTriangles = triangles.length;
  var targetTriangles = [];
  var transfs = [];
  
  var i, j;
  for (i = 0; i < numTriangles; i += 3) {
    idx0 = triangles[i], idx1 = triangles[i + 1], idx2 = triangles[i + 2];
    fromTri = [fromPts[idx0], fromPts[idx1], fromPts[idx2]];
    toTri = [toPts[idx0], toPts[idx1], toPts[idx2]];
    targetTri = [midpoints[idx0], midpoints[idx1], midpoints[idx2]];
    targetTriangles.push(targetTri);
    
    X0 = math.transpose(math.resize(fromTri, [3, 3], 1));
    X1 = math.transpose(math.resize(toTri, [3, 3], 1));
    Y = math.transpose(math.resize(targetTri, [3, 3], 1));
    
    A0 = computeAffine(Y, X0);
    A1 = computeAffine(Y, X1);
    transfs.push([A0, A1]);
    
    midCoords = triangleInterior(targetTri);
    warpedSrc0 = math.multiply(A0, midCoords);
    warpedSrc1 = math.multiply(A1, midCoords);
    
    numInterior = midCoords[0].length;
    for (j = 0; j < numInterior; ++j) {
      src0X = warpedSrc0[0][j].clip(0, width  - 1);
      src0Y = warpedSrc0[1][j].clip(0, height - 1);
      src1X = warpedSrc1[0][j].clip(0, width  - 1);
      src1Y = warpedSrc1[1][j].clip(0, height - 1);
      
      src0Color = bilerp(src0X, src0Y, fromData, width, height);
      src1Color = bilerp(src1X, src1Y, toData,   width, height);
      
      xfl = Math.floor(midCoords[0][j]);
      yfl = Math.floor(midCoords[1][j]);
      finalIdx = (yfl * width + xfl) * 4;
      
      colorPixel(finalData, finalIdx, src0Color, src1Color, df0, df1);
    }
  }
  
  // Patch holes
  var numPixels = width * height * 4;
  for (i = 3; i < numPixels; i += 4) {
    if (finalData[i] == 0) {
      xfl = Math.floor(i / 4) % width;
      yfl = Math.floor((i / 4) / width);
      
      for (j = 0; j < numTriangles; ++j) {
        targetTri = targetTriangles[j];
        if (Delaunay.contains(targetTri, [xfl, yfl], 0.05)) {
          warpedSrc0 = math.multiply(transfs[j][0], [[xfl], [yfl], [1]]);
          warpedSrc1 = math.multiply(transfs[j][1], [[xfl], [yfl], [1]]);
          
          src0X = warpedSrc0[0][0].clip(0, width  - 1);
          src0Y = warpedSrc0[1][0].clip(0, height - 1);
          src1X = warpedSrc1[0][0].clip(0, width  - 1);
          src1Y = warpedSrc1[1][0].clip(0, height - 1);
          
          src0Color = bilerp(src0X, src0Y, fromData, width, height);
          src1Color = bilerp(src1X, src1Y, toData,   width, height);
          
          colorPixel(finalData, i - 3, src0Color, src1Color, df0, df1);
          break;
        }
      }
    }
  }
  
  return finalData;
}
