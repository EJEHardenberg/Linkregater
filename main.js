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

//Use a hash to keep track of unique links, we don't want to process the same link twice
var visitedLinks = {}


//Define the object we'll use for each node
function node(){
	this.title = "";
	this.anchors = [];
}

//Processing function for each URL. Parses the page and grabs out the title and tags.
function processGET(xmlHttp,depth,baseURL){
	if ( xmlHttp.readyState == 4 && xmlHttp.status == 200 ){
        var pageAsText = xmlHttp.responseText;
        
        var anchorMatch = /<a.*href="([^"]*).*<\/a>/ig;
        var titleMatch = /<title>(.*)<\/title>/im;

        
        //Grab the title
        var result = new node();
        var tmp = titleMatch.exec(pageAsText); //exec returns 0=>whole match 1=>what I want in ()
        if(tmp != null)
        	result.title = tmp[1];
        else
        	return;//Don't care if theres no title, I dont want this page then
        
        //Loop through the text and find all
        var intermediate;
        do{
			intermediate = anchorMatch.exec(pageAsText);	
			if(intermediate)
				if(!visitedLinks[intermediate]){
					//If the anchor text doesn't begin with http, its a relative path and we should base it off the url
					if(intermediate[1].indexOf(baseURL)==-1){
						intermediate[1] = baseURL + intermediate[1];
					}
					result.anchors.push(intermediate[1]);
					visitedLinks[intermediate] = true;
				}else{
					//We've visited this link before
				}

    	}while(intermediate != null);    	

    	//For each of these anchors we've found, we want to grab their links too, if the depth is permissiable
    	if(depth > 0){
    		for (var i = result.anchors.length - 1; i >= 0; i--) {
    			httpGet(encodeURIComponent(result.anchors[i]),depth-1);
    		};
    	}
		
		//Add this result to the global nodes list
		nodes.push(result);

		console.log(nodes);

		//Set some flag to update the graph
    }
}

//Helper function to grab URL
function httpGet(theUrl,depth){
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function(){processGET(xmlHttp,depth,decodeURIComponent(theUrl))};
    xmlHttp.open( "GET", 'proxy.php?url='+theUrl, true );
    xmlHttp.send( null );
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
	 httpGet(encodeURIComponent(rootUrl),3);
	
}

//Bind the event
var goButton = document.getElementById('Go');
goButton.onclick = aggregate;