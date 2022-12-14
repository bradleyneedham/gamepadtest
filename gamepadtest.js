/*
 * Gamepad API Test
 * Written in 2013 by Ted Mielczarek <ted@mielczarek.org>
 *
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var last_touch0_id = 0;
var last_touch1_id = 0;
var n = 0;
var controllers = {};

var touchpadWidth = 1920; //DS4
var touchpadHeight = 942; //DS4
var touchpadScale = 4;  // 4 is well sized and presentable
var drawSize = 5; //size of square(dot) drawn
var drawMode = false;
var touchpadToggle = true;
var lastTouchpadToggle = false;

var rAF = window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;

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
  for (var i=0; i<gamepad.buttons.length; i++) {
    var e = document.createElement("span");
    e.className = "button";
    //e.id = "b" + i;
    e.innerHTML = i;
    b.appendChild(e);
  }
  d.appendChild(b);
  var a = document.createElement("div");
  a.className = "axes";
  for (i=0; i<gamepad.axes.length; i++) {
    e = document.createElement("meter");
    e.className = "axis";
    //e.id = "a" + i;
    e.setAttribute("min", "-1");
    e.setAttribute("max", "1");
    e.setAttribute("value", "0");
    e.innerHTML = i;
    a.appendChild(e);
  }
  d.appendChild(a);
  document.getElementById("start").style.display = "none";
  document.body.appendChild(d);

  //create touchbar element based on size of reported touchbar
  var touchdiv = document.createElement("div");
  var touchCanvas = document.createElement("canvas");
  touchCanvas.id = "touchCanvas";
  touchdiv.className = "touchDiv";

  touchCanvas.setAttribute("width", (touchpadWidth /touchpadScale));
  touchCanvas.setAttribute("height", (touchpadHeight /touchpadScale));
  var tctx = touchCanvas.getContext("2d");
  tctx.fillStyle = 'rgba(0,0,0,1)';
  tctx.strokeRect(0,0,(touchpadWidth/touchpadScale),((touchpadHeight-2)/touchpadScale));

  touchdiv.appendChild(touchCanvas);
  d.appendChild(touchdiv);


  //create a square for RGB
  var rgbSquareDiv = document.createElement("div");
  var rgbSquare = document.createElement("canvas");
  var rgbValDiv = document.createElement("div");
  var rgbVal = document.createTextNode("R:" + drawColor.red + " G:" + drawColor.green + " B:" + drawColor.blue);
  rgbSquareDiv.id = "rgbsquarediv";
  rgbValDiv.id = "rgbvaldiv";
  rgbValDiv.appendChild(rgbVal);
  rgbSquare.id = "rgbSquare";
  rgbSquare.setAttribute("width", 100);
  rgbSquare.setAttribute("height", 50);

  var ctx = rgbSquare.getContext('2d');
  ctx.fillStyle = 'rgba('+drawColor.red + ',' + drawColor.green + ',' + drawColor.blue+', 1)';
  ctx.fillRect(0, 0, 100, 50);
  rgbSquareDiv.appendChild(rgbSquare);
  d.appendChild(rgbValDiv);
  d.appendChild(rgbSquareDiv);

  rAF(updateStatus);
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
  scangamepads();
  for (j in controllers) {
    var controller = controllers[j];
    var d = document.getElementById("controller" + j);
    var buttons = d.getElementsByClassName("button");
    for (var i=0; i<controller.buttons.length; i++) {
      var b = buttons[i];
      var val = controller.buttons[i];
      var pressed = val == 1.0;
      if (typeof(val) == "object") {
        pressed = val.pressed;
        val = val.value;
      }
      var pct = Math.round(val * 100) + "%";
      b.style.backgroundSize = pct + " " + pct;
      if (pressed) {
        handleButtonRGB(controller, i, val);
        b.className = "button pressed";
      } else {
        b.className = "button";
        if(i == 17) {//touchpad toggle
          lastTouchpadToggle = false;
        }
      }
    }
    
    if (controller.touchEvents) {
      if (controller.touchEvents.length > 0 && controller.touchEvents[0].surfaceDimensions) {
        touchpadWidth = controller.touchEvents[0].surfaceDimensions[0];
        touchpadHeight = controller.touchEvents[0].surfaceDimensions[1];
      }

      var c = document.getElementById('touchCanvas');
      ctx = c.getContext('2d');
      if(!drawMode) {
        ctx.clearRect(0,0,touchpadWidth/touchpadScale,touchpadHeight/touchpadScale);
        ctx.fillStyle = 'rgba(0,0,0,1)';
        ctx.strokeRect(0,0,(touchpadWidth/touchpadScale),((touchpadHeight-2)/touchpadScale));
      }

      for (var i = 0; i < controller.touchEvents.length; i++) {
        var touchEvent = controller.touchEvents[i];
        //normalize our touchpoints
        var touchX = Math.round((touchEvent.position[0] + 1) * (touchpadWidth / 2) );
        var touchY = Math.round((touchEvent.position[1] + 1) * (touchpadHeight / 2) );

        //draw the points
        ctx.fillStyle = 'rgba('+drawColor.red + ',' + drawColor.green + ',' + drawColor.blue+', 1)';
        ctx.fillRect(touchX/touchpadScale, touchY/touchpadScale, drawSize, drawSize);
      }
    }

    var axes = d.getElementsByClassName("axis");
    for (var i=0; i<controller.axes.length; i++) {
      var a = axes[i];
      a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
      a.setAttribute("value", controller.axes[i]);
    }
  }
  rAF(updateStatus);
}


var redVal = 0;
var blueVal = 0;
var greenVal = 0;
var drawColor = {red:redVal, green:greenVal, blue:blueVal};

function handleButtonRGB(controller, val, perc) {
  switch(val) {
  case 0: //x, blue
    blueVal++;
    if(blueVal > 255) {
      blueVal = 255;
    }
    break;
  case 1: //circle, red
    redVal++;
    if(redVal > 255) {
      redVal = 255;
    }
    break;
  case 2: //square, clear
    redVal = blueVal = greenVal = 0;
    break;
  case 3: //triangle, green
    greenVal++;
    if(greenVal > 255) {
      greenVal = 255;
    }
    break;
  case 6: //L trigger
    if (controller.vibrationActuator) {
      controller.vibrationActuator.playEffect("dual-rumble", {duration:100, startDelay:0, strongMagnitude:perc, weakMagnitude:0});
    }
    break;
  case 7: //R trigger
    if (controller.vibrationActuator) {
      controller.vibrationActuator.playEffect("dual-rumble", {duration:100, startDelay:0, strongMagnitude:0, weakMagnitude:perc});
    }
    break;
  case 9: //Options button to clear and redraw triangle
    var c = document.getElementById('touchCanvas');
    ctx = c.getContext('2d');
    ctx.clearRect(0,0,touchpadWidth/4,touchpadHeight/4);
    ctx.fillStyle = 'rgba(0,0,0,1)';
    ctx.strokeRect(0,0,(touchpadWidth/4),((touchpadHeight-2)/4));
    break;
  case 17: //touchpad
    //logic to change the rectangle to and from "draw" mode
        touchpadToggle = true;
        if(touchpadToggle == true && lastTouchpadToggle == false) {
          drawMode = !drawMode;
          lastTouchpadToggle = touchpadToggle;
          touchpadToggle = false;
        }
    break;
  default:
    break;
  }

  drawColor = {red:redVal, green:greenVal, blue:blueVal};

  var rgbSquare = document.getElementById('rgbSquare');
  var ctx = rgbSquare.getContext('2d');
  ctx.fillStyle = 'rgba('+drawColor.red + ',' + drawColor.green + ',' + drawColor.blue+', 1)';
  ctx.fillRect(0, 0, 100, 50);

  //set the text nodes
  var rgbVal = document.getElementById("rgbvaldiv")
  rgbVal.innerHTML = "R:" + drawColor.red + " G:" + drawColor.green + " B:" + drawColor.blue + "<p>" + "set light / touchpoint color  -- draw mode: " + drawMode + "</p>";
}

function scangamepads() {
  var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  for (var i = 0; i < gamepads.length; i++) {
    if (gamepads[i]) {
      if (!(gamepads[i].index in controllers)) {
        addgamepad(gamepads[i]);
      } else {
        controllers[gamepads[i].index] = gamepads[i];
      }
    }
  }
}

if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", connecthandler);
  window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
}
