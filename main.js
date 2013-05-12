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

//Use a GLOBAL json object to stored the results of our searchs, then we can just render that to the screen
var nodes = [];

//Define the object we'll use for each node
function node(){
	this.title = "";
	this.anchors = [];
}

//Processing function for each URL. Parses the page and grabs out the title and tags
function processGET(){
	if ( xmlHttp.readyState == 4 && xmlHttp.status == 200 ){
        var pageAsText = xmlHttp.responseText;
        
        var anchorMatch = /<a.*href="(.*)".*<\/a>/i;
        var titleMatch = /<title>(.*)<\/title>/i;

        console.log("hey");

        //Grab the title
        var result = new node();
        result.title = titleMatch.exec(pageAsText);

        console.log(result);
        //Loop through the text and find all

    }
}

//Helper function to grab URL
function httpGet(theUrl){
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = processGET;
    xmlHttp.open( "GET", theUrl, true );
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

//The function that will go and do all the work
function aggregate(){
	//Grab the text of the input:
	var rootUrl = document.getElementById('urlEnter').value;

	/*General Algorithm:
	 * Retrieve URL, find all anchor tags
	 * Draw links to each from root
	 * Update
	 */
	 httpGet('proxy.php?url='+encodeURIComponent(rootUrl));
	
}

//Bind the event
var goButton = document.getElementById('Go');
goButton.onclick = aggregate;