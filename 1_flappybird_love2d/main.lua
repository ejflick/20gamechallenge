local gfx = love.graphics

function love.load()
   screenWidth, screenHeight = gfx.getDimensions()

   gfx.setDefaultFilter("nearest", "nearest")
   spriteSheet = gfx.newImage("sprites.png")
   spriteSheet:setWrap("clampzero", "clamp")

   -- Player variables
   vel = 0
   flap = false
   pwidth = 64
   pheight = 48
   x = (screenWidth / 4) - (pwidth / 2)
   y = (screenHeight / 2) - (pheight / 2)
   pframes = {
	  gfx.newQuad(0, 0, 16, 12, spriteSheet)
   }
   ptransform = love.math.newTransform()

   local interval = 3.7
   pipes = {
	  interval = interval,
	  timeTilNext = interval,
	  speed = 100
   }
   pipeQuad = gfx.newQuad(0, 16, 35, 168, spriteSheet)

   baseScaleTransform = love.math.newTransform()
   baseScaleTransform:scale(4)

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

function updatePlayer(dt)
   if flap then
	  vel = -9
	  flap = false
   end

   y = y + vel
   vel = vel + (dt * 17)

   if playerCollidesWithPipe() then
	  state = "collision"
   end
end

local pipeSpacing = 270
function genPipe()
   local topBottomY = love.math.random() * (screenHeight - 64 - pipeSpacing)
   table.insert(pipes, {x=screenWidth, y=0, width=128, height=topBottomY, isTop=true})

   local bottomTopY = topBottomY + pipeSpacing
   table.insert(pipes, {x=screenWidth, y=bottomTopY, width=128, height=(screenHeight - bottomTopY), isTop=false})
end

function updatePipes(dt)
   for i=#pipes,1,-1 do
	  local p = pipes[i]
	  p.x = p.x - (dt * 100)

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

function love.update(dt)
   if state == "playing" then
	  updatePlayer(dt)
	  updatePipes(dt)
   elseif state == "collision" then
   end
end

function drawPlayer()
   ptransform:reset()
   ptransform:translate(x, y)
   ptransform:scale(4)
   gfx.draw(spriteSheet, pframes[1], ptransform)
end

local pipeTransform = love.math.newTransform()
function drawPipes()
   for i=1,#pipes do
	  local p = pipes[i]

	  pipeTransform:reset()
	  if p.isTop then
		 pipeTransform:translate(p.x, p.height)
		 pipeTransform:scale(4, -4)
	  else
		 pipeTransform:translate(p.x, p.y)
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
   elseif state == "collision" then
	  drawPipes()
	  drawPlayer()
   end
end

function love.keypressed(key, _scancode, isrepeat)
   if key == "escape" then
	  love.event.quit()
   elseif not isrepeat and key == "space" then
	  flap = true
   end
end

