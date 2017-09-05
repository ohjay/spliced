/*
 * Code for administrative (developers') purposes.
 * Can be omitted in production.
 *
 * To save points in general
 * -------------------------
 * - serializePoints(<id of image>);
 *
 * To set feature points for animal images (full process)
 * ------------------------------------------------------
 * - <load some default points>
 * - relevId = ID_IMG_TO;
 * - <drag points around>
 * - serializePoints(ID_IMG_TO);
 *
 * (To set feature points for the left image, replace ID_IMG_TO with ID_IMG_FROM.)
 */

function normalize(points, width, height) {
  return points.map(function(elt) {
    return [elt[0] / width, elt[1] / height];
  });
}

function serializePoints(id) {
  var img = document.getElementById(id);
  var width = img.clientWidth, height = img.clientHeight;
  var obj = {
    'points': normalize(points[id], width, height)
  };
  var jsonData = JSON.stringify(obj);
  window.open().document.write(jsonData);
}
