const SCREEN_WIDTH = 400;
const SCREEN_HEIGHT = 600;

const HUD_HEIGHT = 24;
const FIELD_HEIGHT = SCREEN_HEIGHT - HUD_HEIGHT;

const LANES = 12;
const LANE_HEIGHT = FIELD_HEIGHT / LANES;

const canvas = document.getElementById("c");
const ctxt = canvas.getContext("2d");

const entities = new Array(LANES);
for (let i = 0; i < LANES; i++)
	entities[i] = [];

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

	
}

class Frog extends Sprite {
	constructor() {
		super(SCREEN_WIDTH / 2, FIELD_HEIGHT - 32, 32, 32);
		addEventListener('keydown', evt => this.keyDownListener(evt));

		this.inputMap = {
			"ArrowUp": 0,
			"ArrowDown": 1,
			"ArrowLeft": 2,
			"ArrowRight": 3,
		};

		this.mvmtDests = [
			{ x: 0, y: -LANE_HEIGHT },
			{ x: 0, y: LANE_HEIGHT },
			{ x: -LANE_HEIGHT, y: 0 },
			{ x: LANE_HEIGHT, y: 0 },
		];

		this.interpMvmtTime = 0.16;
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
			this.dest = { x: this.x + mvmt.x, y: this.y + mvmt.y, elapsed: 0 };
		}

		if ((this.dest.elapsed += dt) > this.interpMvmtTime) {
			this.x = this.dest.x;
			this.y = this.dest.y;
			this.moving = null;
			this.dest = null;
		} else {
			const progress = this.dest.elapsed / this.interpMvmtTime;
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

	for (let lane of entities)
		for (let e of lane)
			e.update(dt);
	
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
