import { ANIMATION_SPEED, PIXEL_SIZE, ROTATION_SPEED } from "../../components/Game";
import { MaskPoint, Point } from "./Point";
import { calculateMidPoint, maskAndCircleIntersect, masksIntersect, rotatePoint, toPrecision } from "./math";

export class Board extends Array {
  objects: Map<string, number> = new Map();
  push(...items: GameObject[]) {
    items.map((item, index) => this.objects.set(item.id, index + this.length))
    return super.push(...items)
  }
  remove(item: GameObject) {
    const index = this.objects.get(item.id)
    if(index === undefined) return
    this.splice(index, 1)
    this.objects.delete(item.id)
    this.objects.forEach((value, key) => {
      if(value > index) this.objects.set(key, value - 1)
    })
  }
  sortByLayer() {
    const copy = this.slice()
    return copy.sort((a, b) => a.layer - b.layer)
  }
}

export class GameObject {
  id: string;
  LI: Point;
  RI: Point;
  LF: Point;
  RF: Point;
  color?: string;
  collision = false;
  collisionMask?: MaskPoint[];
  collisionPoints?: MaskPoint[];
  sectionPoints = new Map<number, MaskPoint[]>();
  gravity = false;
  maxSection = 1;
  isCircle = false;
  layer = 0;

  constructor(x: number, y: number, width: number, height: number, color?: string) {
    this.id = Math.random().toString(36).substr(2, 9)
    this.LI = new Point(x, y)
    this.RI = new Point(x + width, y)
    this.LF = new Point(x, y + height)
    this.RF = new Point(x + width, y + height)
    this.color = color;
  }

  applyGravity(board: Board): boolean {
    if(!this.gravity) return true
    if(Math.min(this.LF.y, this.RF.y, this.LI.y, this.RI.y) >= 8) {
      board.remove(this)
      return false
    }
    this.move(0, 1 / PIXEL_SIZE * ANIMATION_SPEED)
    let correctMoved = true
    const col = this.detectCollision(board)
    if(col[0]) {
      this.move(0, -1 / PIXEL_SIZE * ANIMATION_SPEED)
      correctMoved = false
    }

    if(!correctMoved) {
      let triedToRotate = false

      for (let i = 0; i < col[1].length; i++) {
        const midPoint = calculateMidPoint([this.LI, this.RI, this.RF, this.LF])
        const rotationSign = midPoint[0] >= col[1][i][0] ? -1 : 1
        this.rotate(rotationSign*ROTATION_SPEED, 1, col[1][i][0], col[1][i][1])
        const rotCol = this.detectCollision(board)
        if(rotCol[0]) {
          this.rotate(-rotationSign*ROTATION_SPEED, 1, col[1][i][0], col[1][i][1])
          triedToRotate = true
        }
        else {
          triedToRotate = false
          break
        }
      }
      return !triedToRotate
    }
    /*
    if(Math.round(this.calculateRotation()[1]) % 90 != 0) {
      this.rotate(1)
    }
    */

    return true
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color || "red"
    ctx.beginPath()
    ctx.moveTo(this.LI.x * PIXEL_SIZE, this.LI.y * PIXEL_SIZE)
    ctx.lineTo(this.RI.x * PIXEL_SIZE, this.RI.y * PIXEL_SIZE)
    ctx.lineTo(this.RF.x * PIXEL_SIZE, this.RF.y * PIXEL_SIZE)
    ctx.lineTo(this.LF.x * PIXEL_SIZE, this.LF.y * PIXEL_SIZE)
    ctx.closePath()
    ctx.fill()
    if(!this.collision || !this.collisionMask) return
    ctx.strokeStyle = "red"
    ctx.lineWidth = 0.5
    ctx.beginPath()
    if(!this.collisionPoints) return
    this.collisionPoints!.map(({ x, y }) => {
      ctx.lineTo(x * PIXEL_SIZE, y * PIXEL_SIZE)
    })
    ctx.closePath()
    ctx.stroke()
  }
  calculateAbsoluteRotation() {
    const firstMidPoint = calculateMidPoint(this.collisionPoints!, 2, 1)
    const secondMidPoint = calculateMidPoint(this.collisionPoints!, 2, 2)

    const absoluteRotation = toPrecision(Math.atan((secondMidPoint[1] - firstMidPoint[1]) / (secondMidPoint[0] - firstMidPoint[0])) * 180 / Math.PI)
    return absoluteRotation
  }
  calculateRotation() {
    const condition = this.RI.x > this.LI.x ? 1 : -1
    const slope = (this.RI.y - this.LI.y) / (this.RI.x - this.LI.x)
    const rads = Math.atan(slope) * condition
    return [rads, rads * 180 / Math.PI]
  }
  detectCollision(objects: GameObject[], points: MaskPoint[] = this.collisionPoints!) {
    let collision: [boolean, number[][], GameObject | null] = [false, [], null]
    objects.map((object) => {
      if(object.id === this.id || collision[0]) return
      if(!object.collision || (!object.collisionMask && !object.isCircle)) return
      const col = this.isCircle ?
        object.isCircle ? [] : maskAndCircleIntersect(object.collisionPoints!, this as Circle)
      : object.isCircle ? maskAndCircleIntersect(points, object as Circle) : masksIntersect(points, object.collisionPoints!)
      if(col[0]) {
        collision = [true, col, object]
      }
    })
    return collision
  }

