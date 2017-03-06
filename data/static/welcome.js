var gLastEvent = {}
gLastEvent["KEYBOARD"] = ""
var gConn = null;
var gFullScreen = false;
var gFlagColours = {}
gFlagColours["blue"] = "blue"
gFlagColours["green"] = "green"
gFlagColours["yellow"] = "yellow"
gFlagColours["purple"] = "purple"

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

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
			obj = JSON.parse(e.data);
			if ("new_items" in obj) {
				console.log('Received: ' + e.data);
				var list = document.getElementById("items");
				var flags = document.getElementById("flags");
				for (var i = 0; i < obj.new_items.length; i++) {
					name = obj.new_items[i];
					identifier = "item " + name;
					if (null == document.getElementById(identifier) ) {
						console.log('add item with name "' + name + '"');
						var entry = document.createElement('li');
						entry.appendChild(document.createTextNode(name));
						entry.id = identifier;
						list.appendChild(entry);
					}
					var flag_id = "flag_" + name;
					var flag = document.getElementById(flag_id);
					if (null == flag) {
						var colour = gFlagColours[name];
						var html_flag = "<div id=\"%ID%_circle\" class=\"%COLOUR% circle horizontal\"><div><div id=\"%ID%_border\" class=\"centered flag_name border\"></div><div id=\"%ID%\" class=\"centered flag_name\"></div></div></div>".replaceAll("%ID%", flag_id).replace("%COLOUR%", colour);
						console.log("html_flag = " + html_flag);
						flags.innerHTML += html_flag;
					}
				}
			}
			if ("items" in obj) {
				var list = document.getElementById("items");
				for (var i = 0; i < obj.items.length; i++) {
					item = obj.items[i];
					identifier = "item " + item.name;
					node_item = document.getElementById(identifier);
					if (null == node_item) {
						console.log("Error for item number " + i + " with id '" + identifier + "'.");
					} else {
						node_item.innerHTML = item.status
					}
					var flag_id = "flag_" + item.name;
					var flag = document.getElementById(flag_id);
					if (null == flag) {
						console.log("Error for item number " + i + " with id '" + flag_id + "'.");
					} else {
						var circle = document.getElementById(flag_id + "_circle");
						var flag_border = document.getElementById(flag_id + "_border");
						flag.innerHTML = item.owner;
						flag_border.innerHTML = item.owner;
						if ("started" == item.capture) {
							setBlinkOn(circle);
						} else {
							setBlinkOff(circle);
						}
					}
				}
			}
			if ("capture_status" in obj) {
				document.getElementById("capture_status").innerHTML = obj.capture_status;
			}
			if ("status" in obj) {
				document.getElementById("status").innerHTML = obj.status;
			}
			if ("videofeed" in obj) {
				document.getElementById("videofeed").setAttribute("src", obj.videofeed);
			}
			if ("start_button" in obj) {
				var start_button = document.getElementById("start_button");
				start_button.innerHTML = obj.start_button;
				if ("Restart" == obj.start_button) {
					var height = start_button.getBoundingClientRect().height
					var videofeed_height = document.getElementById("videofeed").getBoundingClientRect().height
					start_button.style.top = videofeed_height - (5 + height / 2);
				} else {
					start_button.style.top = '50%';
				}
			}
			if ("seconds" in obj && "total_seconds" in obj) {
				var seconds = obj.seconds;
				var total_seconds = obj.total_seconds;
				drawPie(total_seconds, seconds);
			} else {
				drawPie(1, 0);
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
					if (newEvent != gLastEvent["KEYBOARD"])
					{
						$("#textField").html(newEvent);
						//console.log(newEvent)
						callServer(newEvent)
						gLastEvent["KEYBOARD"] = newEvent
					}
				}
			}
		);
		$( document ).keyup(
			function(event)
			{
				if ("STOP" != gLastEvent["KEYBOARD"])
				{
					//console.log("STOP")
					callServer("STOP")
					gLastEvent["KEYBOARD"] = "STOP"
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

	gLastEvent[gamepad.index] = ""
	callServer("new_joystick" + gamepad.index + " " + gamepad.id)

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
			newEvent = "joystick" + j + " " + newEvent
			if (newEvent != gLastEvent[j])
			{
				$("#textField").html(newEvent);
				callServer(newEvent);
				gLastEvent[j] = newEvent;
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

function start() {
	callServer("START")
}

function fullscreen() {
	if (screenfull.enabled) {
		if (gFullScreen) {
			screenfull.exit();
			$('#tittle').fadeIn('fast');
		} else {
			screenfull.request();
			$('#tittle').fadeOut('fast');
		}
		gFullScreen = !gFullScreen;
	}
}

function switchBlink(element) {
	var class_str = element.className;
	if (class_str.indexOf("blink") != -1) {
		element.className = class_str.replace("blink", "").replace("  ", " ");
	} else {
		element.className = class_str + " blink";
	}
}

function setBlinkOn(element) {
	var class_str = element.className;
	if (class_str.indexOf("blink") != -1) {
		// nothing to do
	} else {
		element.className = class_str + " blink";
	}
}

function setBlinkOff(element) {
	var class_str = element.className;
	if (class_str.indexOf("blink") != -1) {
		element.className = class_str.replace("blink", "").replace("  ", " ");
	} else {
		// nothing to do
	}
}

function drawPie(total, done) {
	var canvas = document.getElementById("pie");
	var ctx = canvas.getContext("2d");
	var lastend = 0;
	var data = [total - done, done];
	var myColor = ['grey', 'lightblue'];

	for (var i = 0; i < data.length; i++) {
		ctx.fillStyle = myColor[i];
		ctx.beginPath();
		ctx.moveTo(canvas.width/2,canvas.height/2);
		ctx.arc(canvas.width/2,canvas.height/2,canvas.height/2,lastend-Math.PI/2,lastend+(Math.PI*2*(data[i]/total))-Math.PI/2,false);
		ctx.lineTo(canvas.width/2,canvas.height/2);
		ctx.fill();
		lastend += Math.PI*2*(data[i]/total);
	}
}

window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
	console.log("We do not have events");
	setInterval(scangamepads, 100);
}
