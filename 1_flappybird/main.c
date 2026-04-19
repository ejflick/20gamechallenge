#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <SDL3_image/SDL_image.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdint.h>

#define SCREEN_WIDTH 600
#define SCREEN_HEIGHT 640

#define PLAYER_WIDTH 64.0f
#define PLAYER_HEIGHT 48.0f
#define GRAVITY 1.9f
#define FLAP_IMPULSE -0.9f

SDL_Window* window;
SDL_Surface* surface;
SDL_Renderer* renderer;
SDL_Texture* spriteSheet;

enum GameState {
  GS_PLAYING,
  GS_COLLISION
};

enum GameState state = GS_PLAYING;

struct {
  SDL_FRect rect; // Bounding box for player.
  float vely; // Y velocity.
  bool flap;
} player;

#define MAX_PIPES 10
#define PIPE_SPEED 100.0f
#define PIPE_GEN_INTERVAL 3.7f
#define PIPE_WIDTH 128
#define PIPE_SPACING 270

typedef struct Pipe {
  SDL_FRect rect; // Bounding box
  bool top; // Is this the top pipe?
} Pipe;

struct {
  Pipe pipes[MAX_PIPES]; // The bounding boxes of the pipes.
  int active; // Current number of pipes that are active.
  float timeTilNextPipeGen;
} pipes;

bool any_pipes_collide_with(SDL_FRect rect);

bool init_spritesheet() {
  SDL_Surface* surface = IMG_Load("sprites.png");

  if (surface == NULL) {
	SDL_Log("Error loading sprite sheet: %s\n", SDL_GetError());
	return false;
  }

  bool success = true;
  if ((spriteSheet = SDL_CreateTextureFromSurface(renderer, surface)) == NULL) {
	SDL_Log("Error converting surface to texture: %s\n", SDL_GetError());
	success = false;
  }

  SDL_SetTextureScaleMode(spriteSheet, SDL_SCALEMODE_NEAREST);
  
  SDL_DestroySurface(surface);
  return success;
}

void init_player() {
  player.rect = (SDL_FRect){
	(SCREEN_WIDTH  / 4) - (PLAYER_WIDTH  / 2),
	(SCREEN_HEIGHT / 2) - (PLAYER_HEIGHT / 2),
	PLAYER_WIDTH,
	PLAYER_HEIGHT
  };
  player.vely = 0;
  player.flap = false;
}

void draw_player() {
  SDL_FRect src = (SDL_FRect){ 0, 0, 16, 12};
  SDL_RenderTexture(renderer, spriteSheet, &src, &(player.rect));
}

void update_player(float deltaTime) {
  if (any_pipes_collide_with(player.rect)) {
	state = GS_COLLISION;
	return;
  }
  
  if (player.flap) {
	player.vely = FLAP_IMPULSE;
	player.flap = false;
  }
  
  player.rect.y += player.vely;
  player.vely   += deltaTime * GRAVITY;
}

void player_flap() {
  player.flap = true;
}

void init_pipes() {
  SDL_memset((void*) &pipes, 0, sizeof(pipes));
  pipes.timeTilNextPipeGen = PIPE_GEN_INTERVAL;
}

void place_pipe(float x, float y, float height, bool top) {
  if (pipes.active == MAX_PIPES)
	return;

  pipes.pipes[pipes.active] = (Pipe){
	.rect = (SDL_FRect){ x, y, PIPE_WIDTH, height },
	.top = top
  };

  pipes.active += 1;
}

bool any_pipes_collide_with(SDL_FRect rect) {
  for (int i = 0; i < pipes.active; i++) {
	if (SDL_HasRectIntersectionFloat(&rect, &(pipes.pipes[i].rect)))
	  return true;
  }
  
  return false;
}

