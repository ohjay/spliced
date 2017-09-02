/*
 * Code specific to the page's interface.
 */

var activeAnimal = null;
var currMarkerId = 0;
var points       = {};
var inv          = {}; // marker ID # --> index in respective `points` array
var relevCtx, relevWidth, relevHeight, relevMarkerNo, relevPos;

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
function drawMarkers(id, imgPos) {
  var relevantPoints = points[id];
  var numPoints = relevantPoints.length;
  var pt, i, markerSrc;
  
  var mi = 0;
  for (i = 0; i < numPoints; ++i) {
    markerSrc = MARKER_DIR + MARKER_CYCLE[mi];
    mi = (mi + 1) % MARKER_CYCLE.length;
    
    pt = relevantPoints[i];
    document.body.appendChild(createMarker('marker' + currMarkerId, markerSrc));
    $('#marker' + currMarkerId).css('left', pt[0] + imgPos[0] - 5)
                               .css('top',  pt[1] + imgPos[1] - 5).show();
    inv[currMarkerId] = i;
    ++currMarkerId;
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

function drawPointsFromFile(id, filepath) {
  $.getJSON(filepath, function(data) {
    img = document.getElementById(id);
    points[id] = unnormalize(data.points, img.clientWidth, img.clientHeight);
    drawMarkers(id, findPosition(img));
  });
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
  cvs.style.display = 'inline'; // show canvas
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
      // hideCanvasesAndMarkers(); // TODO ?
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
    // showCanvasesAndMarkers(); // TODO ?
    $('#' + ID_CONFIRM_CROP_BTN).css('display', 'none');
    $('#' + ID_UPLOAD_BTN).css('display', 'inline-block');
    $('#' + ID_TAKE_PICTURE_BTN).removeClass('pure-button-disabled');
    $('#' + ID_CONFIRM_IMG_BTN).removeClass('pure-button-disabled');
  });
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
    }
  }
}

function setupImageConfirm() {
  $('#' + ID_CONFIRM_IMG_BTN).click(function(evt) {
    $('#' + ID_UPLOAD_BTN).addClass('pure-button-disabled');
    $('#' + ID_TAKE_PICTURE_BTN).addClass('pure-button-disabled');
    $('#' + ID_CONFIRM_IMG_BTN).addClass('pure-button-disabled');
    // TODO remove confirm button, add restart button

    // Create "from" points
    points[ID_IMG_FROM] = [];
    drawPointsFromFile(ID_IMG_FROM, DEFAULT_POINTS_FILEPATH);
    setupMarkers(); // make the markers draggable
    
    // Create "to" points
    points[ID_IMG_TO] = [];
    drawPointsFromFile(ID_IMG_TO, DEFAULT_POINTS_FILEPATH);
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

    relevCtx = document.getElementById(ID_CVS_FROM).getContext('2d');
    var relevImg = document.getElementById(ID_IMG_FROM);
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
      points[ID_IMG_FROM][inv[relevMarkerNo]] = inImgCoords;
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

function setupGoButtons() {
  var container = document.getElementById(ID_GO_CONTAINER);
  var buttons = container.getElementsByTagName('button');
  var i, magnitude;
  for (i = 0; i < buttons.length; ++i) {
    buttons[i].onclick = function() {
      var fromData = getImageData(document.getElementById(ID_IMG_FROM)).data;
      var toData = getImageData(document.getElementById(ID_IMG_TO)).data;

      magnitude = parseInt(this.innerText.slice(0, -1)) / 100.0;
      var mtData = runTriangulation(points, 1.0 - magnitude);
      var midpoints = mtData[0], triangles = mtData[1];
      
      var cvs = document.getElementById(ID_CVS_FROM); // TODO make new canvas
      var toImg = document.getElementById(ID_IMG_TO);
      var width = toImg.clientWidth, height = toImg.clientHeight;
      var morph = computeMidpointImage(midpoints, triangles, fromData, toData,
          points[ID_IMG_FROM], points[ID_IMG_TO], width, height, cvs,
          1.0 - magnitude, magnitude);
      if (!morph) {
        // morph failed
        // TODO do something (make them reposition points?)
      }
      fillOutputCanvas(morph, cvs, width, height);
      // document.getElementById(ID_IMG_DL_LINK).href = canvasTo.toDataURL('image/png'); // TODO
      // markerMagic = 0; getRidOfAllOfTheMarkers(); // TODO
    }
  }
}

$(window).on('load', function() {
  setupCanvases();
  setupImageUploads();
  setupAnimalSelection();
  setupImageConfirm();
  setupGoButtons();
});
