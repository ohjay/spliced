/*
 * Code specific to the page's interface.
 */

var activeAnimal = null;
var currMarkerId = 0;
var markerMagic  = 0;
var points       = {};
var inv          = {}; // marker ID # --> index in respective `points` array
var relevId      = ID_IMG_FROM;
var isMobile     = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
var relevCtx, relevWidth, relevHeight, relevMarkerNo = null, relevPos;
var cropper;

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
function drawMarkers(id, imgPos, magic, callback) {
  magic = (typeof magic === 'undefined') ? false : magic;
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
  if (typeof callback !== 'undefined' && callback !== null) {
    callback();
  }
}

function removeAllMarkers(magic) {
  magic = (typeof magic === 'undefined') ? false : magic;
  if (!magic) {
    markerMagic = 0;
  }
  while (currMarkerId > markerMagic) {
    var markerElt = document.getElementById('marker' + --currMarkerId);
    document.body.removeChild(markerElt);
  }
}

function overlay(elemId, imageId, borderSize) {
  borderSize = (typeof borderSize === 'undefined') ? 0 : borderSize;
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
  return points.map(function(elt) {
    return [elt[0] * width, elt[1] * height];
  });
}

function drawPointsFromFile(id, filepath, magic, callback) {
  magic = (typeof magic === 'undefined') ? false : magic;
  $.getJSON(filepath, function(data) {
    img = document.getElementById(id);
    points[id] = unnormalize(data.points, img.clientWidth, img.clientHeight);
    drawMarkers(id, findPosition(img), magic);
    if (typeof callback !== 'undefined' && callback !== null) {
      callback();
    }
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
      drawMarkers(imgId, findPosition(img), true, callback);
    } else {
      drawPointsFromFile(imgId, DEFAULT_POINTS_FILEPATH, true, callback);
    }
    document.removeEventListener('clmtrackrConverged', onConvergence);
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
      modal = new Custombox.modal({
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
      Custombox.modal.closeAll();
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
      $('#' + ID_CONFIRM_IMG_BTN).addClass('pure-button-disabled');
      $('#' + ID_CROP_INSTRS).css('display', 'inline');
    };

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
    $('#' + ID_CONFIRM_IMG_BTN).removeClass('pure-button-disabled');
    $('#' + ID_CROP_INSTRS).css('display', 'none');
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

      // Update points
      if (currMarkerId > 0) {
        removeAllMarkers(true); // it says "all", but it's only the destination points
        drawPointsFromFile(ID_IMG_TO, getPointsFilepath(ID_IMG_TO), false);
      }
    };
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
    
    // Remove markers and re-enable upload button
    removeAllMarkers();
    $('#' + ID_CHANGE_IMG_BTN).css('display', 'none');
    $('#' + ID_CONFIRM_IMG_BTN).css('display', 'inline-block');
    $('#' + ID_UPLOAD_BTN).removeClass('pure-button-disabled');
    if (isMobile) {
      $('#' + ID_MARKER_INSTRS).css('display', 'none');
    }
  });
}

function setupImageConfirm() {
  $('#' + ID_CONFIRM_IMG_BTN).click(function(evt) {
    $('#' + ID_UPLOAD_BTN).addClass('pure-button-disabled');
    $('#' + ID_CONFIRM_IMG_BTN).css('display', 'none');
    $('#' + ID_CHANGE_IMG_BTN).css('display', 'inline-block');
    
    var _finishSetup = function() {
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
    };

    // Create "from" points
    points[ID_IMG_FROM] = [];
    var imgFrom = document.getElementById(ID_IMG_FROM);
    if (imgFrom.src.endsWith('chimpanzee.jpg')) {
      drawPointsFromFile(ID_IMG_FROM, DEFAULT_POINTS_FILEPATH, true, _finishSetup);
    } else {
      detectPoints(ID_IMG_FROM, _finishSetup);
    }
    
    if (isMobile) {
      $('#' + ID_MARKER_INSTRS).css('display', 'inline');
    }
  });
}

function setupMarkers() {
  function launchMarkerAdjustment(evt) {
    if (!evt) {
      evt = window.event;
    }
    var target = evt.target || evt.srcElement;
    var idMatch = target.id.match(/\d+$/);
    if (!target.id.startsWith('marker') || idMatch === null) {
      return;
    }
    var targetMarkerNo = parseInt(idMatch[0], 10);
    if (targetMarkerNo >= markerMagic) {
      return;
    }

    var cvsId = (relevId == ID_IMG_FROM) ? ID_CVS_FROM : ID_CVS_TO;
    relevCtx = document.getElementById(cvsId).getContext('2d');
    var relevImg = document.getElementById(relevId);
    relevWidth  = relevImg.clientWidth;
    relevHeight = relevImg.clientHeight;
    relevMarkerNo = targetMarkerNo;
    relevPos = findPosition(relevImg);
    $('#marker' + relevMarkerNo).addClass('glow');
    return false;
  }

  function doMarkerAdjustment(evt) {
    if (!evt) {
      evt = window.event;
    }
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
    $('#marker' + relevMarkerNo).removeClass('glow');
    relevMarkerNo = null;
  }

  /*
   * Mouse handlers.
   */

  function launchMouseAdjustment(evt) {
    var retval = launchMarkerAdjustment(evt);
    if (relevMarkerNo !== null) {
      document.addEventListener('mousemove', doMarkerAdjustment);
    }
    return retval;
  }

  function finishMouseAdjustment(evt) {
    document.removeEventListener('mousemove', doMarkerAdjustment);
    finishMarkerAdjustment(evt);
  }

  /*
   * Touch handlers.
   */

  function handleTouchAdjustment(evt) {
    var touch = evt.changedTouches[0];
    if (relevMarkerNo !== null) {
      // Place marker
      doMarkerAdjustment(touch);
      finishMarkerAdjustment(touch);
      evt.preventDefault();
    } else if (typeof launchMarkerAdjustment(touch) !== 'undefined') {
      // ^ Select marker
      evt.preventDefault();
    }
  }

  document.onmousedown = launchMouseAdjustment;
  document.onmouseup   = finishMouseAdjustment;
  document.addEventListener('touchend', handleTouchAdjustment, true);
}

function setupExample() {
  $('#' + ID_EXAMPLE).click(function(evt) {
    Custombox.modal.closeAll();
    new Custombox.modal({
      content: {
        effect: 'fadein',
        target: '#' + ID_EXAMPLE_MODAL
      }
    }).open();
  });
}

function setupModalClose() {
  var doClose = function(evt) {
    evt.preventDefault();
    Custombox.modal.close();
    return false;
  };
  $('#' + ID_EXAMPLE_CLOSE).click(doClose);
  $('#' + ID_MODAL_CLOSE  ).click(doClose);
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
  setupAnimalSelection();
  setupImageSwitching();
  setupImageConfirm();
  setupExample();
  setupModalClose();
  setupGoButtons();
});
