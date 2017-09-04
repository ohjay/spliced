/*
 * Code specific to the page's interface.
 */

var activeAnimal = null;
var currMarkerId = 0;
var markerMagic  = 0;
var points       = {};
var inv          = {}; // marker ID # --> index in respective `points` array
var relevId      = ID_IMG_FROM;
var relevCtx, relevWidth, relevHeight, relevMarkerNo, relevPos;
var cropper;

var isMobile = false;
if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent)
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0, 4))) {
  isMobile = true;
}

function findPosition(elt) {
  if (typeof(elt.offsetParent) != 'undefined') {
    for (var posX = 0, posY = 0; elt; elt = elt.offsetParent) {
      posX += elt.offsetLeft;
      posY += elt.offsetTop;
    }
    return [posX, posY];
  }
  return [elt.x, elt.y];
}

function createMarker(id, markerSrc) {
  var img = document.createElement('img');
  img.setAttribute('src', markerSrc);
  img.setAttribute('class', 'marker');
  img.setAttribute('id', id);
  return img;
}

/*
 * Draw markers for an already-existent array of points.
 */
function drawMarkers(id, imgPos, magic=false) {
  var relevantPoints = points[id];
  var numPoints = relevantPoints.length;
  var pt, i, markerSrc;
  
  var mi = 0;
  for (i = 0; i < numPoints; ++i) {
    markerSrc = MARKER_DIR + mi + MARKER_EXT;
    mi = (mi + 1) % NUM_MARKERS;
    
    pt = relevantPoints[i];
    document.body.appendChild(createMarker('marker' + currMarkerId, markerSrc));
    $('#marker' + currMarkerId).css('left', pt[0] + imgPos[0] - 5)
                               .css('top',  pt[1] + imgPos[1] - 5).show();
    inv[currMarkerId] = i;
    ++currMarkerId;
  }
  
  if (magic) {
    markerMagic = currMarkerId;
  }
}

function removeAllMarkers(magic=false) {
  if (!magic) {
    markerMagic = 0;
  }
  while (currMarkerId > markerMagic) {
    var markerElt = document.getElementById('marker' + --currMarkerId);
    document.body.removeChild(markerElt);
  }
}

function overlay(elemId, imageId, borderSize=0) {
  var elem   = $('#' + elemId);
  var img    = document.getElementById(imageId);
  var imgPos = findPosition(img);
  
  elem.css('position', 'absolute');
  elem.css('left',   (imgPos[0] + borderSize) + 'px');
  elem.css('top',    (imgPos[1] + borderSize) + 'px');
  elem.css('width',  img.clientWidth + 'px');
  elem.css('height', img.clientHeight + 'px');
}

function unnormalize(points, width, height) {
  return points.map(elt => [elt[0] * width, elt[1] * height]);
}

function drawPointsFromFile(id, filepath, magic=false) {
  $.getJSON(filepath, function(data) {
    img = document.getElementById(id);
    points[id] = unnormalize(data.points, img.clientWidth, img.clientHeight);
    drawMarkers(id, findPosition(img), magic);
  });
}

function getPointsFilepath(imgId) {
  var src = document.getElementById(imgId).src;
  var animal = src.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('.'));
  if (SUPPORTED_ANIMALS.indexOf(animal) > -1) {
    return [POINTS_DIR, animal + '.min.json'].join('/');
  } else {
    return DEFAULT_POINTS_FILEPATH;
  }
}

/*
 * Returns a 1D RGBA array for the given image element.
 */
function getImageData(img) {
  var cvs = document.createElement('canvas');
  var ctx = cvs.getContext('2d');
  cvs.width = img.clientWidth;
  cvs.height = img.clientHeight;
  ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
  
  return ctx.getImageData(0, 0, img.width, img.height);
}

function fillOutputCanvas(finalData, cvs, width, height) {
  cvs.width = width;
  cvs.height = height;
  
  var ctx = cvs.getContext('2d');
  var imgData = ctx.createImageData(width, height);
  imgData.data.set(new Uint8ClampedArray(finalData));
  ctx.putImageData(imgData, 0, 0);
  cvs.style.display = 'block'; // show canvas
}

function startCamera() {
  $('#' + ID_CAMERA_DIV).css('display', 'block');
  Webcam.attach('#' + ID_CAMERA_DIV);
  $('#' + ID_UPLOAD_BTN).addClass('pure-button-disabled');
  $('#' + ID_CONFIRM_IMG_BTN).addClass('pure-button-disabled');
  $('#' + ID_TAKE_PICTURE_BTN).addClass('gold');
  $('#' + ID_TAKE_PICTURE_BTN).off('click').on('click', stopCamera);
}

