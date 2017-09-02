/*
 * Code specific to the page's interface.
 */

var activeAnimal = null;
var currMarkerId = 0;
var inv          = {}; // marker ID # --> index in respective `points` array

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
    $.getJSON(DEFAULT_POINTS_FILEPATH, function(data) {
      var fromImg = document.getElementById(ID_IMG_FROM);
      var width = fromImg.clientWidth, height = fromImg.clientHeight;
      var positions = data.points.map(elt => [elt[0] * width, elt[1] * height]);
      points = {ID_IMG_FROM: [], ID_IMG_TO: []};
      for (var i = 0; i < positions.length; ++i) {
        points[ID_IMG_FROM].push(positions[i]);
      }
      console.log(positions.length); // TODO remove
      console.log('---'); // TODO remove
      
      // Left side points
      points[ID_IMG_FROM].push([0.75 * positions[0][0], positions[0][1]]);
      points[ID_IMG_FROM].push([0.75 * positions[0][0], positions[2][1]]);
      // Right side points
      var img = document.getElementById(ID_IMG_FROM);
      var rdx = 0.25 * (img.clientWidth - positions[14][0]);
      points[ID_IMG_FROM].push([rdx + positions[14][0], positions[14][1]]);
      points[ID_IMG_FROM].push([rdx + positions[14][0], positions[12][1]]);
      // Top points
      points[ID_IMG_FROM].push([positions[19][0], 0.30 * positions[19][1]]);
      points[ID_IMG_FROM].push([positions[22][0], 0.25 * positions[22][1]]);
      points[ID_IMG_FROM].push([positions[18][0], 0.25 * positions[18][1]]);
      points[ID_IMG_FROM].push([positions[15][0], 0.30 * positions[15][1]]);

      // Draw the markers
      drawMarkers(ID_IMG_FROM, findPosition(img));
      setupMarkers();
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

    var canvasId = ID_CVS_FROM;
    relevCtx = document.getElementById(canvasId).getContext('2d');

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

$(window).on('load', function() {
  setupImageUploads();
  setupAnimalSelection();
  setupImageConfirm();
});
