#include <SDL3/SDL.h>
#include <SDL3/SDL_main.h>
#include <stdbool.h>

#define SCREEN_WIDTH 480
#define SCREEN_HEIGHT 640

#define PLAYER_WIDTH 24
#define PLAYER_HEIGHT 64

struct {
  SDL_FRect rect;
} player;

#define MAX_PIPES 10

struct {
  SDL_FRect rects[MAX_PIPES];
  int active;
} pipes;

void init_player() {
  player.rect = (SDL_FRect){ 0.0, 0.0, PLAYER_WIDTH, PLAYER_HEIGHT };
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
  place_pipe(64.0f, 64.0f, 48.0f, 100.0f);

  SDL_Event event;
  bool running = true;
  while (running) {
	while (SDL_PollEvent(&event) == true) {
	  if (event.type == SDL_EVENT_QUIT)
		running = false;
	}

	SDL_SetRenderDrawColor(renderer, 0x0, 0x0, 0x0, 0xff);
	SDL_RenderClear(renderer);
	draw_pipes(renderer);
	SDL_RenderPresent(renderer);
  }

  SDL_DestroySurface(surface);
  SDL_DestroyRenderer(renderer);
  SDL_DestroyWindow(window);

  SDL_Quit();
  
  return 0;
}
