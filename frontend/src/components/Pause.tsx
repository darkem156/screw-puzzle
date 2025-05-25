import { useEffect, useState } from "react";
import Timer from "./Timer";

export default function Pause({currentLevel, setResetKey, resetKey, setPlaying, setCurrentLevel, win, setWin}: {currentLevel: number, setResetKey: (key: number) => void, resetKey: number, setPlaying: (playing: boolean) => void, setCurrentLevel: (level: number | ((current: number) => number)) => void, win: boolean, setWin: (win: boolean) => void}) {
  const [timeLeft, setTimeLeft] = useState(30)
  const [pause, setPause] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  useEffect(() => {
    const interval = setInterval(() => {
      if (pause || win) {
        clearInterval(interval)
        return
      }
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(interval)
          setGameOver(true)
          return 0
        }
         return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [pause, win, gameOver])
  return (
    <>
    <div className="flex justify-between">
      {/*<button onClick={() => setResetKey(Number(!resetKey))}>Reload</button>
      <button onClick={() => setPlaying(false)}>Back</button>*/}
        <Timer timeLeft={timeLeft} key={currentLevel} pause={pause} win={win} setGameOver={setGameOver} />
        <p className="text-2xl"><b>Level:</b> <span className="font-extrabold">{currentLevel+1}</span></p>
        <button className="bg-none bg-[#48c2e7]" onClick={() => setPause(true)}><i className="bi bi-pause text-black text-2xl"></i></button>
    </div>
    {
      pause &&
    <div className="flex flex-col items-center justify-center top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50 fixed z-50">
      <div className="flex flex-col items-center justify-center h-fit w-fit p-5 bg-[#2563eb] rounded-lg shadow-lg text-center gap-4">
        <h1 className="text-2xl font-semibold mb-4">Game Paused</h1>
        <p className="mb-4">Click the button below to resume playing.</p>
        <button onClick={() => {
          setResetKey(Number(!resetKey))
          setTimeLeft(30)
          setPause(false)
        }}>Restart</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        onClick={() => setPause(false)}>
          Resume Game
        </button>
        {
          currentLevel > 0 &&
        <button className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors"
        onClick={() => {
          setCurrentLevel(currentLevel - 1)
          setTimeLeft(30)
          setPause(false)
        }}>
          Previous Level
        </button>
        }
        <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors"
        onClick={() => setPlaying(false)}>
          Back to Menu
        </button>
      </div>
    </div>
    }
    {
      gameOver &&
    <div className="flex flex-col items-center justify-center top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50 fixed z-50">
      <div className="flex flex-col items-center justify-center h-fit w-fit p-5 bg-[#2563eb] rounded-lg shadow-lg text-center gap-4">
        <h1 className="text-2xl font-semibold mb-4">Game Over</h1>
        <p className="mb-4">You have run out of time!</p>
        <button onClick={() => {
          setResetKey(Number(!resetKey))
          setTimeLeft(30)
          setGameOver(false)
        }}>Restart</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        onClick={() => setPlaying(false)}>
          Back to Menu
        </button>
      </div>
    </div>
    }
    {
      win &&
    <div className="flex flex-col items-center justify-center top-0 bottom-0 left-0 right-0 bg-black bg-opacity-50 fixed z-50">
      <div className="flex flex-col items-center justify-center h-fit w-fit p-5 bg-[#2563eb] rounded-lg shadow-lg text-center gap-4">
        <h1 className="text-2xl font-semibold mb-4">Congratulations!</h1>
        <p className="mb-4">You have completed the level!</p>
        <button onClick={() => {
          setCurrentLevel(currentLevel + 1)
          setWin(false)
          setTimeLeft(30)
        }}>Next Level</button>
        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        onClick={() => setPlaying(false)}>
          Back to Menu
        </button>
      </div>
    </div>
    }
    </>
  )
}