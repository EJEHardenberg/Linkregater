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

//Maximum search depth for links
var maxDepth = 3;

//Size of displayed nodes (radius)
var nodeSize = 15;


//Define the object we'll use for each node
function node(){
	this.title = "";
	this.anchors = [];
	this.parent = null;
	this.depth = 0;
	this.id = null;
	this.url = "";
}


function fireEvent(name, target) {
    //Ready: create a generic event
    var evt = document.createEvent("Events")
    //Aim: initialize it to be the event we want
    evt.initEvent(name, true, true); //true for can bubble, true for cancelable
    //Fire the event
    target.dispatchEvent(evt);
}

//Processing function for each URL. Parses the page and grabs out the title and tags.
function processGET(xmlHttp,depth,baseURL,parentNode){
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

        result.parent = parentNode;
        result.depth = maxDepth - depth;
        result.id = depth + 'x' + result.title + Math.random().toString(36).substring(7);
        result.url = baseURL;
        
        //Loop through the text and find all
        var intermediate;
        do{
			intermediate = anchorMatch.exec(pageAsText);	
			if(intermediate)
				if(!visitedLinks[intermediate]){
					//If the anchor text doesn't begin with http, its a relative path and we should base it off the url
					if(intermediate[1].indexOf('http://')==-1 && intermediate[1].indexOf('https://')==-1){
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
    			httpGet(encodeURIComponent(result.anchors[i]),depth-1,result);
    		};
    	}
		
		//Add this result to the global nodes list
		nodes.push(result);

		//Fire event to update graph
		fireEvent('updateGraph',document);
    }
}

//Helper function to grab URL
function httpGet(theUrl,depth,parentNode){
	//Show loaders
    document.getElementById('loadImg').style.visibility='visible';
    
    var xmlHttp = null;
    xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function(){processGET(xmlHttp,depth,decodeURIComponent(theUrl),parentNode)};
    //Change false to true for a cool visual
    xmlHttp.open( "GET", 'proxy.php?url='+theUrl, true );
    xmlHttp.send( null );
}

//The function that will go and do all the work
function aggregate(){
	//Grab the text of the input:
	var rootUrl = document.getElementById('urlEnter').value;

	//Show loaders
    document.getElementById('loadImg').style.visibility='visible';
    

	//Check for http:// (most people will likely place www.)
	if(rootUrl.indexOf("http://")==-1 && rootUrl.indexOf("https://")==-1){
		rootUrl = "http://" + rootUrl;
	}

	//Clear out the old list of links
	nodes = [];

	/*General Algorithm:
	 * Retrieve URL, find all anchor tags
	 * Draw links to each from root
	 * Update or create a radial tree graph
	 */
	
	httpGet(encodeURIComponent(rootUrl),parseInt(maxDepth),null);
	
}

//Simple tuple object to make things easier
function tuple(){
	this.x = 0;
	this.y = 0;
}

function determineNodeLocations(){
	//Sort nodes:
	nodes.sort(function(a,b){
		if(a.depth > b.depth){
			return 1;
		}else if(a.depth < b.depth){
			return -1;
		}else{
			return 0;
		}
	});
	

	//Determine space between levels Levels:
	var levelSpace = (cHeight)/(maxDepth +1);
	var startY = 10; //Buffer space from the top

	//Space between horizontal
	var sectorSpace = {};

	//Determine where each node should go 
	locations = {};
	currentDepth = 0;
	for (var i =0; i < nodes.length - 1;  i++) {
		currentDepth = nodes[i].depth;

		//x is based on how many nodes are in this level
		var numNodes = 0;
		for( var j = 0; j < nodes.length-1; j++){
			if(nodes[j].depth == currentDepth){
				numNodes += 1;
			}
			//Because the nodes are in order, we can cut this early for efficiency"
			if(nodes[j].depth > currentDepth){
				j = nodes.length;
				break;
			}
		}
		sectorSpace[currentDepth] = (cWidth-nodeSize)/(numNodes+1);
		
		//hop through the nodes in the same order as we counted them
		var nodeNumber = 1;
		for( var j = 0; j < nodes.length-1; j++){
			if(nodes[j].depth == currentDepth){
				loc = new tuple();
				loc.y = startY + nodes[j].depth * levelSpace;
				loc.x = nodeNumber*sectorSpace[currentDepth]
				locations[nodes[j].id] = loc;	
				nodeNumber++;
			}
			//Because the nodes are in order, we can cut this early for efficiency"
			if(nodes[j].depth > currentDepth){
				j = nodes.length;
				break;
			}
		}

	};

	

	return locations;
}

function drawGraph(){
	//Determine how level's we'll need based on the maximum depth and the size of the canvas, we'll give ourselves some buffer space as well
	var radiusSize = (cWidth-100)/maxDepth;
	nodeSize = (cWidth/nodes.length)/maxDepth;
	
	canvas.width = cWidth;

	//I should probably use the size of the box and such to create a transformation matrix and apply that to everything. That come after...
	var locations = determineNodeLocations();

	//Empty the graph by coloring over everything
	context.fillStyle = '#67E667';
	context.fillRect(0, 0, cWidth, cHeight);
	context.stroke();

	//For each node place a circle down and draw a path to its parent
	for (var i = nodes.length - 1; i >= 0; i--) {
		if(typeof (locations[nodes[i].id]) != 'undefined'){
			var x =locations[nodes[i].id].x
			var y = locations[nodes[i].id].y
			//Draw the node itself
			context.beginPath();
			context.arc(x, y, nodeSize, 0, 2 * Math.PI, false);	
			context.closePath();
			context.stroke();

			context.fillStyle = '000';
			context.font = 'bold 50% sans-serif';
			context.fillText(nodes[i].url,x,y);
			context.stroke();

			//Draw the line to its parent
			if(nodes[i].parent!= null){
				context.beginPath();
				context.moveTo(x, y);

				var px = locations[nodes[i].parent.id].x;
				var py = locations[nodes[i].parent.id].y;
		
				context.lineTo(px, py);
				context.closePath();
				context.stroke();
			}
		}else{
			//console.log(nodes[i]);
		}
	};

	context.lineWidth = 5;
    context.strokeStyle = '#003300';

	document.getElementById('loadImg').style.visibility='hidden';


}

//Bind the event for choosing a url
var goButton = document.getElementById('Go');
var inputBox = document.getElementById('urlEnter');
goButton.onclick = aggregate;
inputBox.onkeydown = function(e){
	if(e.keyCode==13){
		aggregate();
	}
}

var depthSelever = document.getElementById('depth');
depthSelever.onchange = function(){
	maxDepth = parseInt(document.getElementById('depth').value);	
}


//Bind the event for updating the graph
window.addEventListener("updateGraph", drawGraph, false); //false to get it in bubble not capture. (https://developer.mozilla.org/en-US/docs/DOM/EventTarget.addEventListener)

