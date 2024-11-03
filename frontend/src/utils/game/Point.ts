export class Point {
  constructor(public x: number, public y: number) {}
}

export class MaskPoint extends Point {
  constructor(public x: number, public y: number, public section: number, public prevSection: number, public curve = false) {
    super(x, y)
  }
}