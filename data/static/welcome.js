var gLastEvent = {}
gLastEvent["KEYBOARD"] = ""
var gConn = null;
var gFullScreen = false;
var gFlagColours = {}
var gTeam = "A"
var gLastSeconds = 0
gFlagColours["blue"] = "rgb(10, 81, 255)"
gFlagColours["green"] = "rgb(3, 232, 107)"
gFlagColours["yellow"] = "rgb(255, 251, 14)"
gFlagColours["purple"] = "rgb(224, 16, 232)"

var gFlagRadius = 30;
var gClockRadius = 45;
var gContourThickness = 15;
var gHorizontalSpace = 5;
var gContourColour = 'rgba(83, 87, 247, 0.5)';
var gContourColourNoAlpha = 'rgb(83, 87, 247)';
var gContourMaxHeight_x2 = 2 * (gClockRadius + gContourThickness);
var gContourMinHeight = (gFlagRadius + gContourThickness);
var gFlagWidth = 2 * (gFlagRadius + gHorizontalSpace);
var gClockThickness = 10;
var gContourClockAngle;
var gBatteryCanvasWidth = 200;
var gBatteryCanvasHeight = 270;
var gBatteryColourH = 136;
var gBatteryColourS = 83;
var gBatteryColourL = 58;
var gBatteryColour = getHSL(gBatteryColourH, gBatteryColourS, gBatteryColourL);
var gBatteryColourBadH = 0;
var gTrackColour = 'rgb(30, 30, 30)';
var gTankColour = 'rgb(70, 70, 70)';
var gLCDColour = 'rgb(120, 120, 120)';
var gCameraColour = 'rgb(0, 0, 0)';

var gRadarColourH = gBatteryColourH;
var gRadarColourS = gBatteryColourS;
var gRadarColourL = gBatteryColourL;
var gRadarColourBadH = gBatteryColourBadH

String.prototype.replaceAll = function(search, replacement) {
	var target = this;
	return target.replace(new RegExp(search, 'g'), replacement);
};

