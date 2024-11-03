import { useEffect, useRef, useState } from "react"
import { Bar, Board, Hole, Screw } from "../utils/game/objects"
import { calculateMidPoint, pointInPolygon } from "../utils/game/math"
import { Point } from "../utils/game/Point"

export const PIXEL_SIZE = 80
export const ROTATION_SPEED = 1.5
export const ANIMATION_SPEED = 6

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null)
  const [currentScrew, setCurrentScrew] = useState<Screw | null>(null)
  const [board] = useState<Board>(new Board())

  useEffect(() => {
    if (board.length) return

    board.push(new Hole(1, 1))
    board.push(new Hole(2, 1))
    board.push(new Bar(1, 3, [2, 0, 2], board, -45))
    board.push(new Bar(1, 6, [0, 2, 2], board))
  }, [board])

  useEffect(() => {
    setCanvas(canvasRef.current)
  }, [canvasRef])

  useEffect(() => {
    if (!canvas) return
    setCtx(canvas.getContext("2d"))
  }, [canvas])

  function render() {
    if (!ctx || !canvas) return
    ctx.fillStyle = "blue"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    board.sortByLayer().map(obj => {
      obj.draw(ctx)
      obj.applyGravity(board, render)
    })
    requestAnimationFrame(render)
  }
  useEffect(() => {
    render()
  }, [ctx])

  function insertScrew(obj: Hole) {
    if (!currentScrew) return
    if (obj.detectCollision(board)[0]) return
    currentScrew.color = "white"
    currentScrew.LI = { x: obj.LI.x, y: obj.LI.y }
    currentScrew.RI = { x: obj.RI.x, y: obj.RI.y }
    currentScrew.LF = { x: obj.LF.x, y: obj.LF.y }
    currentScrew.RF = { x: obj.RF.x, y: obj.RF.y }

    if (currentScrew.parent) {
      currentScrew.parent.holes.set(currentScrew.index!, false)
      currentScrew.parent = undefined
    }
    setCurrentScrew(null)
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvas?.getBoundingClientRect()
    const position = {
      xO: (e.clientX - rect!.left) / PIXEL_SIZE,
      yO: (e.clientY - rect!.top) / PIXEL_SIZE,
      x: Math.floor((e.clientX - rect!.left) / PIXEL_SIZE),
      y: Math.floor((e.clientY - rect!.top) / PIXEL_SIZE)
    }
    const objs = board.filter(obj => obj.constructor.name !== "Background" && pointInPolygon(position.xO, position.yO, [obj.LI, obj.RI, obj.RF, obj.LF])).sort((a, b) => b.layer - a.layer)
    if (!objs.length) return
    if (objs[0].constructor.name != "Screw" && objs[0].constructor.name != "Hole" && objs[0].constructor.name != "Bar") return
    if (objs[0].constructor.name == "Screw") {
      const obj = objs[0] as Screw
      obj.color = "red"
      if (obj == currentScrew) {
        currentScrew!.color = "white"
        return setCurrentScrew(null);;;
      }
      if (currentScrew) currentScrew!.color = "white"
      setCurrentScrew(obj)
    }
    else if (objs[0].constructor.name == "Bar") {
      const obj = objs[0] as Bar
      obj.holes.forEach((_, key) => {
        const [midX, midY] = calculateMidPoint([obj.LI, obj.RI, obj.RF, obj.LF], obj.size, key + 1)
        const LI = new Point(midX - 0.25, midY - 0.25)
        const RI = new Point(midX + 0.25, midY - 0.25)
        const RF = new Point(midX + 0.25, midY + 0.25)
        const LF = new Point(midX - 0.25, midY + 0.25)

        if (pointInPolygon(position.xO, position.yO, [LI, RI, RF, LF])) {
          console.log(key, LI, RI, RF, LF, position.xO, position.yO)
          if (objs[1].constructor.name == "Hole") {
            insertScrew(objs[1] as Hole)
            obj.holes.set(key, true)
          }
        }
      })
    }
    else insertScrew(objs[0] as Hole)
  }

  return (
    <div>
      <canvas onClick={handleClick} width={PIXEL_SIZE * 8} height={PIXEL_SIZE * 8} ref={canvasRef} ></canvas>
    </div>
  )
}