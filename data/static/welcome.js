var gLastEvent = ""
var gConn = null;

$( document ).ready(
	function()
	{
		console.log("document / ready");
		console.log("open SockJS connection")
		gConn = new SockJS('//' + window.location.host + '/orwell');
		console.log("gConn = " + gConn)
		gConn.onopen = function() {
			console.log('Connected.');
		};
		gConn.onmessage = function(e) {
			console.log('Received: ' + e.data);
			document.getElementById("status").innerHTML = e.data;
		};
		gConn.onclose = function() {
			console.log('Disconnected.');
			gConn = null;
		};
		//var ProtoBuf = require("protobufjs");
		$( "a" ).click(
			function( event )
			{
				//event.preventDefault();
				//$( this ).hide( "slow" );
				alert( "Thanks for visiting!" );
			}
		);
		$( document ).keydown(
			function(event)
			{
				var newEvent = ""
				if( event.which == 37 )
				{
					event.preventDefault();
					newEvent = "LEFT"
				}
				if( event.which == 38 )
				{
					event.preventDefault();
					newEvent = "FORWARD"
				}
				if( event.which == 39 )
				{
					event.preventDefault();
					newEvent = "RIGHT"
				}
				if( event.which == 40 )
				{
					event.preventDefault();
					newEvent = "BACKWARD"
				}
				if( event.which == 32 )
				{
					event.preventDefault();
					newEvent = "FIRE2"
				}
				if( event.which == 13 )
				{
					event.preventDefault();
					newEvent = "FIRE1"
				}
				if ("" != newEvent)
				{
					if (newEvent != gLastEvent)
					{
						$("#textField").html(newEvent);
						//console.log(newEvent)
						callServer(newEvent)
						gLastEvent = newEvent
					}
				}
			}
		);
		$( document ).keyup(
			function(event)
			{
				if ("STOP" != gLastEvent)
				{
					//console.log("STOP")
					callServer("STOP")
					gLastEvent = "STOP"
				}
			}
		);
	}
);


function callServer(data)
{
	gConn.send(data);
}