function stopCamera() {
  // Take the picture
  Webcam.snap(function(data_uri, cvs, ctx) {
    var img = document.getElementById(ID_IMG_FROM);
    img.src = cvs.toDataURL();
    Webcam.reset();
    $('#' + ID_TAKE_PICTURE_BTN).off('click').on('click', startCamera);
  });

  $('#' + ID_CAMERA_DIV).css('display', 'none');
  $('#' + ID_TAKE_PICTURE_BTN).removeClass('gold');
  $('#' + ID_UPLOAD_BTN).removeClass('pure-button-disabled');
  $('#' + ID_CONFIRM_IMG_BTN).removeClass('pure-button-disabled');
}

function computeAuxPoints(cpts) {
  var auxPoints = [];
  
  // Top left points ([0] is x, [1] is y)
  auxPoints.push([cpts[0][0], 0.75 * cpts[0][1]]);
  auxPoints.push([cpts[3][0], 0.50 * cpts[0][1]]);
  auxPoints.push([cpts[4][0], 0.45 * cpts[0][1]]);
  auxPoints.push([cpts[5][0], 0.40 * cpts[0][1]]);
  
  // Middle two points
  auxPoints.push([cpts[33][0], 0.35 * cpts[0][1]]);
  auxPoints.push([cpts[33][0], 0.60 * cpts[0][1]]);
  
  // Top right points
  auxPoints.push([cpts[9][0],  0.40 * cpts[0][1]]);
  auxPoints.push([cpts[10][0], 0.45 * cpts[0][1]]);
  auxPoints.push([cpts[11][0], 0.50 * cpts[0][1]]);
  auxPoints.push([cpts[14][0], 0.75 * cpts[0][1]]);
  
  return auxPoints;
}

/*
 * Ensure that all points are within the specified dimensions,
 * clamping values if necessary.
 * Assumes that dim 0 is horizontal and dim 1 is vertical.
 */
function constrain(pts, width, height) {
  for (var i = 0; i < pts.length; ++i) {
    pts[i][0] = pts[i][0].clip(0, width  - 1);
    pts[i][1] = pts[i][1].clip(0, height - 1);
  }
  return pts;
}

function detectPoints(imgId, callback) {
  var img = document.getElementById(imgId);
  var cvs = document.createElement('canvas');
  var ctx = cvs.getContext('2d');
  cvs.width = img.clientWidth, cvs.height = img.clientHeight;
  ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
  
  var ctracker = new clm.tracker({stopOnConvergence: true});
  ctracker.init(pModel);
  
  var info = {hasConverged: false};
  var onConvergence = function(evt) {
    info.hasConverged = true;
    var cpts = ctracker.getCurrentPosition();
    if (cpts) {
      var aux = computeAuxPoints(cpts);
      for (var idx = cpts.length; idx >= 0; --idx) {
        if (CLMTRACKR_KEEP.indexOf(idx) === -1) {
          // We shouldn't keep this one
          cpts.splice(idx, 1);
        }
      }
      points[imgId] = constrain(cpts.concat(aux), img.clientWidth, img.clientHeight);
      drawMarkers(imgId, findPosition(img), true);
    } else {
      drawPointsFromFile(imgId, DEFAULT_POINTS_FILEPATH, true);
    }
    document.removeEventListener('clmtrackrConverged', onConvergence);
    if (typeof callback !== 'undefined' && callback != null) {
      callback();
    }
  };
  document.addEventListener('clmtrackrConverged', onConvergence, false);
  ctracker.start(cvs);

  // Set a timeout
  setTimeout(function() { // just in case the tracker never converges
    if (!info.hasConverged) {
      ctracker.stop();
      onConvergence(); // use whatever points we've got
    }
  }, CLMTRACKR_TIMEOUT);
}

function doMorph() {
  var magnitude = parseInt(this.innerText.slice(0, -1)); // divide by 100.0 if true magnitude
  magnitude = MAGNITUDES[magnitude];
  
  var pointsCopy = JSON.parse(JSON.stringify(points));
  var mtData = runTriangulation(pointsCopy, magnitude['shape']);
  var midpoints = mtData[0], triangles = mtData[1];
  
  var fromData = getImageData(document.getElementById(ID_IMG_FROM)).data;
  var toData = getImageData(document.getElementById(ID_IMG_TO)).data;

  var toImg = document.getElementById(ID_IMG_TO);
  var width = toImg.clientWidth, height = toImg.clientHeight;
  var cvs = document.getElementById(ID_CVS_OUT);
  
  // Replace GO buttons with busy icon
  $('#' + ID_GO_CONTAINER).css('display', 'none');
  $('#' + ID_LOADER).css('display', 'inline-block');

  setTimeout(function() {
    var morph = computeMidpointImage(midpoints, triangles, fromData, toData,
        pointsCopy[ID_IMG_FROM], pointsCopy[ID_IMG_TO], width, height, cvs,
        magnitude['color0'], magnitude['color1']);

    var modal = null;
    if (morph) {
      fillOutputCanvas(morph, cvs, width, height);
      var modal = new Custombox.modal({
        content: {
          effect: 'fadein',
          target: '#' + ID_OUTPUT_MODAL,
          onComplete: function() {
            $('#' + ID_DOWNLOAD).attr('href', cvs.toDataURL('image/png'));
          }
        }
      });
    } else {
      // Morph failed
      alert('The Splice was a failure! Please reposition the markers.');
    }
  
    // Replace busy icon with GO buttons
    $('#' + ID_LOADER).css('display', 'none');
    $('#' + ID_GO_CONTAINER).css('display', 'block');
  
    if (modal != null) {
      modal.open();
    }
  }, 0);
}