$( document ).ready(
	function()
	{
		console.log("document / ready");
		draw_flag_canvas_team();
		draw_battery();
		console.log("Pi / 4 = " + (Math.PI / 4));
		var arcsin = gContourMinHeight / (gClockRadius + gContourThickness);
		console.log("arcsin = " + arcsin);
		gContourClockAngle = Math.asin(arcsin);
		console.log("gContourClockAngle = " + gContourClockAngle);
		console.log("open SockJS connection")
		gConn = new SockJS('//' + window.location.host + '/orwell');
		console.log("gConn = " + gConn)
		document.getElementById("team").innerHTML += " " + gTeam;
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
						var html_flag = "<div width=\"%FLAG_WIDTH%\"><div id=\"%ID%_inner\" style=\"position:relative;top:50%\"><div id=\"%ID%_text_border\" class=\"centered flag_name z2 border\"></div><div id=\"%ID%_text\" class=\"centered flag_name z3\"></div></div><canvas id=\"%ID%_circle\" height=\"%MAX_HEIGHT%\" width=\"%FLAG_WIDTH%\"></canvas></div>".replaceAll("%ID%", flag_id).replace("%COLOUR%", colour).replace("%MAX_HEIGHT%", "" + gContourMaxHeight_x2).replaceAll("%FLAG_WIDTH%", gFlagWidth);
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
					if (is_last) {
						var flag_inner = document.getElementById(flag_id + "_inner");
						var new_style = flag_inner.getAttribute('style') + ";left:" + ((gHorizontalSpace - gContourThickness) / 2);
						console.log("set " + flag_inner.id + " to style = " + new_style);
						flag_inner.setAttribute('style', new_style);
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
					var flag_text_id = flag_id + "_text";
					var flag_text = document.getElementById(flag_text_id);
					if (null == flag_text) {
						console.log("Error for item number " + i + " with id '" + flag_text_id + "'.");
					} else {
						var circle = document.getElementById(flag_id + "_inner");
						var flag_text_border = document.getElementById(flag_id + "_text_border");
						flag_text.innerHTML = item.owner;
						flag_text_border.innerHTML = item.owner;
						if ("started" == item.capture) {
							console.log("blink: " + flag_text_id + " ; owner: '" + item.owner + "'");
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
			if ("winner" in obj) {
				if (obj.winner == gTeam) {
					document.getElementById("end_game").innerHTML = "Victory (" + gLastSeconds + "s)";
				} else if (obj.winner == "-") {
					document.getElementById("end_game").innerHTML = "Draw";
				} else if (obj.winner == "") {
					document.getElementById("end_game").innerHTML = "";
				} else {
					document.getElementById("end_game").innerHTML = "Defeat";
				}
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
			var running = true;
			if ("running" in obj) {
				running = obj.running;
			}
			if (running) {
				if ("seconds" in obj && "total_seconds" in obj) {
					var seconds = obj.seconds;
					var total_seconds = obj.total_seconds;
					drawPie(total_seconds, seconds);
					gLastSeconds = total_seconds - seconds;
				}
			} else {
				drawPie(1, 0);
			}
		};
		gConn.onclose = function() {
			console.log('Disconnected.');
			gConn = null;
		};
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
	gLastEvent[gamepad.index] = ""
	callServer("new_joystick" + gamepad.index + " " + gamepad.id)

	// See https://github.com/luser/gamepadtest/blob/master/index.html
	var start = document.getElementById("start");
	if (start) {
		start.style.display = "none";
	}

	requestAnimationFrame(updateStatus);
}

function disconnecthandler(e) {
	removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
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
		var newEvent = "";

		for (i = 0; i < controller.buttons.length; i++) {
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
		}

		for (i = 0; i < controller.axes.length; i++) {
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
				//console.log(newEvent);
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
	canvas.width = gContourMaxHeight_x2;
	canvas.height = gContourMaxHeight_x2;
	var ctx = canvas.getContext("2d");
	var lastend = 0;
	var data = [total - done, done];
	var myColor = ['grey', 'lightblue'];
	var width = canvas.width / 2;
	var height = canvas.height / 2;
	var offset = Math.PI / 2;

	ctx.beginPath();
	ctx.fillStyle = gContourColour;
	ctx.moveTo(canvas.width, height + gContourMinHeight);
	ctx.arc(
		width,
		height,
		width,
		gContourClockAngle,
		Math.PI * 2 - gContourClockAngle,
		false);
	ctx.lineTo(canvas.width, height - gContourMinHeight);
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

function draw_flag_canvas_team() {
	var canvas = document.getElementById("canvas_team");
	var team_rect = document.getElementById("team").getBoundingClientRect();
	console.log("team_rect = " + team_rect);
	var offset = 10;
	var height = team_rect.height + offset * 2;
	var width = team_rect.width + 20 + offset * 2;
	var top_left = document.getElementById("top_left_inner");
	// this is horrible
	top_left.setAttribute(
		"style",
		top_left.getAttribute("style") + ";height:" + height + ";width:" + width);
	console.log("new height = " + height);
	console.log("new width = " + width);
	canvas.height = height;
	canvas.width = width;
	height -= offset * 2;
	width -= offset * 2;
	var context = canvas.getContext("2d");
	context.fillStyle = gContourColour;
	context.strokeStyle = gContourColour;
	context.lineJoin = "round";
	context.lineWidth = offset * 2;
	context.beginPath();
	context.strokeRect(offset, offset, width, height);
	context.fillRect(offset + offset, offset + offset, width - 2 * offset, height - 2 * offset);
}

function getHSL(hue, saturation, lightness) {
	return "hsl(" + hue + ", " + saturation + "%, " + lightness + "%)";
}

function getHSLA(hue, saturation, lightness, alpha) {
	return "hsla(" + hue + ", " + saturation + "%, " + lightness + "%, " + alpha + ")";
}

function draw_dual_track_rects(
	context,
	left_track_x,
	right_track_x,
	track_y,
	track_width,
	track_height) {
	context.fillRect(
		left_track_x,
		track_y,
		track_width,
		track_height);
	context.fillRect(
		right_track_x,
		track_y,
		track_width,
		track_height);
}

function draw_dual_track_rects_mirror(
	context,
	left_track_x,
	right_track_x,
	track_y,
	track_width,
	track_height,
	mirror_y) {
	context.fillRect(
		left_track_x,
		track_y,
		track_width,
		track_height);
	context.fillRect(
		right_track_x,
		track_y,
		track_width,
		track_height);
	var track_center_y = track_y + track_height / 2;
	var delta = mirror_y - track_center_y;
	var mirrored_track_center_y = mirror_y + delta;
	var mirrored_track_y = mirrored_track_center_y - track_height / 2;
	context.fillRect(
		left_track_x,
		mirrored_track_y,
		track_width,
		track_height);
	context.fillRect(
		right_track_x,
		mirrored_track_y,
		track_width,
		track_height);
}

function draw_battery() {
	var battery_percentage = 100;
	var radar_percentage = 100;
	var canvas = document.getElementById("canvas_battery");
	var context = canvas.getContext("2d");
	var offset = 10;
	var x_center = gBatteryCanvasWidth / 2;
	canvas.setAttribute("width", gBatteryCanvasWidth)
	canvas.setAttribute("height", gBatteryCanvasHeight)
	var width = gBatteryCanvasWidth - offset * 2;
	var height = gBatteryCanvasHeight - offset * 2;
	context.fillStyle = gContourColourNoAlpha;
	context.strokeStyle = gContourColourNoAlpha;
	context.lineJoin = "round";
	context.lineWidth = offset * 2;
	context.beginPath();
	context.strokeRect(offset, offset, width, height);
	context.fillRect(offset + offset, offset + offset, width - 2 * offset, height - 2 * offset);
	context.fillStyle = gBatteryColour;
	context.strokeStyle = gBatteryColour;
	var line_width = 2;
	context.lineWidth = line_width;
	var rectangle_y = offset * 2;
	var rectangle_width = 50;
	var rectangle_x = (gBatteryCanvasWidth - rectangle_width) / 2;
	var rectangle_height = 20;
	var rectangle_head_width = 5;
	var rectangle_head_height = 10;
	var rectangle_head_offset = (rectangle_height - rectangle_head_height) / 2;
	var inner_rectangle_x = rectangle_x + line_width / 2;
	var inner_rectangle_y = rectangle_y + line_width / 2;
	var inner_rectangle_width = rectangle_width - line_width;
	var inner_rectangle_height = rectangle_height - line_width;
	context.strokeRect(rectangle_x, rectangle_y, rectangle_width, rectangle_height);
	context.fillRect(
		rectangle_x + rectangle_width + line_width / 2,
		rectangle_y + rectangle_head_offset,
		rectangle_head_width,
		rectangle_head_height);
	context.lineJoin = "miter";
	var battery_ratio = battery_percentage / 100;
	var proportional_inner_width = inner_rectangle_width * battery_ratio;
	var hue_length = gBatteryColourH - gBatteryColourBadH;
	var hue = gBatteryColourH - hue_length * (1 - battery_ratio);

	var proportional_colour = getHSL(hue, gBatteryColourS, gBatteryColourL);
	context.fillStyle = proportional_colour;
	context.strokeStyle = proportional_colour;
	context.fillRect(
		inner_rectangle_x,
		inner_rectangle_y,
		proportional_inner_width,
		inner_rectangle_height);

	context.fillStyle = gTrackColour;
	context.strokeStyle = gTrackColour;
	context.lineWidth = 1;

	var half_tank_width = 22;
	var tank_width = half_tank_width * 2;
	var half_tank_height = 33;
	var tank_height = half_tank_height * 2;
	var tank_space = 4;
	var track_y = rectangle_y + rectangle_height + offset * 2;
	var track_width = 28;
	var track_height = 110;
	var half_track_height = track_height / 2;
	var tank_mid_y = track_y + half_track_height;
	var left_track_x = x_center - half_tank_width - tank_space - track_width;
	var right_track_x = x_center + half_tank_width + tank_space;
	//context.fillRect(left_track_x, track_y, track_width, track_height);
	var track_step = 2;
	var track_space = 1;
	var wheel_track_count = 4;
	var current_track_y = track_y;
	var current_track_height = track_step;
	for (var i = 0 ; i < wheel_track_count ; i++) {
		current_track_y += current_track_height + track_space;
		current_track_height += track_step;
	}
	var max_track_height = current_track_height - track_step;
	var half_max_track_height = max_track_height / 2;
	var wheel_track_height = current_track_y - track_y;
	var half_real_track_height = 0;
	var straight_track_count = 0;
	while (half_real_track_height < half_track_height) {
		straight_track_count += 1;
		var straight_track_height = straight_track_count * (max_track_height + track_space);
		half_real_track_height = wheel_track_height + half_max_track_height + straight_track_height;
	}
	straight_track_height -= 1;
	// middle track
	var current_track_y = tank_mid_y - half_max_track_height;
	draw_dual_track_rects(
		context,
		left_track_x,
		right_track_x,
		current_track_y,
		track_width,
		max_track_height);
	// top / bottom tracks
	for (var i = 0 ; i < straight_track_count ; i++) {
		current_track_y += max_track_height + track_space;
		draw_dual_track_rects_mirror(
			context,
			left_track_x,
			right_track_x,
			current_track_y,
			track_width,
			max_track_height,
			tank_mid_y);
	}
	// top / bottom wheel tracks
	current_track_y += wheel_track_height;
	current_track_y += max_track_height + track_space;
	current_track_height = track_step;
	for (var i = 0 ; i < wheel_track_count ; i++) {
		current_track_y -= current_track_height + track_space;
		draw_dual_track_rects_mirror(
			context,
			left_track_x,
			right_track_x,
			current_track_y,
			track_width,
			current_track_height,
			tank_mid_y);
		current_track_height += track_step;
	}
	context.strokeStyle = gTankColour;
	context.fillStyle = gTankColour;
	var tank_top = tank_mid_y - half_tank_height;
	context.fillRect(
		x_center - half_tank_width,
		tank_top,
		tank_width,
		tank_height);

	context.strokeStyle = gLCDColour;
	context.fillStyle = gLCDColour;
	var lcd_space = 5;
	var lcd_top = tank_top + lcd_space;
	var lcd_height = 24;
	context.fillRect(
		x_center - half_tank_width + lcd_space,
		lcd_top,
		tank_width - 2 * lcd_space,
		lcd_height);

	context.strokeStyle = gCameraColour;
	context.fillStyle = gCameraColour;
	var half_camera_width = 6;
	var camera_width = half_camera_width * 2;
	var camera_height = camera_width;
	var camera_bottom = tank_top - tank_space + 2;
	var camera_mid = camera_bottom - camera_height;
	var camera_top = camera_mid - camera_height / 2;
	var camera_left = x_center - half_camera_width;
	var camera_right = x_center + half_camera_width;
	context.moveTo(
		camera_left,
		camera_bottom);
	context.lineTo(
		camera_left,
		camera_mid);
	context.lineTo(
		x_center - half_camera_width / 2,
		camera_mid);
	context.lineTo(
		camera_left,
		camera_top);
	context.lineTo(
		camera_right,
		camera_top);
	context.lineTo(
		x_center + half_camera_width / 2,
		camera_mid);
	context.lineTo(
		camera_right,
		camera_mid);
	context.lineTo(
		camera_right,
		camera_bottom);
	context.fill();
	var radar_x = x_center;
	var radar_y = tank_top + tank_height;
	var transparent_radar = 12;
	var radar_ratio = radar_percentage / 100;
	var visible_radar = transparent_radar + 2 + 62 * radar_ratio;
	hue_length = gRadarColourH - gRadarColourBadH;
	hue = gRadarColourH - hue_length * (1 - radar_ratio);

	proportional_colour = getHSL(hue, gRadarColourS, gRadarColourL);
	context.beginPath();
	context.fillStyle = proportional_colour;
	context.strokeStyle = proportional_colour;
	var visible_radius = Math.sqrt(2 * visible_radar * visible_radar)
	context.arc(
		radar_x,
		radar_y,
		visible_radius,
		Math.PI / 2 - Math.PI / 8,
		Math.PI / 2 + Math.PI / 8);
	var transparent_radius = Math.sqrt(2 * transparent_radar * transparent_radar)
	context.arc(
		radar_x,
		radar_y,
		transparent_radius,
		Math.PI / 2 + Math.PI / 8,
		Math.PI / 2 - Math.PI / 8,
		true);
	context.fill();
}

window.addEventListener("gamepadconnected", connecthandler);
window.addEventListener("gamepaddisconnected", disconnecthandler);

if (!haveEvents) {
	console.log("We do not have events");
	setInterval(scangamepads, 100);
}
