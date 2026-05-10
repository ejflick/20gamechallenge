const canvas = document.getElementById("c");
const ctxt = canvas.getContext("2d");

// No right click menu.
canvas.addEventListener("contextmenu", event => {
	event.preventDefault();
});

const SCREEN_WIDTH = 640;
const SCREEN_HEIGHT = 480;

const HUD_VERTICAL_SPACE = 24;

const WORLD_WIDTH = SCREEN_WIDTH;
const WORLD_HEIGHT = SCREEN_HEIGHT - HUD_VERTICAL_SPACE;

let bricks = [];

function drawRect(color, x, y, w, h) {
	ctxt.fillStyle = color;
	ctxt.fillRect(x, y, w, h);
}

function clamp(val, lo, hi) {
	if (val < lo)
		return lo;
	if (val > hi)
		return hi;

	return val;
}

function aabb(x1, y1, w1, h1, x2, y2, w2, h2) {
	return x1 < x2 + w2 &&
		x1 + w1 > x2 &&
		y1 < y2 + h2 &&
		y1 + h1 > y2;
}

const walls = (function() {
	let all = [
		{ id: "top", x: 0, y: HUD_VERTICAL_SPACE, w: SCREEN_WIDTH, h: 24 },
		{ id: "left", x: 0, y: HUD_VERTICAL_SPACE + 24, w: 24, h: SCREEN_HEIGHT },
		{ id: "right", x: SCREEN_WIDTH - 24, y: HUD_VERTICAL_SPACE + 24, w: 24, h: SCREEN_HEIGHT },
	];
	
	return Object.freeze({
		render() {
			all.forEach(function(wall) {
				drawRect("#222233", wall.x, wall.y, wall.w, wall.h);
			});
		},

		collision(x, y, w, h) {
			for (const wall of all) {
				if (aabb(wall.x, wall.y, wall.w, wall.h, x, y, w, h)) {
					return wall.id;
				}
			}
		},
	});
})();

const paddle = (function() {
	let x = (WORLD_WIDTH / 2) + 48,
		y = SCREEN_HEIGHT - 36,
		w = 96,
		h = 18,
		mouseListener = null;

	
	return Object.freeze({
		init() {
			x = (WORLD_WIDTH / 2) + 48;
			y = SCREEN_HEIGHT - 36;
			w = 96;
			h = 18;

			if (mouseListener) {
				canvas.removeEventListener("mousemove", mouseListener);
			}

			mouseListener = function() {
				x = clamp(event.clientX - (w / 2), 24, SCREEN_WIDTH - 24 - w);
			}
			canvas.addEventListener("mousemove", mouseListener);
		},

		collision(ox, oy, ow, oh) {
			return aabb(ox, oy, ow, oh, x, y, w, h);
		},
		
		render() {
			drawRect("white", x, y, w, h);
		},

		get middleX() {
			return x + (w / 2);
		},

		get y() {
			return y;
		}
	});
})();

const ball = (function() {
	const speed = 150;

	let x = 0,
		y = 0,
		w = 10,
		h = 10,
		velx = 0,
		vely = 0,
		clicked = undefined, // "left" or "right"
		clickListener = undefined;
	
	const states = {
		followingPaddle: {
			init: function() {
				clickListener = function(event) {
					if (event.button == 0)
						clicked = "left";
					else if (event.button == 2)
						clicked = "right";
				};
				
				canvas.addEventListener("mousedown", clickListener);
			},
			
			update(dt) {
				y = paddle.y - (h * 1.5);
				x = paddle.middleX - (w / 2);

				if (clicked) {
					const sqrtOf2 = Math.sqrt(2);
					vely = -sqrtOf2;

					if (clicked === "left")
						velx = -sqrtOf2;
					else
						velx = sqrtOf2;
					
					clicked == undefined;
					state.exit();

					state = states.bouncing;
					state.init();
				}
			},

			exit() {
				canvas.removeEventListener("mousedown", clickListener);
			},
		},
		
		bouncing: {
			init() {
			},
			
			update(dt) {
				x += velx * speed * dt;
				y += vely * speed * dt;

				if (paddle.collision(x, y, w, h)) {
					vely *= -1;
				}

				let wallColl = walls.collision(x, y, w, h);
				if (wallColl === "left") {
					velx *= -1;
					x = 24;
				} else if (wallColl === "right" ) {
					velx *= -1;
					x = SCREEN_WIDTH - 24 - w;
				} else if (wallColl === "top") {
					vely *= -1;
					y = HUD_VERTICAL_SPACE + 24;
				}
			},

			exit() {
			},
		},
		
		resetting: {
		},
	};

	let state = states.followingPaddle;
	
	return Object.freeze({
		init() {
			state = states.followingPaddle;
			state.init();
		},

		render() {
			drawRect("red", x, y, w, h);
		},
		
		update(dt) {
			state.update(dt);
		},
	});
})();

function init() {
	paddle.init();
	ball.init();
}

let lastTime = performance.now();
let accumulator = 0;
const minTimeStep = 1000 / 60;

function render() {
	const now = performance.now();
	accumulator += now - lastTime;
	lastTime = now;
	
	ctxt.fillStyle = "black";
	ctxt.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

	while (accumulator >= minTimeStep) {
		const dt = minTimeStep / 1000;

		ball.update(dt);
		
		accumulator -= minTimeStep;
	}

	walls.render();
	paddle.render();
	ball.render();
	
	requestAnimationFrame(render);
}

init();
render();
