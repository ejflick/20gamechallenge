#!/bin/bash

FILETYPES="*.lua *.png *.wav"
BUILD_PATH="build/"

mkdir -p $BUILD_PATH
cp $FILETYPES $BUILD_PATH
pushd $BUILD_PATH
zip -9 -r FlappyBird.love .
rm $FILETYPES
popd
