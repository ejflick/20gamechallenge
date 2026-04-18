#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <stdbool.h>
#include <stdio.h>
#include <stdint.h>

#define SCREEN_WIDTH 600
#define SCREEN_HEIGHT 640

#define PLAYER_WIDTH 64.0f
#define PLAYER_HEIGHT 48.0f
#define GRAVITY 1.9f
#define FLAP_IMPULSE -0.9f

struct {
  SDL_FRect rect; // Bounding box for player.
  float vely; // Y velocity.
  bool flap;
} player;

#define MAX_PIPES 100
#define PIPE_SPEED 100.0f
#define PIPE_GEN_INTERVAL 5

struct {
  SDL_FRect rects[MAX_PIPES]; // The bounding boxes of the pipes.
  int active; // Current number of pipes that are active.
  float timeTilNextPipeGen;
} pipes;

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

void draw_player(SDL_Renderer* renderer) {
  SDL_SetRenderDrawColor(renderer, 0xff, 0x0, 0x0, 0xff);
  SDL_RenderFillRect(renderer, &(player.rect));
}

void update_player(float deltaTime) {
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

void place_pipe(float x, float y, float width, float height) {
  if (pipes.active == MAX_PIPES)
	return;

  pipes.rects[pipes.active] = (SDL_FRect){ x, y, width, height };
  pipes.active++;
}

void draw_pipes(SDL_Renderer* renderer) {
  SDL_SetRenderDrawColor(renderer, 0x00, 0xff, 0x00, 0xff);
  SDL_RenderFillRects(renderer, pipes.rects, pipes.active);
}

void gen_pipe() {
  // Top
  place_pipe(0,0,0,0);

  // Bottom
  place_pipe(0,0,0,0);
  
  pipes.timeTilNextPipeGen = 0;
}

void update_pipes(float deltaTime) {
  for (int i = 0; i < pipes.active; i++) {
	pipes.rects[i].x -= deltaTime * PIPE_SPEED;
  }

  pipes.timeTilNextPipeGen -= deltaTime;
  if (pipes.timeTilNextPipeGen <= 0) {
	gen_pipe();
  }
}

int main(int argc, char** argv)
{
  SDL_Window* window;
  SDL_Surface* surface;
  SDL_Renderer* renderer;

  if (!SDL_Init(SDL_INIT_VIDEO)) {
	SDL_Log("SDL could not initialize. Error %s\n", SDL_GetError());
	return -1;
  }

  SDL_CreateWindowAndRenderer("Flappy Bird", SCREEN_WIDTH, SCREEN_HEIGHT, 0, &window, &renderer);
  if (window == NULL) {
	SDL_Log("Window could not be created. Error: %s\n", SDL_GetError());
	return -1;
  }

  surface = SDL_GetWindowSurface(window);

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
	SDL_Log("%f\n", deltaTime);
	lastTime = currentTime;

	update_player(deltaTime);
	update_pipes(deltaTime);

	SDL_SetRenderDrawColor(renderer, 0x0, 0x0, 0x0, 0xff);
	SDL_RenderClear(renderer);
	
	draw_pipes(renderer);
	draw_player(renderer);
	
	SDL_RenderPresent(renderer);

	SDL_Delay(1);
  }

  SDL_DestroySurface(surface);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);

  SDL_Quit();
  
  return 0;
}