function setupCanvases() {
  overlay(ID_CVS_FROM, ID_IMG_FROM, BORDER_SIZE);
  overlay(ID_CVS_TO, ID_IMG_TO, BORDER_SIZE);
}

function setupImageUploads() {
  document.getElementById(ID_UPLOAD).addEventListener('change', function() {
    var img = document.getElementById(ID_IMG_FROM);
    var file = document.getElementById(ID_UPLOAD).files[0];
    var reader = new FileReader();

    reader.onloadend = function() {
      img.style.display = 'none';
      img.src = reader.result;

      var otherImg = document.getElementById(ID_IMG_TO);
      var container = document.getElementById(ID_CONTAINER_FROM);
      container.style.width  = otherImg.clientWidth  + 'px';
      container.style.height = otherImg.clientHeight + 'px';
      container.style.marginBottom = '13px';
      cropper = new Cropper(img, {
        cropBoxResizable: false,
        aspectRatio: otherImg.clientWidth / otherImg.clientHeight,
        ready: function() {
          this.cropper.setCropBoxData({
            left: 0,
            top: 0,
            width: otherImg.clientWidth,
            height: otherImg.clientHeight
          });
          img.style.display = 'inline';
        }
      });

      $('#' + ID_UPLOAD_BTN).css('display', 'none');
      $('#' + ID_CONFIRM_CROP_BTN).addClass('gold');
      $('#' + ID_CONFIRM_CROP_BTN).css('display', 'inline-block');
      $('#' + ID_TAKE_PICTURE_BTN).addClass('pure-button-disabled');
      $('#' + ID_CONFIRM_IMG_BTN).addClass('pure-button-disabled');
    }

    if (file) {
      reader.readAsDataURL(file);
    }
  }, true);
  
  $('#' + ID_CONFIRM_CROP_BTN).click(function(evt) {
    var otherImg = document.getElementById(ID_IMG_TO);
    var croppedCvs = cropper.getCroppedCanvas({
      width: otherImg.clientWidth,
      height: otherImg.clientHeight
    });
    cropper.destroy();
    var img = document.getElementById(ID_IMG_FROM);
    img.src = croppedCvs.toDataURL();
    $('#' + ID_CONFIRM_CROP_BTN).css('display', 'none');
    $('#' + ID_CONFIRM_CROP_BTN).removeClass('gold');
    $('#' + ID_UPLOAD_BTN).css('display', 'inline-block');
    $('#' + ID_TAKE_PICTURE_BTN).removeClass('pure-button-disabled');
    $('#' + ID_CONFIRM_IMG_BTN).removeClass('pure-button-disabled');
  });
}

function setupCamera() {
  overlay(ID_CAMERA_DIV, ID_IMG_FROM, BORDER_SIZE);
  var fromImg = document.getElementById(ID_IMG_FROM);

  var camWidth, camHeight;
  if (isMobile) {
    camWidth  = fromImg.clientWidth;
    camHeight = fromImg.clientWidth / 3 * 4; // 4:3 ratio required (?)
  } else {
    camWidth  = fromImg.clientHeight / 3 * 4; // 4:3 ratio required
    camHeight = fromImg.clientHeight;
  }
  Webcam.set({
    width: camWidth,
    height: camHeight,
    crop_width: fromImg.clientWidth,
    crop_height: fromImg.clientHeight,
    image_format: 'jpeg',
    jpeg_quality: 90
  });
  $('#' + ID_TAKE_PICTURE_BTN).click(startCamera);
}

function setupAnimalSelection() {
  var container = document.getElementById(ID_ANIMAL_SELECTION);
  var images = container.getElementsByTagName('img');
  var i, src;
  for (i = 0; i < images.length; ++i) {
    if (images[i].classList.contains('animal-active')) {
      activeAnimal = images[i];
    }
    images[i].onclick = function() {
      if (activeAnimal != null) {
        $(activeAnimal).removeClass('animal-active');
      }
      src = this.src;
      $('#' + ID_IMG_TO).attr('src', src.replace('_small', ''));
      activeAnimal = this;
      $(activeAnimal).addClass('animal-active');

      // Update points
      if (currMarkerId > 0) {
        removeAllMarkers(true); // it says "all", but it's only the destination points
        drawPointsFromFile(ID_IMG_TO, getPointsFilepath(ID_IMG_TO), false);
      }
    }
  }
}

