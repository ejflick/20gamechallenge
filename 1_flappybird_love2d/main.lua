local gfx = love.graphics

local font = nil
local spriteSheet = nil
local flapSound, hurtSound = nil

function love.load()
   screenWidth, screenHeight = gfx.getDimensions()

   gfx.setDefaultFilter("nearest", "nearest")

   if not font then
	  font = love.graphics.newImageFont("font.png", " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789")
   end
   
   if not spriteSheet then
	  spriteSheet = gfx.newImage("sprites.png")
   end

   if not flapSound then
	  flapSound = love.audio.newSource(love.sound.newSoundData("jump.wav"))
   end

   if not hurtSound then
	  hurtSound = love.audio.newSource(love.sound.newSoundData("hitHurt.wav"))
   end
   
   -- Player variables
   score = 0
   gravity = 17
   vel = 0
   flap = false
   pwidth = 64
   pheight = 48
   x = (screenWidth / 4) - (pwidth / 2)
   y = (screenHeight / 2) - (pheight / 2)
   pframes = {
	  gfx.newQuad(0, 0, 16, 12, spriteSheet),
	  gfx.newQuad(16, 0, 16, 12, spriteSheet)
   }
   ptransform = love.math.newTransform()
   flapTimer = 0

   local interval = 3.7
   pipes = {
	  interval = interval,
	  timeTilNext = interval,
	  speed = 128
   }
   pipeQuad = gfx.newQuad(0, 16, 35, 168, spriteSheet)

   gfx.setFont(font)

   state = "playing"
end

function aabb(x1, y1, w1, h1, x2, y2, w2, h2)
   return x1 < x2 + w2 and x1 + w1 > x2 and y1 < y2 + h2 and y1 + h1 > y2
end

function playerCollidesWithPipe()
   for i=1,#pipes do
	  local p = pipes[i]
	  if aabb(x, y, pwidth, pheight, p.x, p.y, p.width, p.height)  then
		 return true
	  end
   end

   return false
end

function toCollisionState()
   state = "collision"
   vel = -20
   gravity = 40
   love.audio.stop()
   hurtSound:play()
end

function updatePlayer(dt)
   if flap then
	  vel = -9
	  flap = false
	  flapSound:seek(0, "seconds")
	  flapSound:play()

	  if flapTimer <= 0 then
		 flapTimer = 0.3
	  end
   end

   y = y + vel
   vel = vel + (dt * gravity)
   if y < 0 then y = 0 end

   if y > screenHeight + pheight or playerCollidesWithPipe() then
	  toCollisionState()
   end

   if flapTimer > 0 then
	  flapTimer = flapTimer - dt
   end
end

local pipeSpacing = 250
function genPipe()
   local topBottomY = love.math.random() * (screenHeight - 64 - pipeSpacing)
   table.insert(pipes, {x=screenWidth, y=0, width=128, height=topBottomY, isTop=true})

   local bottomTopY = topBottomY + pipeSpacing
   table.insert(pipes, {x=screenWidth, y=bottomTopY, width=128, height=(screenHeight - bottomTopY), isTop=false})
end

function updatePipes(dt)
   for i=#pipes,1,-1 do
	  local p = pipes[i]
	  p.x = p.x - (dt * pipes.speed)

	  if p.x < -p.width - 12 then
		 table.remove(pipes, i)
	  end
   end

   pipes.timeTilNext = pipes.timeTilNext - dt
   

   if pipes.timeTilNext <= 0 then
	  genPipe()
	  pipes.timeTilNext = pipes.timeTilNext + pipes.interval
   end
end

function updatePlayerColl(dt)
   y = y + vel
   vel = vel + (dt * gravity)

   if y > screenHeight + 400 then
	  state = "showscore"
   end
end

function love.update(dt)
   if state == "playing" then
	  updatePlayer(dt)
	  updatePipes(dt)
   elseif state == "collision" then
	  updatePlayerColl(dt)
   end
end

function drawPlayer()
   ptransform:reset()
   ptransform:translate(x, y)
   ptransform:scale(4)
   
   local frame = pframes[1]
   if flapTimer > 0 then
	  frame = pframes[2]
   end

   gfx.draw(spriteSheet, frame, ptransform)
end

local pipeTransform = love.math.newTransform()
function drawPipes()
   for i=1,#pipes do
	  local p = pipes[i]

	  pipeTransform:reset()
	  if p.isTop then
		 pipeTransform:translate(math.floor(p.x), math.floor(p.height))
		 pipeTransform:scale(4, -4)
	  else
		 pipeTransform:translate(math.floor(p.x), math.floor(p.y))
		 pipeTransform:scale(4, 4)
	  end

	  gfx.draw(spriteSheet, pipeQuad, pipeTransform)
   end
end

function love.draw()
   gfx.clear(love.math.colorFromBytes(63, 63, 116, 255))

   if state == "playing" then
	  drawPipes()
	  drawPlayer()
	  gfx.setColor(0.1, 0.1, 0.1, 1)
	  gfx.print(score, 5, 5, 0, 2, 2)
	  gfx.setColor(1, 1, 1, 1)
	  gfx.print(score, 2, 2, 0, 2, 2)
   elseif state == "collision" then
	  drawPipes()
	  drawPlayer()
   elseif state == "showscore" then
	  gfx.print(score, 32, 32, 0, 4, 4)
   end
end

function love.keypressed(key, _scancode, isrepeat)
   if key == "escape" then
	  love.event.quit()
   elseif not isrepeat and key == "space" then
	  flap = true
   end
end

