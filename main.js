/* Ethan Eldridge
 * May 12th 2013
 * main.js
 * Interfaces with canvas object and actually does all the interesting things for linkregater
 *
 *
*/

var canvas = document.getElementById('canvas');

//Make sure we got it
if (canvas && canvas.getContext) {
  // Get the 2d context of the canvas --only one per canvas
  var context = canvas.getContext('2d');
  var cWidth = canvas.width;
  var cHeight = canvas.height;

  if (context) {
  	//Draw Background of Canvas
  	context.fillStyle = '#67E667';
    context.fillRect(0, 0, cWidth, cHeight);

    //Switch back to black for writing text
    context.fillStyle = '000';
    context.font = 'bold 100% sans-serif ';
    context.fillText('Use the text box and button to the left to begin!',cWidth/3,cHeight/2);


  }
}