function setupImageSwitching() {
  $('#' + ID_CHANGE_IMG_BTN).click(function(evt) {
    // Basically de-confirm the image
    // Deactivate GO buttons
    var container = document.getElementById(ID_GO_CONTAINER);
    var buttons = container.getElementsByTagName('button');
    var i;
    for (i = 0; i < buttons.length; ++i) {
      $(buttons[i]).addClass('pure-button-disabled');
    }
    
    // Remove markers and re-enable upload/camera buttons
    removeAllMarkers();
    $('#' + ID_CHANGE_IMG_BTN).css('display', 'none');
    $('#' + ID_CONFIRM_IMG_BTN).css('display', 'inline-block');
    $('#' + ID_TAKE_PICTURE_BTN).removeClass('pure-button-disabled');
    $('#' + ID_UPLOAD_BTN).removeClass('pure-button-disabled');
  });
}

function setupImageConfirm() {
  $('#' + ID_CONFIRM_IMG_BTN).click(function(evt) {
    $('#' + ID_UPLOAD_BTN).addClass('pure-button-disabled');
    $('#' + ID_TAKE_PICTURE_BTN).addClass('pure-button-disabled');
    $('#' + ID_CONFIRM_IMG_BTN).css('display', 'none');
    $('#' + ID_CHANGE_IMG_BTN).css('display', 'inline-block');

    // Create "from" points
    points[ID_IMG_FROM] = [];
    // drawPointsFromFile(ID_IMG_FROM, DEFAULT_POINTS_FILEPATH, true);
    detectPoints(ID_IMG_FROM, function() {
      // Create "to" points AFTER "from" points are decided
      points[ID_IMG_TO] = [];
      drawPointsFromFile(ID_IMG_TO, getPointsFilepath(ID_IMG_TO), false);
      
      setupMarkers(); // make the "from" markers draggable
    
      // Activate GO buttons
      var container = document.getElementById(ID_GO_CONTAINER);
      var buttons = container.getElementsByTagName('button');
      var i;
      for (i = 0; i < buttons.length; ++i) {
        $(buttons[i]).removeClass('pure-button-disabled');
      }
    });
  });
}

function setupMarkers() {
  function launchMarkerAdjustment(evt) {
    if (!evt) {
      var evt = window.event;
    }
    var target = evt.target || evt.srcElement;
    if (!target.id.startsWith('marker')) {
      return;
    }

    var cvsId = (relevId == ID_IMG_FROM) ? ID_CVS_FROM : ID_CVS_TO;
    relevCtx = document.getElementById(cvsId).getContext('2d');
    var relevImg = document.getElementById(relevId);
    relevWidth  = relevImg.clientWidth;
    relevHeight = relevImg.clientHeight;
    relevMarkerNo = parseInt(target.id.match(/\d+$/)[0], 10);
    relevPos = findPosition(relevImg);
    document.addEventListener('mousemove', doMarkerAdjustment);
    return false;
  }

  function doMarkerAdjustment(evt) {
    if (!evt) {
      var evt = window.event;
    }
    var target = evt.target || evt.srcElement;
    var inImgCoords = [
      evt.pageX - relevPos[0],
      evt.pageY - relevPos[1]
    ];

    if (inImgCoords[0] >= 0 && inImgCoords[0] < relevWidth &&
        inImgCoords[1] >= 0 && inImgCoords[1] < relevHeight) {
      $('#marker' + relevMarkerNo).css('left', evt.pageX - 5).css('top', evt.pageY - 5);
      points[relevId][inv[relevMarkerNo]] = inImgCoords;
      relevCtx.clearRect(0, 0, relevWidth, relevHeight);
    }
    return false;
  }

  function finishMarkerAdjustment(evt) {
    document.removeEventListener('mousemove', doMarkerAdjustment);
  }

  document.onmousedown = launchMarkerAdjustment;
  document.onmouseup   = finishMarkerAdjustment;
}

function setupModalClose() {
  $('#' + ID_MODAL_CLOSE).click(function(evt) {
    evt.preventDefault();
    Custombox.modal.close();
    return false;
  });
}

function setupGoButtons() {
  var container = document.getElementById(ID_GO_CONTAINER);
  var buttons = container.getElementsByTagName('button');
  for (var i = 0; i < buttons.length; ++i) {
    buttons[i].onclick = doMorph;
  }
}

$(window).on('load', function() {
  setupCanvases();
  setupImageUploads();
  setupCamera();
  setupAnimalSelection();
  setupImageSwitching();
  setupImageConfirm();
  setupModalClose();
  setupGoButtons();
});
