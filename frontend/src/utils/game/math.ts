import { Circle } from './objects';
import { MaskPoint, Point } from './Point';

export const toPrecision = (num: number, precision: number = 2) => Number(num.toFixed(precision));

// Function to check if two segments (p1, q1) and (p2, q2) intersect
function doIntersect(p1: Point, q1: Point, p2: Point, q2: Point): [boolean, number, number] {
  const minXP1 = Math.min(p1.x, q1.x)
  const maxXP1 = Math.max(p1.x, q1.x)
  const minXP2 = Math.min(p2.x, q2.x)
  const maxXP2 = Math.max(p2.x, q2.x)

  if(minXP1 > maxXP2 || minXP2 > maxXP1) return [false, -1, -1]

  const minYP1 = Math.min(p1.y, q1.y)
  const maxYP1 = Math.max(p1.y, q1.y)
  const minYP2 = Math.min(p2.y, q2.y)
  const maxYP2 = Math.max(p2.y, q2.y)

  if(minYP1 > maxYP2 || minYP2 > maxYP1) return [false, -1, -1]

  const x1 = toPrecision(q1.x, 2) !== toPrecision(p1.x, 2) && toPrecision(q1.y, 2) !== toPrecision(p1.y, 2) ? (q1.y - p1.y)/(q1.x - p1.x) : 0;
  const x2 = toPrecision(q2.x, 2) !== toPrecision(p2.x, 2) && toPrecision(q2.y, 2) !== toPrecision(p2.y, 2) ? (q2.y - p2.y)/(q2.x - p2.x) : 0;
  const b1 = p1.y - x1*p1.x
  const b2 = p2.y - x2*p2.x

  if(x1 == x2 && toPrecision(b1, 2) != toPrecision(b2, 2)) return [true, q1.x, b1]

  if(p1.x == q1.x) {
    console.log('x1 is 0')
    const intersecttionX = p1.x
    const intersecttionY = x2*intersecttionX+b2
    if(maxYP1 < intersecttionY || minYP1 > intersecttionY) return [false, -1, -1]
    else return [true, intersecttionX, intersecttionY]
  }

  const intersecttionX = (b1-b2)/(-x1+x2)
  if(intersecttionX < minXP1 || intersecttionX > maxXP1 || intersecttionX < minXP2 || intersecttionX > maxXP2) return [false, -1, -1]

  return [true, intersecttionX, intersecttionX*x1+b1];
}

// Main function to check if any segment of one object intersects with any segment of the other
export function masksIntersect(mask1: Point[], mask2: Point[]): number[][] | [] {
  const n1 = mask1.length;
  const n2 = mask2.length;
  const intersections = []

  // Create the segments of the first polygon
  for (let i = 0; i < n1; i++) {
    const p1 = mask1[i];
    // Connect the last point with the first
    const q1 = mask1[(i + 1) % n1];

    // Create the segments of the second polygon
    for (let j = 0; j < n2; j++) {
      const p2 = mask2[j];
      // Connect the last point with the first
      const q2 = mask2[(j + 1) % n2];

      // Verify if the segments intersect
      const intersect = doIntersect(p1, q1, p2, q2);
      if (intersect[0]) {
        intersections.push([intersect[1], intersect[2]]);
      }
    }
  }
  return intersections; // There is no intersection
}

export function pointInPolygon(x: number, y: number, mask: Point[]): boolean {
    const p1 = new MaskPoint(0, y, 1, 1)
    const p2 = new MaskPoint(x, y, 1, 1)
    const col1 = masksIntersect([p1, p2], mask)
    const p3 = new MaskPoint(x, 0, 1, 1)
    const p4 = new MaskPoint(x, y, 1, 1)
    const col2 = masksIntersect([p3, p4], mask)
    return col1.length == 2 && col2.length == 2
}

  function solveQuadratic(a: number, b: number, c: number) {
    const discriminant = b**2 - 4 * a * c;
    
    if (discriminant < 0) {
        return [-1, -1];
    }
    
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const x1 = (-b + sqrtDiscriminant) / (2 * a);
    const x2 = (-b - sqrtDiscriminant) / (2 * a);
    
    return [x1, x2];
  }

