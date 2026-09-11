import type { GameDef } from '../types'
import GameCard from './GameCard'

interface GameGridProps {
  games: GameDef[]
  hrefFor?: (game: GameDef) => string
}

export default function GameGrid({ games, hrefFor }: GameGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {games.map((game) => (
        <GameCard key={game.id} game={game} href={hrefFor?.(game)} />
      ))}
    </div>
  )
}
