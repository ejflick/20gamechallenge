const PI_THIRD = Math.PI / 3;

const canvas = document.getElementById("c");
const ctxt = canvas.getContext("2d");

const SCREEN_WIDTH = canvas.clientWidth;
const SCREEN_HEIGHT = canvas.clientHeight;

function clamp(val, lo, hi) {
	if (val < lo) return lo;
	else if (val > hi) return hi;

	return val;
}

class Box {
	constructor(x, y, width, height, velx = 0, vely = 0) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.velx = velx;
		this.vely = vely;
		this.speed = 0;
	}

	draw(ctxt) {
		if (this.color) {
			ctxt.fillStyle = this.color;
			ctxt.fillRect(this.x, this.y, this.width, this.height);
		}
	}

	update() {

	}

	onCollision(data) {

	}

	normalizeVel() {
		const dist = Math.hypot(this.velx, this.vely);
		this.velx = this.velx / dist;
		this.vely = this.vely / dist;
	}
}

class Player extends Box {
	constructor() {
		super(0, 0, 96, 18);
		this.x = (SCREEN_WIDTH / 2) - (this.width / 2);
		this.y = SCREEN_HEIGHT - (2 * this.height);

		this.color = "white";
	}

	init() {
		canvas.addEventListener('contextmenu', event => {
			event.preventDefault();
		});
		canvas.addEventListener('mousemove', event => {
			const cbr = canvas.getBoundingClientRect();
			this.x = event.clientX - (this.width / 2) - cbr.left;
			this.x = this.x < 0 ? 
			0 : 
			(this.x + this.width > SCREEN_WIDTH ? SCREEN_WIDTH - this.width : this.x);
		});
		canvas.addEventListener('mousedown', event => {
			if (event.button === 0) {
				this.ball.launch("left");
			} else if (event.button === 2) {
				this.ball.launch("right");
			}
		});
	}

	yourBallIs(ball) { this.ball = ball; }
}

function sign(x) {
	if (x === 0) return 0;
	return x > 0 ? 1 : -1;
}

class Ball extends Box {
	constructor(player) {
		const myWidth = 8;
		const myHeight = 8;
		super(player.x + (player.width / 2) - (myWidth/2), player.y - myHeight * 2, myWidth, myHeight);

		this.player = player;
		this.color = "red";
		this.state = "followingPaddle";
	}

	#move(dt, boxes) {
		let collisions = [];
		let xMvmt = this.speed * dt * this.velx;
		let yMvmt = this.speed * dt * this.vely;
		for (const other of boxes) {
			let xInvEntry = 0, yInvEntry = 0;
			let xInvExit  = 0, yInvExit  = 0;

			if (this.velx > 0.0) {
				xInvEntry = other.x - (this.x + this.width);
				xInvExit = (other.x + other.width) - this.x;
			} else {
				xInvEntry = (other.x + other.width) - this.x;
				xInvExit = other.x - (this.x + this.width);
			}

			if (this.vely > 0.0) {
				yInvEntry = other.y - (this.y + this.height);
				yInvExit = (other.y + other.height) - this.y;
			} else {
				yInvEntry = (other.y + other.height) - this.y;
				yInvExit = other.y - (this.y + this.height);
			}

			let xEntry = 0, yEntry = 0,
				xExit  = 0, yExit  = 0;
			
			if (xMvmt === 0.0) {
				xEntry = -Infinity;
				xExit = Infinity;
			} else {
				xEntry = xInvEntry / xMvmt;
				xExit = xInvExit / xMvmt;
			}

			if (xMvmt === 0.0) {
				yEntry = -Infinity;
				yExit = Infinity;
			} else {
				yEntry = yInvEntry / yMvmt;
				yExit = yInvExit / yMvmt;
			}
			
			let entryTime = Math.max(xEntry, yEntry);
			let exitTime = Math.min(xExit, yExit);

			if (entryTime > exitTime || xEntry < 0.0 && yEntry < 0.0 || xEntry > 1.0 || yEntry > 1.0) {
				continue;
			}

			let normalx = 0, normaly = 0;

			if (xEntry > yEntry) {
				if (xInvEntry < 0) {
					normalx = 1;
					normaly = 0;
				} else {
					normalx = -1;
					normaly = 0;
				}
			} else {
				if (yInvEntry < 0) {
					normalx = 0;
					normaly = 1;
				} else {
					normalx = 0;
					normaly = -1;
				}
			}


			other.onCollision({obj: this});
			collisions.push({
				normal: {x: normalx, y: normaly},
				entryTime,
				exitTime,
				obj: other
			});
		}

