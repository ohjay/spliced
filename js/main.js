/*
 * Code specific to the page's interface.
 */

$(window).on('load', function() {
  // Animal selection
  var container = document.getElementById(ID_ANIMAL_SELECTION);
  var images = container.getElementsByTagName('img');
  var i, src;
  for (i = 0; i < images.length; ++i) {
    images[i].onclick = function() {
      src = this.src;
      $('#' + ID_IMG_TO).attr('src', src.replace('_small', ''));
    }
  }
});