  calculateMaskPoints() {
    if(!this.collisionMask) return
    this.collisionPoints = this.collisionMask.map((point: MaskPoint) => {
      const x = this.LI.x + (this.RI.x - this.LI.x) * point.x
      const y = this.LI.y + (this.LF.y - this.LI.y)*point.y
      return new MaskPoint(x, y, point.section, point.prevSection, point.curve)
    })
  }

  rotate(grades: number, index = 1, rotCx: number | null = null, rotCy: number | null = null) {
    const radians = (grades * Math.PI) / 180
    if(!rotCx || !rotCy) [rotCx, rotCy] = calculateMidPoint([this.LI, this.RI, this.RF, this.LF], this.maxSection, index)
    let point = rotatePoint([this.LI.x, this.LI.y], radians, [rotCx, rotCy])
    this.LI = new Point(point.x, point.y)
    point = rotatePoint([this.RI.x, this.RI.y], radians, [rotCx, rotCy])
    this.RI = new Point(point.x, point.y)
    point = rotatePoint([this.RF.x, this.RF.y], radians, [rotCx, rotCy])
    this.RF = new Point(point.x, point.y)
    point = rotatePoint([this.LF.x, this.LF.y], radians, [rotCx, rotCy])
    this.LF = new Point(point.x, point.y)

    this.collisionPoints = this.collisionPoints!.map((point: MaskPoint) => {
      const newCoords = rotatePoint([point.x, point.y], radians, [rotCx, rotCy])
      return new MaskPoint(newCoords.x, newCoords.y, point.section, point.prevSection)
    })
  }
  move(x: number, y: number) {
    this.LI.x += x
    this.LI.y += y
    this.RI.x += x
    this.RI.y += y
    this.RF.x += x
    this.RF.y += y
    this.LF.x += x
    this.LF.y += y
    this.collisionPoints = this.collisionPoints!.map((point: MaskPoint) => new MaskPoint(point.x+x, point.y+y, point.section, point.prevSection))
  }
}

export class Circle extends GameObject {
  constructor(x: number, y: number, public radius: number = 0.2, color = "white") {
    super(x, y, radius*2, radius*2, color)

    this.isCircle = true
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color || "red"
    ctx.beginPath()
    const [midX, midY] = calculateMidPoint([this.LI, this.RI, this.RF, this.LF], this.maxSection)
    ctx.arc(midX * PIXEL_SIZE, midY * PIXEL_SIZE, this.radius*2 * PIXEL_SIZE / 2, 0, 2 * Math.PI)
    ctx.fill()
    ctx.strokeStyle = "red"
    ctx.lineWidth = 0.5
    ctx.beginPath()
    if(!this.collision) return
    ctx.arc(midX * PIXEL_SIZE, midY * PIXEL_SIZE, this.radius*2 * PIXEL_SIZE / 2, 0, 2 * Math.PI)
    ctx.stroke()
    ctx.closePath()
  }
}

