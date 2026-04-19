#!/bin/bash

if [[ $1 == "--clean" ]]; then
	rm flappybird
	exit
fi

CFLAGS=$(pkg-config --cflags --libs sdl3 sdl3-image)

set -x
gcc -o flappybird main.c $CFLAGS

