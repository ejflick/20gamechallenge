const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 600;

const HUD_HEIGHT = 24;
const FIELD_HEIGHT = SCREEN_HEIGHT - HUD_HEIGHT;

/*
  Lanes:
  0: Safe,
  1 - 4: Vehicles,
  5: Safe,
  6 - 10: Water
  11: Safe
*/
const LANES = 12;
const LANE_HEIGHT = FIELD_HEIGHT / LANES;

const canvas = document.getElementById("c");
const ctxt = canvas.getContext("2d");

const entities = new Array(LANES);
for (let i = 0; i < LANES; i++)
	entities[i] = [];

function laneY(l) {
	return FIELD_HEIGHT - (l * LANE_HEIGHT) - LANE_HEIGHT;
}

class Sprite {
	constructor(x, y, width, height) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	collidedWith(obj) {
	}

	overlaps(other) {
		
	}

	render() {
	}

	update(dt) {
	}

	npcMove(dt) {
		this.x -= dt * this.speed;

		if (this.x + this.width < 0 || this.x > SCREEN_WIDTH) {
			this.remove = true;
		}
	}
}

class Truck extends Sprite {
	constructor(x, y) {
		super(x, y + 3, 60, LANE_HEIGHT - 6);
		this.speed = 86 + ((Math.random() * 8) - 4);
	}

	update(dt) {
		super.npcMove(dt);
	}

	render() {
		ctxt.fillStyle = "white";
		ctxt.fillRect(this.x, this.y, this.width, this.height);
	}
}

class Car extends Sprite {
	constructor(x, y) {
		super(x, y, 40, LANE_HEIGHT / 2);
		this.speed = 96;
	}

	update(dt) {
		super.npcMove(dt);
	}

	render() {
		ctxt.fillStyle = "yellow";
		ctxt.fillRect(this.x, this.y, this.width, this.height);
	}
}

class Frog extends Sprite {
	constructor() {
		super((SCREEN_WIDTH / 2) - 16, laneY(0), 36, LANE_HEIGHT);
		addEventListener('keydown', evt => this.keyDownListener(evt));

		this.inputMap = {
			"ArrowUp": 0,
			"ArrowDown": 1,
			"ArrowLeft": 2,
			"ArrowRight": 3,
		};

		this.mvmtDests = [
			{ x: 0, y: -LANE_HEIGHT, time: 0.16 },
			{ x: 0, y: LANE_HEIGHT, time: 0.16 },
			{ x: -40, y: 0, time: 0.20 },
			{ x: 40, y: 0, time: 0.20 },
		];
	}

	keyDownListener(evt) {
		if (evt.repeat) {
		} else {
			this.moving = this.inputMap[evt.code];
		}

		evt.preventDefault();
	}

	render() {
		ctxt.fillStyle = "green";
		ctxt.fillRect(this.x, this.y, this.width, this.height);
	}

	#doMoving(dt) {
		if (!this.dest) {
			const mvmt = this.mvmtDests[this.moving];
			this.dest = {
				x: this.x + mvmt.x,
				y: this.y + mvmt.y,
				totalTime: mvmt.time,
				timer: 0
			};
		}

		if ((this.dest.timer += dt) >= this.dest.totalTime) {
			this.x = this.dest.x;
			this.y = this.dest.y;
			this.moving = null;
			this.dest = null;
		} else {
			const progress = this.dest.timer / this.dest.totalTime;
			this.x = this.x + ((this.dest.x - this.x) * progress);
			this.y = this.y + ((this.dest.y - this.y) * progress);
		}
	}

	update(dt) {
		if (this.moving || this.moving === 0) {
			this.#doMoving(dt);
		}
	}
}

function vehicleSpawner(entities, y) {
	const vehicleTypes = [
		Car,
		Truck
	];

	const weights = new Map();
	weights.set(Car, 7);
	weights.set(Truck, 3);
	const totalWeight = weights.values().reduce((a,b) => a + b);

	const pickType = function() {
		let r = Math.floor(Math.random() * totalWeight);

		for (let [type, weight] of weights) {
			if (r < weight)
				return type;

			r -= weight;
		}

		throw Error("Should have picked a type!");
	}

	const randomSpawnTime = function() {
		return 1.5 + Math.random() * 2;
	}
	
	let timeSinceSpawn = 0,
		nextSpawn = randomSpawnTime();

	const spawn = function() {
		// The front and back shouldn't 
		const type = pickType();
		entities[LANES - 3].push(new type(SCREEN_WIDTH, y));
	};
	
	const update = function(dt) {
		timeSinceSpawn += dt;

		if (timeSinceSpawn < nextSpawn)
			return;

		spawn();

		timeSinceSpawn = 0;
		nextSpawn = randomSpawnTime();
	};	  
	
	return Object.freeze({
		update,
	});
}

let vehicleSpawners = [];
for (let i = 0; i < 4; i++) {
	vehicleSpawners.push(vehicleSpawner(entities, laneY(i + 1)));
}

function renderField() {
	// Start area
	ctxt.fillStyle = "grey";
	ctxt.fillRect(0, FIELD_HEIGHT - LANE_HEIGHT, SCREEN_WIDTH, LANE_HEIGHT);

	// Vehicle lanes 1-4
	ctxt.fillStyle = "black";
	ctxt.fillRect(0, FIELD_HEIGHT - (LANE_HEIGHT * 5), SCREEN_WIDTH, LANE_HEIGHT * 4);

	// Safe lane
	ctxt.fillStyle = "grey";
	ctxt.fillRect(0, FIELD_HEIGHT - (LANE_HEIGHT * 6), SCREEN_WIDTH, LANE_HEIGHT);

	// Swim lanes
	ctxt.fillStyle = "#222244";
	ctxt.fillRect(0, LANE_HEIGHT, SCREEN_WIDTH, LANE_HEIGHT * 4);

	// Goal lane
	ctxt.fillStyle = "green";
	ctxt.fillRect(0, 0, SCREEN_WIDTH, LANE_HEIGHT);

	for (let lane of entities)
		for (let e of lane)
			e.render();
}

let lastTime = performance.now();
function render() {
	const now = performance.now();
	const elapsed = now - lastTime;
	const dt = elapsed / 1000;
	lastTime = now;

	for (let lane of entities) {
		for (let i = 0; i < lane.length; i++) {
			const e = lane[i];
			e.update(dt);
			if (e.remove) {
				lane.splice(i, 1);
			}
		}
	}

	for (vs of vehicleSpawners) {
		vs.update(dt);
	}
	
	ctxt.fillStyle = "black";
	ctxt.fillRect(0, 0, SCREEN_WIDTH, HUD_HEIGHT);

	ctxt.save();
	ctxt.translate(0, HUD_HEIGHT);
	
	ctxt.fillStyle = "#222244";
	ctxt.fillRect(0, 0, SCREEN_WIDTH, FIELD_HEIGHT);
	
	renderField();
	
	ctxt.restore();

	requestAnimationFrame(render);
}

entities[LANES - 1].push(new Frog());

render();