void draw_pipes() {
  for (int i = 0; i < pipes.active; i++) {
	Pipe pipe = pipes.pipes[i];

	// Draw mouth
	SDL_FRect mouthSrc = (SDL_FRect){ 0, 16, 35, 8 };
	SDL_FRect dst = pipe.rect;
	dst.x -= 2;
	dst.y = pipe.top ? dst.h : dst.y;
	dst.w = mouthSrc.w * 4;
	dst.h = mouthSrc.h * 4;
	SDL_RenderTextureRotated(renderer, spriteSheet, &mouthSrc, &dst, 0, NULL, pipe.top ? SDL_FLIP_VERTICAL : SDL_FLIP_NONE);

	// Draw rest
	SDL_FRect bodySrc = (SDL_FRect){ 0, 24, 35, 8 };
	SDL_FRect bodyDst = pipe.rect;
	bodyDst.x -= 2;
	bodyDst.y = pipe.top ? bodyDst.y : bodyDst.y + mouthSrc.h * 4;
	bodyDst.w = bodySrc.w * 4;
	
	SDL_RenderTexture(renderer, spriteSheet, &bodySrc, &bodyDst);
  }
}

void gen_pipe() {
  // Top
  float topBottomY = SDL_randf() * (SCREEN_HEIGHT - 64 - PIPE_SPACING);
  place_pipe(SCREEN_WIDTH, 0, topBottomY, true);

  // Bottom
  float bottomTopY = topBottomY + PIPE_SPACING;
  place_pipe(SCREEN_WIDTH, bottomTopY, SCREEN_HEIGHT - bottomTopY, false);
}

void update_pipes(float deltaTime) {
  for (int i = 0; i < pipes.active; i++) {
	pipes.pipes[i].rect.x -= deltaTime * PIPE_SPEED;
  }

  // Remove off-screen pipes
  SDL_FRect screen = (SDL_FRect){ 0, 0, SCREEN_WIDTH, SCREEN_HEIGHT };
  for (int i = pipes.active - 1; i >= 0; i--) {
	if (!SDL_HasRectIntersectionFloat(&(pipes.pipes[i].rect), &screen)) {
	  pipes.active -= 1;
	  pipes.pipes[i] = pipes.pipes[pipes.active];
	}
  }

  pipes.timeTilNextPipeGen -= deltaTime;
  if (pipes.timeTilNextPipeGen <= 0) {
	gen_pipe();
	pipes.timeTilNextPipeGen += PIPE_GEN_INTERVAL;
  }
}

int main(int argc, char** argv)
{
  if (!SDL_Init(SDL_INIT_VIDEO)) {
	SDL_Log("SDL could not initialize. Error %s\n", SDL_GetError());
	return -1;
  }

  SDL_Log("SDL Version: %d.%d\n", SDL_MAJOR_VERSION, SDL_MINOR_VERSION);

  SDL_CreateWindowAndRenderer("Flappy Bird", SCREEN_WIDTH, SCREEN_HEIGHT, 0, &window, &renderer);
  if (window == NULL) {
	SDL_Log("Window could not be created. Error: %s\n", SDL_GetError());
	return -1;
  }

  surface = SDL_GetWindowSurface(window);

  SDL_srand(0);

  if (!init_spritesheet()) {
	return -1;
  }
  
  init_player();
  init_pipes();

  SDL_Event event;
  bool running = true;

  uint64_t lastTime = SDL_GetTicks();
  float deltaTime = 0.0f;
  while (running) {
	while (SDL_PollEvent(&event) == true) {
	  if (event.type == SDL_EVENT_QUIT)
		running = false;
	  else if (event.type == SDL_EVENT_KEY_DOWN)
		switch (event.key.scancode) {
		case SDL_SCANCODE_SPACE: {
		  player_flap();
		} break;
		case SDL_SCANCODE_ESCAPE: {
		  running = false;
		} break;
		default: break;
		}
	}

	uint64_t currentTime = SDL_GetTicks();
	deltaTime = (currentTime - lastTime) / 1000.0f;
	lastTime = currentTime;

	switch (state) {
	case GS_COLLISION:
	  break;
	case GS_PLAYING: {
	  update_player(deltaTime);
	  update_pipes(deltaTime);
	}; break;
	default:
	  break;
	}

	SDL_SetRenderDrawColor(renderer, 0x3f, 0x3f, 0x74, 0xff);
	SDL_RenderClear(renderer);

	draw_pipes();
	draw_player();

	SDL_RenderPresent(renderer);

	SDL_Delay(1);
  }

  SDL_DestroySurface(surface);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);
  SDL_DestroyTexture(spriteSheet);

  SDL_Quit();
  
  return 0;
}