export class Hole extends Circle {
  layer = 998
  constructor(x: number, y: number, public hasScrew = false) {
    super(x, y, 0.2, "black")
  }
}

export class Screw extends Circle {
  layer = 1000
  collision = true
  constructor(x: number, y: number, board: Board, public parent?: Bar, public index?: number) {
    super(x, y)
    setTimeout(() => board.push(new Hole(x, y)), 0)
  }
}

export class Bar extends GameObject {
  layer = 999
  holes = new Map<number, boolean>();
  size: number;
  constructor(x: number, y: number, holes: number[], public board?: Board, rotation = 0, color = "green") {
    super(x, y, holes.length, 1, color)
    this.gravity = true
    this.size = holes.length
    this.collision = true
    this.collisionMask = [new MaskPoint(0, 0, 1, 1), new MaskPoint(1, 0, 1, 1), new MaskPoint(1, 1, 1, 1), new MaskPoint(0, 1, 1, 1)]
    this.calculateMaskPoints()
    this.maxSection = this.size
    if(rotation) this.rotate(rotation)
    setTimeout(() => this.addScrews(holes, board!), 0)
  }
  addScrews(holes: number[], board: Board) {
    holes.map((hole, i) => {
      if(!hole) return
      const holeCenter = calculateMidPoint([this.LI, this.RI, this.RF, this.LF], this.size, i+1)
      this.holes.set(i, false)
      if(hole == 2) {
      const LI = new Point(holeCenter[0] - 0.2, holeCenter[1] - 0.2)
        board?.push(new Screw(LI.x, LI.y, board, this, i))
        this.holes.set(i, true)
      }
    })
  }
  draw(ctx: CanvasRenderingContext2D) {
    super.draw(ctx)
    ctx.fillStyle = "yellow"
    for(const key of this.holes.keys()) {
      const [midX, midY] = calculateMidPoint([this.LI, this.RI, this.RF, this.LF], this.size, key+1)
      ctx.beginPath()
      ctx.arc(midX * PIXEL_SIZE, midY * PIXEL_SIZE, 0.2 * PIXEL_SIZE, 0, 2*Math.PI)
      ctx.closePath()
      ctx.fill()
    }
  }
  rotate(grades: number, index?: number, rotCx?: number, rotCy?: number) {
    if(!index) index = Math.round(this.size / 2)
    super.rotate(grades, index, rotCx, rotCy)
  }

  applyGravity(board: Board): boolean {
    const screws: number[] = []
    this.holes.forEach((_, i) => {
      if(this.holes.get(i)) screws.push(i)
    })
    const screwCount = screws.length
    if(screwCount == 0) return super.applyGravity(board)
    if(screwCount > 1) return true
    const degrees = this.calculateAbsoluteRotation()
    const index = screws[0] + 1
    if(toPrecision(degrees, 2) % 90 == 0 && (index == Math.round(this.size/2))) return true
    const [midX] = calculateMidPoint([this.LI, this.RI, this.RF, this.LF], this.size, index)
    const [midAbsX] = calculateMidPoint([this.LI, this.RI, this.RF, this.LF])
    if(toPrecision(degrees, 2) % 90 == 0 && (toPrecision(midAbsX, 2) == toPrecision(midX, 2))) return true
    const rotationSign = midAbsX > midX ? -1 : 1
    this.rotate(rotationSign*ROTATION_SPEED, index)
    const col = this.detectCollision(board)
    if(col[0]) {
      this.rotate(-rotationSign*ROTATION_SPEED, index)
      return true
    }
    return true
  }
}