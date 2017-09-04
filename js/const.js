/*
 * Collection of constants that can be easily configured
 * and used by `facemorphing.js` and `main.js`.
 */

const ID_IMG_FROM         = 'img-from';
const ID_IMG_TO           = 'img-to';
const ID_CVS_FROM         = 'canvas-from';
const ID_CVS_TO           = 'canvas-to';
const ID_CVS_OUT          = 'canvas-out';
const ID_UPLOAD           = 'upload';
const ID_UPLOAD_BTN       = 'button-upload';
const ID_CONTAINER_FROM   = 'container-img-from';
const ID_CONFIRM_CROP_BTN = 'confirm-crop';
const ID_CONFIRM_IMG_BTN  = 'confirm-image';
const ID_CHANGE_IMG_BTN   = 'change-image';
const ID_TAKE_PICTURE_BTN = 'take-picture';
const ID_ANIMAL_SELECTION = 'animal-selection';
const ID_GO_CONTAINER     = 'go-buttons';
const ID_OUTPUT_MODAL     = 'output-modal';
const ID_DOWNLOAD         = 'download-link';
const ID_MODAL_CLOSE      = 'modal-close';
const ID_CAMERA_DIV       = 'camera';
const ID_LOADER           = 'loader';

const POINTS_DIR              = 'data';
const DEFAULT_POINTS_FILEPATH = 'data/chimpanzee.min.json';
const SUPPORTED_ANIMALS       = [
  'cat', 'chimpanzee', 'dog1', 'eagle', 'giraffe', 'owl', 'pigeon',
  'polar_bear', 'raccoon', 'ram', 'salamander1', 'snow_leopard', 'squirrel', 'tiger'
];

const NUM_MARKERS   = 15;
const MARKER_DIR    = 'images/markers/marker';
const MARKER_EXT    = '.png';

const BORDER_SIZE = 5;
const MAGNITUDES  = {
  5:  {'shape': 0.95, 'color0': 0.90, 'color1': 0.20},
  10: {'shape': 0.90, 'color0': 0.70, 'color1': 0.30},
  15: {'shape': 0.70, 'color0': 0.70, 'color1': 0.30},
  50: {'shape': 0.50, 'color0': 0.50, 'color1': 0.50}
};

const CLMTRACKR_TIMEOUT = 3000; // ms
const CLMTRACKR_KEEP    = [
  0, 2, 4, 7, 10, 12, 14, 23, 24, 25, 26, 28, 29, 30, 31, 33, 35, 37, 39, 44, 47, 50, 53
];
