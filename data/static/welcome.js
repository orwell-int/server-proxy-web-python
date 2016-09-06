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
			obj = JSON.parse(e.data);
			if ("status" in obj) {
				document.getElementById("status").innerHTML = obj.status;
			}
			if ("videofeed" in obj) {
				document.getElementById("videofeed").setAttribute("src", obj.videofeed);
			}
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

///////////////////////
// joystick handling //
///////////////////////

var haveEvents = 'ongamepadconnected' in window;
var controllers = {};

function connecthandler(e) {
	addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
	controllers[gamepad.index] = gamepad;

	var d = document.createElement("div");
	d.setAttribute("id", "controller" + gamepad.index);

	var t = document.createElement("h1");
	t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
	d.appendChild(t);

	var b = document.createElement("div");
	b.className = "buttons";

	console.log('add buttons ; number: ' + gamepad.buttons.length);
	for (var i = 0; i < gamepad.buttons.length; i++) {
		var e = document.createElement("span");
		e.className = "button";
		//e.id = "b" + i;
		e.innerHTML = i;
		b.appendChild(e);
	}

	d.appendChild(b);

	var a = document.createElement("div");
	a.className = "axes";

	for (var i = 0; i < gamepad.axes.length; i++) {
		var p = document.createElement("progress");
		p.className = "axis";
		//p.id = "a" + i;
		p.setAttribute("max", "2");
		p.setAttribute("value", "1");
		p.innerHTML = i;
		a.appendChild(p);
	}

	d.appendChild(a);

	// See https://github.com/luser/gamepadtest/blob/master/index.html
	var start = document.getElementById("start");
	if (start) {
		start.style.display = "none";
	}

	document.body.appendChild(d);
	requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
	removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
	var d = document.getElementById("controller" + gamepad.index);
	document.body.removeChild(d);
	delete controllers[gamepad.index];
}

function updateStatus() {
	if (!haveEvents) {
		scangamepads();
	}

	var i = 0;
	var j;

	for (j in controllers) {
		var controller = controllers[j];
		var d = document.getElementById("controller" + j);
		var buttons = d.getElementsByClassName("button");
		var newEvent = "";

		for (i = 0; i < controller.buttons.length; i++) {
			var b = buttons[i];
			var val = controller.buttons[i];
			var pressed = val == 1.0;
			if (typeof(val) == "object") {
				pressed = val.pressed;
				val = val.value;
			}
			if ("" != newEvent) {
				newEvent += ";";
			}
			var value = 0;
			if (pressed) {
				value = val;
			}
			newEvent += "b" + i + "=" + value;

			var pct = Math.round(val * 100) + "%";
			b.style.backgroundSize = pct + " " + pct;

			if (pressed) {
				b.className = "button pressed";
			} else {
				b.className = "button";
			}
		}

		var axes = d.getElementsByClassName("axis");
		for (i = 0; i < controller.axes.length; i++) {
			var a = axes[i];
			a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
			a.setAttribute("value", controller.axes[i] + 1);
			if ("" != newEvent) {
				newEvent += ";";
			}
			newEvent += "a" + i + "=" + controller.axes[i];
		}
		if ("" != newEvent)
		{
			newEvent = "joystick " + newEvent
			if (newEvent != gLastEvent)
			{
				$("#textField").html(newEvent);
				callServer(newEvent);
				gLastEvent = newEvent;
			}
		}
	}

	requestAnimationFrame(updateStatus);
}

function scangamepads() {
	var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
	for (var i = 0; i < gamepads.length; i++) {
		if (gamepads[i]) {
			if (gamepads[i].index in controllers) {
				controllers[gamepads[i].index] = gamepads[i];
			} else {
				addgamepad(gamepads[i]);
			}
		}
	}
}


window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
	console.log("We do not have events");
	setInterval(scangamepads, 100);
}
