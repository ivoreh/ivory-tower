"use strict";
async function main() {
	var canvas = document.createElement("canvas");
	canvas.width = window.innerWidth / 2;
	canvas.height = window.innerHeight / 2;
	document.documentElement.appendChild(canvas);
	canvas.style.cssText = "z-index:-1;position:fixed;top:0;width:100%";
	var gl = canvas.getContext("webgl", { antialias: false });
	if (!gl) {
		return;
	}
	var vertexShader = createShader(gl, gl.VERTEX_SHADER, `
attribute vec4 a_position;
attribute vec2 a_texcoord;

uniform mat4 u_matrix;

varying vec2 v_texcoord;

void main() {
	gl_Position = u_matrix * a_position;

	v_texcoord = a_texcoord;
}
	`);
	var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, `
precision highp float;

varying vec2 v_texcoord;

uniform sampler2D u_texture;

void main() {
	gl_FragColor = texture2D(u_texture, v_texcoord);
}
	`);
	var program = createProgram(gl, vertexShader, fragmentShader);

	var positionLocation = gl.getAttribLocation(program, "a_position");
	var texcoordLocation = gl.getAttribLocation(program, "a_texcoord");
	var matrixLocation = gl.getUniformLocation(program, "u_matrix");
	
	const response = await fetch("ass/muma.obj");
	const text = await response.text();

	var lines = text.split('\n');

	let vert_count = 0, tri_count = 0;
	for (let i = 0; i < lines.length; i++) {
		var rows = lines[i].split(' ');
		if (rows[0] == "v") {
			vert_count++;
		} else if (rows[0] == "f") {
			tri_count++;
		}
	}
	var vertices = new Float32Array(vert_count * 3),
	uvs = new Float32Array(vert_count * 2),
	positions = new Float32Array(tri_count * 9),
	texcoords = new Float32Array(tri_count * 6);

	let v = 0, u = 0, p = 0, t = 0;
	for (let i = 0; i < lines.length; i++) {
		var rows = lines[i].split(' ');
		switch (rows[0]) {
			case "v":
				for (let j = 1; j <= 3; j++) {
					vertices[v] = rows[j];
					v++;
				}
				break;
			case "vt":
				for (let j = 1; j <= 2; j++) {
					uvs[u] = rows[j];
					u++;
				}
				break;
			case "f":
				for (let j = 1; j <= 3; j++) {
					let pair = rows[j].split('/');
					for (let k = 0; k <= 2; k++) {
						positions[p] = vertices[(pair[0] - 1) * 3 + k];
						p++;
					}
					texcoords[t] = uvs[(pair[1] - 1) * 2];
					texcoords[t + 1] = 1 - uvs[(pair[1] - 1) * 2 + 1];
					t += 2;
				}
				break;
			// default:
				// console.log(`didn't handle case "${rows[0]}"`);
		}
	}

	var positionBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

	var texcoordBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, texcoords, gl.STATIC_DRAW);

	var texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0]));

	var image = new Image();
	image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAMAAADz0U65AAAAAXNSR0IArs4c6QAAABtQTFRFAAAAPoZgK3FcH1hl6fvNhiQ0XRczUSEfRQEKN2/HOAAAACdJREFUCJljYGdn5+BgYGBgwGSwsLCwsrKxsSEYjIyMTEzMzMyYDAAnwADwtNEu7AAAAABJRU5ErkJggg==";
	image.addEventListener('load', function() {
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		gl.generateMipmap(gl.TEXTURE_2D);
	});

	gl.bindTexture(gl.TEXTURE_2D, texture);

	gl.clearColor(0, 0, 0, 1);
	gl.enable(gl.DEPTH_TEST);
	gl.enable(gl.CULL_FACE);

	var then = 0;

	let scroll = getScroll();
	let lastScroll = scroll;

	requestAnimationFrame(draw);
	
	function draw(now) {
		now /= 1000;
		var delta = now - then;
		then = now;

		gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
		gl.useProgram(program);

		gl.enableVertexAttribArray(positionLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
		gl.vertexAttribPointer(
			positionLocation,
			3,        // size = 3d
			gl.FLOAT, // expect floats
			false,    // don't normalize
			0,        // move size * sizeof gl.FLOAT to the next position
			0         // beginning of buffer
		);

		gl.enableVertexAttribArray(texcoordLocation);
		gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
		gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

		var matrix = m4.perspective(
			Math.PI / 2, // fov
			gl.canvas.clientWidth / gl.canvas.clientHeight,
			0.1,   // near
			1000 // far
		);
		scroll = lerp(lastScroll, getScroll(), 0.5 * delta);
		lastScroll = scroll;

		matrix = m4.translate(matrix, 0, -scroll * 0.9 - 0.5, scroll * 1.2 - 2);
		matrix = m4.xRotate(matrix, Math.PI / 16 * scroll);
		matrix = m4.yRotate(matrix, Date.now() / 32000);
		matrix = m4.zRotate(matrix, 0);

		gl.uniformMatrix4fv(matrixLocation, false, matrix);
		gl.drawArrays(gl.TRIANGLES, 0, tri_count * 3);
		requestAnimationFrame(draw);
	}
}

