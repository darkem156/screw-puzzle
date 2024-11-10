import { levels } from "../utils/game/levels";

export function Levels({ setShowLevels, setPlaying, setCurrentLevel }: { setShowLevels: (show: boolean) => void, setPlaying: (playing: boolean) => void, setCurrentLevel: (level: number) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <button onClick={() => setShowLevels(false)}>Back</button>
      <h1>Levels</h1>
      <div className="flex gap-4">
        { levels.map((_, index) =>
          <div className="" key={index}>
            <button onClick={() => { setCurrentLevel(index); setPlaying(true) }}>Level {index+1}</button>
          </div>) }
      </div>
    </div>
  )
}