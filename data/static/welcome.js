var gLastEvent = {}
gLastEvent["KEYBOARD"] = ""
var gConn = null;
var gFullScreen = false;
var gFlagColours = {}
gFlagColours["blue"] = "blue"
gFlagColours["green"] = "green"
gFlagColours["yellow"] = "yellow"
gFlagColours["purple"] = "purple"

var gFlagRadius = 30;
var gClockRadius = 45;
var gContourThickness = 15;
var gHorizontalSpace = 5;
var gContourColour = 'orange';
var gContourMaxHeight = 2 * (gClockRadius + gContourThickness);
var gContourMinHeight = 2 * (gFlagRadius + gContourThickness);
var gFlagWidth = 2 * (gFlagRadius + gHorizontalSpace);
var gClockThickness = 10;

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
					//var is_last = (i + 1 == obj.new_items.length)
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
						var html_flag = "<canvas id=\"%ID%_circle\" height=\"%MAX_HEIGHT%\" width=\"%FLAG_WIDTH%\" ><div><div id=\"%ID%_border\" class=\"centered flag_name border\"></div><div id=\"%ID%\" class=\"centered flag_name\"></div></canvas></div>".replaceAll("%ID%", flag_id).replace("%COLOUR%", colour).replace("%MAX_HEIGHT%", "" + gContourMaxHeight).replace("%FLAG_WIDTH%", gFlagWidth);
						//var html_flag = "<div id=\"%ID%_circle\" class=\"%COLOUR% circle horizontal\"><div><div id=\"%ID%_border\" class=\"centered flag_name border\"></div><div id=\"%ID%\" class=\"centered flag_name\"></div></div></div>".replaceAll("%ID%", flag_id).replace("%COLOUR%", colour);
						console.log("html_flag = " + html_flag);
						flags.innerHTML += html_flag;
					}
				}
				for (var i = 0 ; i < obj.new_items.length ; i++) {
					var is_last = (i + 1 == obj.new_items.length);
					name = obj.new_items[i];
					identifier = "item " + name;
					var flag_id = "flag_" + name;
					var colour = gFlagColours[name];
					draw_flag(flag_id + "_circle", colour, is_last);
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
	canvas.width = gContourMaxHeight;
	canvas.height = gContourMaxHeight;
	var ctx = canvas.getContext("2d");
	var lastend = 0;
	var data = [total - done, done];
	var myColor = ['grey', 'lightblue'];
	var width = canvas.width / 2;
	var height = canvas.height / 2;
	var offset = Math.PI / 2;

	ctx.beginPath();
	ctx.fillStyle = 'red';
	//console.log("ctx.moveTo(", canvas.width, height + gContourMinHeight / 2, ")");
	ctx.moveTo(canvas.width, height + gContourMinHeight / 2);
	ctx.arc(
		width,
		height,
		width,
		Math.PI / 4,
		Math.PI * 2 - Math.PI / 4,
		false);
	ctx.lineTo(canvas.width, height - gContourMinHeight / 2);
	//console.log("ctx.lineTo(", canvas.width, height - gContourMinHeight / 2, ")");
	ctx.fill();

	var inner_radius = width - gContourThickness;
	for (var i = 0 ; i < data.length ; i++) {
		var currentSlice = Math.PI * 2 * (data[i] / total);
		ctx.fillStyle = myColor[i];
		ctx.beginPath();
		ctx.moveTo(width, height);
		// rotate by - pi / 2 because the zero is at 3 o'clock (and we want 0 o'clock)
		ctx.arc(
			width,
			height,
			inner_radius,
			lastend - offset,
			lastend + currentSlice - offset,
			false);
		ctx.lineTo(width, height);
		ctx.fill();
		lastend += currentSlice;
	}

	ctx.beginPath();
	ctx.fillStyle = '#D3D3D3';
	ctx.arc(
		width,
		height,
		inner_radius - gClockThickness,
		0,
		Math.PI * 2,
		false);
	ctx.fill();

	var minutes = Math.floor(done / 60);
	var seconds = done - minutes * 60;
	var str_time = "";
	if (minutes > 9) {
		str_time += " ";
	} else {
		str_time += "0";
	}
	str_time += minutes + ":";
	if (seconds < 10) {
		str_time += "0";
	} 
	str_time += seconds;

	ctx.font = '150% Lucida Console';
	ctx.textAlign = 'center';
	ctx.textBaseline = "middle";
	ctx.fillStyle = 'black';
	ctx.fillText(str_time, width, height);
}

function draw_flag(name, colour, is_last) {
	var canvas = document.getElementById(name);
	if (is_last) {
		canvas.width = Math.max(gFlagWidth, gContourThickness + gHorizontalSpace + 2 * gFlagRadius);
	}
	var radius = gFlagRadius;
	var margin = gHorizontalSpace;
	var thickness = gContourThickness;
	var vertical_offset = gClockRadius - gFlagRadius;
	//console.log('draw_flag:', name, radius, margin, vertical_offset, colour, is_last);
	var context = canvas.getContext("2d");
	var y_center = radius + thickness;
	var x_center = radius + margin;
	var rectangle_width = canvas.width;
	var rectangle_height = 2 * (radius + thickness);
	context.fillStyle = gContourColour;
	if (is_last) {
		context.beginPath();
		context.rect(0, vertical_offset, x_center, rectangle_height);
		context.fill();
		context.beginPath();
		context.arc(x_center, y_center + vertical_offset, radius + thickness, -Math.PI / 2, Math.PI / 2, false);
		context.fill();
	} else {
		context.beginPath();
		context.rect(0, vertical_offset, rectangle_width, rectangle_height);
		context.fill();
	}
	context.beginPath();
	context.arc(x_center, y_center + vertical_offset, radius, 0, 2 * Math.PI, false);
	context.fillStyle = colour;
	context.fill();
	//console.log('done ! draw_flag:', name, radius, margin, vertical_offset, colour, is_last);
}

window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
	console.log("We do not have events");
	setInterval(scangamepads, 100);
}