		if (collisions.length != 0) {
			for (let c of collisions) {
				if (c.obj instanceof Player && c.normal.y < 0) {
					let pp = clamp((this.x - c.obj.x) / c.obj.width, 0, 1);
					pp = 1 - pp;
					const p = PI_THIRD + (pp * PI_THIRD);
					this.velx = Math.cos(p);
					this.vely = -Math.sin(p);
				} else {
					if (c.normal.y > 0) {
						this.vely = Math.abs(this.vely);
					} else if (c.normal.y < 0) {
						this.vely = -1 * Math.abs(this.vely);
					} else if (c.normal.x > 0) {
						this.velx = Math.abs(this.velx);
					} else if (c.normal.x < 0) {
						this.velx = -1 * Math.abs(this.velx);
					}
				}

				this.x += xMvmt * c.entryTime;
				this.y += yMvmt * c.entryTime;

				// Always bounce
				// if (c.normal.x > 0 || c.normal.x < 0)
				// 	this.y += (this.speed * dt * this.vely) * (1 - c.entryTime);
				// else if (c.normal.y > 0 || c.normal.y < 0)
				// 	this.x += (this.speed * dt * this.velx) * (1 - c.entryTime);
			}
		} else {
			this.x += xMvmt;
			this.y += yMvmt;
		}
	}

	update(dt, boxes) {
		if (this.state === "followingPaddle") {
			this.x = this.player.x + (this.player.width / 2) - (this.width/2);
			this.y = this.player.y - this.height * 2;
		} else {
			this.#move(dt, boxes);
		}
	}

	resetYourself() {
		this.state = "followingPaddle";
	}

	launch(dir) {
		if (this.state !== "followingPaddle") {
			return;
		}
		
		if (dir === "left") {
			this.velx = -0.5;
		} else if (dir === "right") {
			this.velx = 0.5;
		}

		this.vely = -0.5;
		this.speed = 340;

		this.state = "bouncing";
	}
}

class Brick extends Box {
	onCollision(_data) {
		this.delete = true;
	}
}

class OutOfBounds extends Box {
	constructor() {
		super(0, SCREEN_HEIGHT + 32, SCREEN_WIDTH, 64);
	}

	onCollision(data) {
		data.obj.resetYourself();
	}
}

let boxes,
	ball,
	player;

let prevTime = performance.now();

function render() {
	const now = performance.now();
	const elapsed = now - prevTime;
	const dt = elapsed / 1000;
	prevTime = now;

	ctxt.fillStyle = "black";
	ctxt.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

	for (const box of boxes) {
		box.update(dt, boxes);
		box.draw(ctxt);
	}

	for (let i = boxes.length - 1; i >= 0; i--) {
		if (boxes[i].delete === true)
			boxes.splice(i, 1);
	}

	requestAnimationFrame(render);
}

function init() {
	player = new Player();
	ball = new Ball(player);
	player.yourBallIs(ball);

	const ceiling = new Box(0, -12, SCREEN_WIDTH, 12);
	ceiling.color = "#212141ff";
	const leftWall = new Box(-20, 0, 20, SCREEN_HEIGHT);
	leftWall.color = ceiling.color;
	const rightWall = new Box(SCREEN_WIDTH, 0, 20, SCREEN_HEIGHT);
	rightWall.color = ceiling.color;

	const bxPadding = 6;
	const byPadding = 8;
	const bHeight = 12;
	const bWidth = 54;

	const rows = 5;
	const cols = 9;

	let rowColors = [
		"red",
		"darkorange",
		"yellow",
		"green",
		"blue",
	];

	let bricks = [];
	for (let col = 0; col < cols; col++) {
		for (let row = 0; row < rows; row++) {- 12
			const box = new Brick(
				(col * bWidth) + (col * bxPadding) + 50,
				16 + (row * bHeight) + (row * byPadding),
				bWidth,
				bHeight
			);
			box.color = rowColors[row];
			bricks.push(box);
		}
	}

	boxes = [
		player,
		ball,
		ceiling, leftWall, rightWall,
		new OutOfBounds(),
		...bricks,
	];

	player.init();
	render();
}

init();