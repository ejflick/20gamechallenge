#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <stdbool.h>
#include <stdint.h>

#define SCREEN_WIDTH 480
#define SCREEN_HEIGHT 640

#define PLAYER_WIDTH 64
#define PLAYER_HEIGHT 48
#define GRAVITY 800 / 1000

struct {
  SDL_FRect rect; // Bounding box for player.
  float vely; // Y velocity.
} player;

#define MAX_PIPES 10

struct {
  SDL_FRect rects[MAX_PIPES]; // The bounding boxes of the pipes.
  int active; // Current number of pipes that are active.
} pipes;

void init_player() {
  player.rect = (SDL_FRect){
	(SCREEN_WIDTH / 2) - (PLAYER_WIDTH / 2),
	(SCREEN_HEIGHT / 2) - (PLAYER_HEIGHT / 2),
	PLAYER_WIDTH,
	PLAYER_HEIGHT
  };
  player.vely = 0;
}

void draw_player(SDL_Renderer* renderer) {
  SDL_SetRenderDrawColor(renderer, 0xff, 0x0, 0x0, 0xff);
  SDL_RenderFillRect(renderer, &(player.rect));
}

void update_player(float deltaTime) {
  player.rect.y += player.vely;
  player.vely += deltaTime * GRAVITY;
}

void player_jump() {
  
}

void init_pipes() {
  SDL_memset((void*) &pipes, 0, sizeof(pipes));
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
	}

	uint64_t currentTime = SDL_GetTicks();
	deltaTime = (currentTime - lastTime) / 1000.0f;
	lastTime = currentTime;

	update_player(deltaTime);

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
