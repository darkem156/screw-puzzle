import { useEffect, useRef, useState } from "react"
import { Bar, Board, Hole, Screw } from "../utils/game/objects"
import { calculateMidPoint, pointInPolygon } from "../utils/game/math"
import { Point } from "../utils/game/Point"
import { initWebGL } from "../utils/game/webgl"

export const PIXEL_SIZE = window.innerHeight < window.innerWidth ? window.innerHeight * 0.60 / 8 : window.innerWidth * 0.60 / 8//innerWidth * devicePixelRatio / 8
export const ROTATION_SPEED = 1.5
export const ANIMATION_SPEED = 6

export default function Game({ board, setCurrentLevel, levelName }: { levelName: string, board: Board, setCurrentLevel: (level: number | ((current: number) => number)) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null)
  const [gl, setgl] = useState<WebGLRenderingContext | null>(null)
  const [currentScrew, setCurrentScrew] = useState<Screw | null>(null)
  const [barsNumber, setBarsNumber] = useState(0)
  const [boardReady, setBoardReady] = useState(false)

  useEffect(() => {
    board.setBarsNumber = setBarsNumber
    board.getState(setBoardReady)
  }, [board])

  useEffect(() => {
    if(barsNumber == 0 && boardReady) {
      setCurrentLevel((current: number) => {
        console.log(current)
        return current + 1
      })
    }
  }, [barsNumber, setCurrentLevel, boardReady])

  useEffect(() => {
    setCanvas(canvasRef.current)
  }, [canvasRef])

  useEffect(() => {
    if (!canvas) return
    setgl(canvas.getContext("webgl", { antialias: true })!)
  }, [canvas])

  useEffect(() => {
    if(gl) initWebGL(gl)
    function render() {
      if (!gl || !canvas) return
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      board.sortByLayer().map(obj => {
        if(!gl) return
        obj.draw(gl)
        obj.applyGravity(board, render)
      })
      requestAnimationFrame(render)
    }
    render()
  }, [gl, canvas, board])

  function insertScrew(obj: Hole) {
    if (!currentScrew) return
    if (obj.detectCollision(board)[0]) return
    currentScrew.color = [1, 1, 1]
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
      obj.color = [1, 0, 0]
      if (obj == currentScrew) {
        currentScrew!.color = [1, 1, 1]
        return setCurrentScrew(null)
      }
      if (currentScrew) currentScrew!.color = [1, 1, 1]
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
          //console.log(key, LI, RI, RF, LF, position.xO, position.yO)
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
    <div className="flex flex-col gap-4">
      <div className="flex gap-4">
        <p className="text-2xl"><b>Level:</b> <span className="font-extrabold">{levelName}</span></p>
      </div>
      <canvas className="bg-orange-700 rounded-lg" onClick={handleClick} width={PIXEL_SIZE * 8} height={PIXEL_SIZE * 8} ref={canvasRef} ></canvas>
    </div>
  )
}