function createShader(gl, type, source) {
	var shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
	if (success) {
		return shader;
	}
	console.log(gl.getShaderInfoLog(shader));
	gl.deleteShader(shader);
}

function createProgram(gl, vertexShader, fragmentShader) {
	var program = gl.createProgram();
	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);
	gl.linkProgram(program);
	var success = gl.getProgramParameter(program, gl.LINK_STATUS);
	if (success) {
		return program;
	}
	console.log(gl.getProgramInfoLog(program));
	gl.deleteProgram(program);
}

var m4 = {
	translation: function(tx, ty, tz) {
		return [
			1,  0,  0,  0,
			0,  1,  0,  0,
			0,  0,  1,  0,
			tx, ty, tz, 1,
		];
	},
	xRotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);
		return [
		1, 0, 0, 0,
		0, c, s, 0,
		0, -s, c, 0,
		0, 0, 0, 1,
		];
	},
	yRotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);
		return [
		c, 0, -s, 0,
		0, 1, 0, 0,
		s, 0, c, 0,
		0, 0, 0, 1,
		];
	},
	zRotation: function(angleInRadians) {
		var c = Math.cos(angleInRadians);
		var s = Math.sin(angleInRadians);
		return [
		c, s, 0, 0,
		-s, c, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
		];
	},
	scaling: function(sx, sy, sz) {
		return [
		sx, 0,  0,  0,
		0, sy,  0,  0,
		0,  0, sz,  0,
		0,  0,  0,  1,
		];
	},
	translate: function(m, tx, ty, tz) {
		return m4.multiply(m, m4.translation(tx, ty, tz));
	},
 	
	xRotate: function(m, angleInRadians) {
		return m4.multiply(m, m4.xRotation(angleInRadians));
	},

	yRotate: function(m, angleInRadians) {
		return m4.multiply(m, m4.yRotation(angleInRadians));
	},
 
	zRotate: function(m, angleInRadians) {
		return m4.multiply(m, m4.zRotation(angleInRadians));
	},

	scale: function(m, sx, sy, sz) {
		return m4.multiply(m, m4.scaling(sx, sy, sz));
	},
	multiply: function(a, b) {
		var b00 = b[0 * 4 + 0];
		var b01 = b[0 * 4 + 1];
		var b02 = b[0 * 4 + 2];
		var b03 = b[0 * 4 + 3];
		var b10 = b[1 * 4 + 0];
		var b11 = b[1 * 4 + 1];
		var b12 = b[1 * 4 + 2];
		var b13 = b[1 * 4 + 3];
		var b20 = b[2 * 4 + 0];
		var b21 = b[2 * 4 + 1];
		var b22 = b[2 * 4 + 2];
		var b23 = b[2 * 4 + 3];
		var b30 = b[3 * 4 + 0];
		var b31 = b[3 * 4 + 1];
		var b32 = b[3 * 4 + 2];
		var b33 = b[3 * 4 + 3];
		var a00 = a[0 * 4 + 0];
		var a01 = a[0 * 4 + 1];
		var a02 = a[0 * 4 + 2];
		var a03 = a[0 * 4 + 3];
		var a10 = a[1 * 4 + 0];
		var a11 = a[1 * 4 + 1];
		var a12 = a[1 * 4 + 2];
		var a13 = a[1 * 4 + 3];
		var a20 = a[2 * 4 + 0];
		var a21 = a[2 * 4 + 1];
		var a22 = a[2 * 4 + 2];
		var a23 = a[2 * 4 + 3];
		var a30 = a[3 * 4 + 0];
		var a31 = a[3 * 4 + 1];
		var a32 = a[3 * 4 + 2];
		var a33 = a[3 * 4 + 3];

		return [
			b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
			b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
			b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
			b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
			b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
			b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
			b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
			b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
			b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
			b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
			b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
			b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
			b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
			b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
			b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
			b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
		];
	},
	projection: function(width, height, depth) {
	// Note: This matrix flips the Y axis so 0 is at the top.
		return [
			2 / width, 0, 0, 0,
			0, -2 / height, 0, 0,
			0, 0, 2 / depth, 0,
			-1, 1, 0, 1,
		];
  	},
	perspective: function(fieldOfViewInRadians, aspect, near, far) {
		var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
		var rangeInv = 1.0 / (near - far);
		return [
			f / aspect, 0, 0, 0,
			0, f, 0, 0,
			0, 0, (near + far) * rangeInv, -1,
			0, 0, near * far * rangeInv * 2, 0
		];
	},
};

function lerp(from, to, amount) {
	return from * (1 - amount) + to * amount;
}

function getScroll() {
	return window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
}

main();