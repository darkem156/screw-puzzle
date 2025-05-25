import Game from "./components/Game"
import { createLevel, levels } from "./utils/game/levels"
import { Levels } from "./components/Levels"
import Pause from "./components/Pause"
import { useState } from "react"

function App() {
  const [playing, setPlaying] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const [currentLevel, setCurrentLevel] = useState(0)
  const [showLevels, setShowLevels] = useState(false)
  const [win, setWin] = useState(false)

  return (
    <>
      <main className="
        p-8 select-none bg-gradient-to-tr from-blue-900 to-blue-600 w-screen h-screen text-white flex items-center justify-center
        [&_button]:![outline:none] [&_button]:text-black
      ">
        { playing ?
          <div className="flex flex-col gap-4">
            <Pause win={win} setWin={setWin} currentLevel={currentLevel} setResetKey={setResetKey} resetKey={resetKey} setPlaying={setPlaying} setCurrentLevel={setCurrentLevel} />
            {
              currentLevel < levels.length
              ? <Game setWin={setWin} key={resetKey} levelName={(currentLevel+1).toString()} board={createLevel(levels[currentLevel])} setCurrentLevel={setCurrentLevel} />
                : <div className="flex flex-col gap-4">
                    <h1 className="text-2xl font-semibold text-center">Congratulations! You finished the game</h1>
                    <div className="flex gap-4">
                      <button onClick={() => setCurrentLevel(0)}>Play level 1</button>
                      <button onClick={() => {
                        setPlaying(false)
                        setShowLevels(true)
                      }}>Select another level</button>
                    </div>
                  </div>
            }
          </div>
          : showLevels
            ? <Levels setShowLevels={setShowLevels} setPlaying={setPlaying} setCurrentLevel={setCurrentLevel} />
            : <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-center">Screw Puzzle</h1>
                <button className="duration-200 transition-all hover:scale-110 font-bold text-lg px-8"
                onClick={() => {
                  setPlaying(true)
                  if(currentLevel >= levels.length) setCurrentLevel(levels.length-1)
                }}>Play level {Math.min(currentLevel+1, levels.length)}</button>
                <button className="font-semibold py-2" onClick={() => setShowLevels(true)}>Select level</button>
              </div> }
      </main>  
    </>
  )
}

export default App
