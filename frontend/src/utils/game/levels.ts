import * as objectsRegistry from "./objects";

export const levels = [
  `[
    ["Hole", [1, 1]],
    ["Bar", [3, 4, [0, 2, 2], "board"]]
  ]`,
  [
    ["Hole", [1, 1]],
    ["Hole", [2, 1]],
    ["Hole", [6, 3]],
    ["Bar", [1, 3, [2, 0, 2], "board", -45]],
    ["Bar", [1, 6, [0, 2, 2], "board"]],
    ["Bar", [5, 2, [2, 0, 1], "board"]]
  ],
  [
    ["Hole", [3, 4]],
    ["Bar", [1, 1, [2, 0, 2], "board"]],
  ]
]

type objectParams = (string | number | number[])[]

export function createLevel(objectsRaw: (string | (string | (string | number | number[])[])[][])) {
  const board = new objectsRegistry.Board()
  const objects = typeof objectsRaw === "string" ? JSON.parse(objectsRaw) : objectsRaw
  objects.map((obj: [string, objectParams]) => {
    const Class = objectsRegistry[obj[0] as keyof typeof objectsRegistry]
    const params = obj[1].map((param: string | number[] | number) => param === 'board' ? board : param)
    const instance = new Class(...params as [arg0: number, y: number, arg2: never, arg3: objectsRegistry.Board & number & number[] & objectsRegistry.Bar, arg4?: (number & number[]) | undefined, color?: number[] | undefined])
    if(instance instanceof objectsRegistry.Board) return 
    board.push(instance)
  })
  return board
}