export function maskAndCircleIntersect(mask: MaskPoint[], circle: Circle): number[][] {
  const intersections: number[][] = []

  const minX = Math.min(circle.LI.x, circle.RI.x, circle.LF.x, circle.RF.x)
  const maxX = Math.max(circle.LI.x, circle.RI.x, circle.LF.x, circle.RF.x)

  const maskMinX = Math.min(...mask.map(point => point.x))
  const maskMaxX = Math.max(...mask.map(point => point.x))
  
  if(maskMaxX < minX || maskMinX > maxX) return []

  const maskMinY = Math.min(...mask.map(point => point.y))
  const maxY = Math.max(circle.LI.y, circle.RI.y, circle.LF.y, circle.RF.y)
  if(maskMinY > maxY) return []

  const [midX, midY] = calculateMidPoint([circle.LF, circle.LI, circle.RI, circle.RF], circle.maxSection)

  for (let i = 0; i < mask.length; i++) {
    const p1 = mask[i];
    // Connect the last point with the first
    const q1 = mask[(i + 1) % mask.length];
    // ax
    const x1 = toPrecision(q1.x, 2) !== toPrecision(p1.x, 2) && toPrecision(q1.y, 2) !== toPrecision(p1.y, 2) ? (q1.y - p1.y)/(q1.x - p1.x) : 0;
    // b
    const b1 = p1.y - x1*p1.x

    const a = -1 - x1**2
    const b = 2*midX - 2 * x1*(b1-midY)
    const c = -((b1 - midY)**2 - circle.radius**2 + midX**2)
    const [x_1, x2] = solveQuadratic(a, b, c)
    const minX = Math.min(p1.x, q1.x)
    const maxX = Math.max(p1.x, q1.x)
    if(toPrecision(minX) < toPrecision(x_1) && toPrecision(maxX) > toPrecision(x_1)) intersections.push([x_1, x_1*x1+b1])
    if(toPrecision(minX) < toPrecision(x2) && toPrecision(maxX) > toPrecision(x2)) intersections.push([x2, x2*x1+b1])
  }

  return intersections;
}

export function calculateMidPoint(points: Point[], sections = 1, index = 1): [number, number] {
  const numPoints = points.length;
  const h = Math.sqrt((points[1].x-points[0].x)**2 + (points[1].y-points[0].y)**2)
  const slope = (points[1].y-points[0].y)/(points[1].x-points[0].x)
  const condition = points[1].x >= points[0].x ? 1 : -1
  const radians = Math.atan(slope)
  const co = Math.sin(radians) * h/sections
  const ca = Math.cos(radians) * h/sections
  const firstPoint = {x: points[0].x + condition* ca * (index-1), y: points[0].y + condition * co * (index-1)}
  const secondPoint = {x: points[0].x + condition* ca * index, y: points[0].y + condition * co * index}
  const thirdPoint = {x: points[3].x + condition* ca * (index-1), y: points[3].y + condition * co * (index-1)}
  const fourthPoint = {x: points[3].x + condition* ca * index, y: points[3].y + condition * co * index}

  const newPoints = [firstPoint, secondPoint, thirdPoint, fourthPoint]

  const sum = newPoints.reduce((acc: number[], point: Point) => {
      acc[0] += point.x;
      acc[1] += point.y;
      return acc;
  }, [0, 0]);

  const midX = sum[0] / numPoints;
  const midY = sum[1] / numPoints;

  return [midX, midY];
}

export function rotatePoint(point: number[], radians: number, center: number[]): {x: number, y: number} {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  const x = point[0] - center[0];
  const y = point[1] - center[1];
  return {
    x: cos * x + sin * y + center[0],
    y: -sin * x + cos * y + center[1]
  };
}