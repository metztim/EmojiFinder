<template>
  <div class="floating-glyphs" :class="{ 'is-loaded': isLoaded }">
    <div class="floating-glyphs__canvas" ref="container" />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import Matter from 'matter-js'
import spriteUrl from '@/assets/sprite.png'

// Decorative: glyph tiles from the sprite sheet drift across the loading screen.
const { Engine, Render, Runner, World, Body, Bodies, Common, Events } = Matter

// Bodies that leave the area re-enter on the opposite side.
function wrapBodies(world, bounds) {
  const width = bounds.max.x - bounds.min.x
  const height = bounds.max.y - bounds.min.y

  for (const body of world.bodies) {
    const { x, y } = body.position
    let dx = 0
    let dy = 0
    if (body.bounds.max.x < bounds.min.x) dx = width
    else if (body.bounds.min.x > bounds.max.x) dx = -width
    if (body.bounds.max.y < bounds.min.y) dy = height
    else if (body.bounds.min.y > bounds.max.y) dy = -height
    if (dx || dy) Body.setPosition(body, { x: x + dx, y: y + dy })
  }
}

const TILE_SIZE = 300

const container = ref(null)
const isLoaded = ref(false)

let engine = null
let render = null
let runner = null

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })
}

function sliceSprite(image) {
  const tiles = []
  const canvas = document.createElement('canvas')
  canvas.width = TILE_SIZE
  canvas.height = TILE_SIZE
  const ctx = canvas.getContext('2d')

  for (let y = 0; y < image.height; y += TILE_SIZE) {
    for (let x = 0; x < image.width; x += TILE_SIZE) {
      ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE)
      ctx.drawImage(image, x, y, TILE_SIZE, TILE_SIZE, 0, 0, TILE_SIZE, TILE_SIZE)
      tiles.push(canvas.toDataURL())
    }
  }

  return tiles
}

function start(tiles) {
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  if (!width || !height) return

  engine = Engine.create({ gravity: { x: 0, y: 0 } })
  render = Render.create({
    element: container.value,
    engine,
    options: { width, height, wireframes: false, background: 'transparent', pixelRatio: window.devicePixelRatio || 1 },
  })

  const count = Math.floor((width * height) / 8000)
  const bounds = { min: { x: -width * 0.2, y: -height * 0.2 }, max: { x: width * 1.2, y: height * 1.2 } }
  const baseSize = 50

  for (let i = 0; i < count; i += 1) {
    const texture = tiles[Math.floor(Math.random() * tiles.length)]
    const size = Common.random(baseSize, baseSize * 1.8)
    const body = Bodies.rectangle(
      Common.random(bounds.min.x, bounds.max.x),
      Common.random(bounds.min.y, bounds.max.y),
      size,
      size,
      {
        friction: 0,
        frictionAir: 0,
        restitution: 0.8,
        slop: 0,
        chamfer: { radius: 10 },
        render: { sprite: { texture, xScale: size / TILE_SIZE, yScale: size / TILE_SIZE } },
      },
    )

    Body.setVelocity(body, { x: Common.random(-1.5, 1.5), y: Common.random(-1.5, 1.5) })
    Body.rotate(body, Common.random(0, Math.PI * 2))
    World.add(engine.world, body)
  }

  Events.on(engine, 'afterUpdate', () => wrapBodies(engine.world, bounds))

  runner = Runner.create()
  Runner.run(runner, engine)
  Render.run(render)
}

function stop() {
  if (render) {
    Render.stop(render)
    render.canvas.remove()
    render.textures = {}
  }
  if (runner) Runner.stop(runner)
  if (engine) {
    Events.off(engine)
    World.clear(engine.world)
    Engine.clear(engine)
  }
  render = null
  runner = null
  engine = null
}

onMounted(async () => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  try {
    const image = await loadImage(spriteUrl)
    const tiles = sliceSprite(image)
    if (!container.value) return
    start(tiles)
    isLoaded.value = true
  } catch (error) {
    console.warn('Floating glyphs could not start', error)
  }
})

onBeforeUnmount(stop)
</script>

<style lang="scss" scoped>
.floating-glyphs {
  position: relative;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s $ease;

  &.is-loaded {
    opacity: 1;
  }

  &__canvas {
    width: 100%;
    height: 100%;
  }
}
</style>
