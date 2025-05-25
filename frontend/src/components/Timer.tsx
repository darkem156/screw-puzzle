import { useEffect, useState } from "react"

export default function Timer({timeLeft}: {pause: boolean, setGameOver: (gameOver: boolean) => void, win: boolean, timeLeft: number}) {
  const [timeLeftText, setTimeLeftText] = useState("")

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    setTimeLeftText(formattedTime)
  }, [timeLeft])

  return (
    <p>{ timeLeftText }</p>
  )
}