import { useEffect, useMemo, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  ChevronRight,
  Plus,
  Shuffle,
  Undo2,
  RefreshCcw,
  Trophy,
  X,
} from 'lucide-react'

const COLOR_CHOICES = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#ec4899',
  '#a855f7',
]

const TOTAL_CARDS = 120

const sortPlayersByName = (players) => {
  return [...players].sort((a, b) => a.name.localeCompare(b.name))
}

const shuffleDeck = (cards) => {
  const copy = [...cards]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

const createInitialDeck = () => {
  const numberCards = Array.from({ length: 100 }, (_, index) => ({
    id: `n-${index + 1}`,
    type: 'number',
    value: index + 1,
    label: `${index + 1}`,
  }))

  const plusOneCards = Array.from({ length: 10 }, (_, index) => ({
    id: `p1-${index + 1}`,
    type: 'plus1',
    value: '+1',
    label: '+1',
  }))

  const plusTwoCards = Array.from({ length: 10 }, (_, index) => ({
    id: `p2-${index + 1}`,
    type: 'plus2',
    value: '+2',
    label: '+2',
  }))

  return shuffleDeck([...numberCards, ...plusOneCards, ...plusTwoCards])
}

const randomBrightHex = (reservedColors) => {
  const reserved = new Set(reservedColors.map((color) => color.toLowerCase()))
  let attempts = 0

  while (attempts < 60) {
    const hue = Math.floor(Math.random() * 360)
    const saturation = 80
    const lightness = 58
    const chroma = (1 - Math.abs((2 * lightness) / 100 - 1)) * (saturation / 100)
    const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1))
    const m = lightness / 100 - chroma / 2

    let red = 0
    let green = 0
    let blue = 0

    if (hue < 60) {
      red = chroma
      green = x
    } else if (hue < 120) {
      red = x
      green = chroma
    } else if (hue < 180) {
      green = chroma
      blue = x
    } else if (hue < 240) {
      green = x
      blue = chroma
    } else if (hue < 300) {
      red = x
      blue = chroma
    } else {
      red = chroma
      blue = x
    }

    const rgb = [red, green, blue].map((value) =>
      Math.round((value + m) * 255),
    )
    const hex = `#${rgb
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('')}`

    if (!reserved.has(hex.toLowerCase())) {
      return hex
    }
    attempts += 1
  }

  return '#10b981'
}

const getWinner = (players) => {
  if (!players.length) {
    return null
  }

  const highestScore = Math.max(...players.map((player) => player.score))
  const winners = players.filter((player) => player.score === highestScore)

  return {
    names: winners.map((player) => player.name),
    score: highestScore,
    isTie: winners.length > 1,
  }
}

function App() {
  const [players, setPlayers] = useState([])
  const [gridClaims, setGridClaims] = useState({})
  const [deck, setDeck] = useState(() => createInitialDeck())
  const [currentCard, setCurrentCard] = useState(null)
  const [activePlayerId, setActivePlayerId] = useState(null)
  const [bonusTurnsRemaining, setBonusTurnsRemaining] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [history, setHistory] = useState([])
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState(false)
  const [winner, setWinner] = useState(null)
  const [cardAnimationTick, setCardAnimationTick] = useState(0)

  const sortedPlayers = useMemo(() => sortPlayersByName(players), [players])

  const effectiveActivePlayerId = useMemo(() => {
    if (!sortedPlayers.length) {
      return null
    }
    const stillExists = sortedPlayers.some((player) => player.id === activePlayerId)
    return stillExists ? activePlayerId : sortedPlayers[0].id
  }, [activePlayerId, sortedPlayers])

  const activePlayer = useMemo(() => {
    if (!effectiveActivePlayerId) {
      return null
    }
    return sortedPlayers.find((player) => player.id === effectiveActivePlayerId) ?? null
  }, [effectiveActivePlayerId, sortedPlayers])

  useEffect(() => {
    if (!winner) {
      return
    }

    const burst = () => {
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 45,
        origin: { y: 0.6 },
      })
    }

    burst()
    const timer = setTimeout(burst, 350)
    return () => clearTimeout(timer)
  }, [winner])

  const makeSnapshot = () => {
    return {
      players: players.map((player) => ({ ...player })),
      gridClaims: { ...gridClaims },
      deck: [...deck],
      currentCard: currentCard ? { ...currentCard } : null,
      activePlayerId: effectiveActivePlayerId,
      bonusTurnsRemaining,
      hasStarted,
      winner,
    }
  }

  const canDraw = players.length >= 2 && deck.length > 0 && !winner
  const isShuffleDisabled = hasStarted

  const handleResetGame = () => {
    setPlayers([])
    setGridClaims({})
    setDeck(createInitialDeck())
    setCurrentCard(null)
    setActivePlayerId(null)
    setBonusTurnsRemaining(0)
    setHasStarted(false)
    setHistory([])
    setWinner(null)
    setCardAnimationTick(0)
  }

  const handleShuffle = () => {
    if (isShuffleDisabled) {
      return
    }
    setDeck((previous) => shuffleDeck(previous))
    setCurrentCard(null)
    setCardAnimationTick((value) => value + 1)
  }

  const handleDrawCard = () => {
    if (players.length < 2) {
      window.alert('Add at least 2 players before drawing cards.')
      return
    }

    if (!deck.length || winner) {
      return
    }

    const actingPlayerId = effectiveActivePlayerId
    if (!actingPlayerId) {
      return
    }

    const snapshot = makeSnapshot()
    setHistory((previous) => [...previous.slice(-4), snapshot])

    const drawnCard = deck[0]
    const remainingDeck = deck.slice(1)

    const updatedPlayers = players.map((player) => {
      if (player.id === actingPlayerId) {
        return { ...player, score: player.score + 1 }
      }
      return player
    })

    let updatedGridClaims = gridClaims
    if (drawnCard.type === 'number') {
      updatedGridClaims = {
        ...gridClaims,
        [drawnCard.value]: actingPlayerId,
      }
    }

    const grantTurns =
      drawnCard.type === 'plus1' ? 1 : drawnCard.type === 'plus2' ? 2 : 0

    let nextBonusTurns = bonusTurnsRemaining + grantTurns
    let nextPlayerId = actingPlayerId

    if (nextBonusTurns > 0) {
      nextBonusTurns -= 1
    } else {
      const orderedPlayers = sortPlayersByName(updatedPlayers)
      const currentIndex = orderedPlayers.findIndex(
        (player) => player.id === actingPlayerId,
      )
      const nextIndex = (currentIndex + 1) % orderedPlayers.length
      nextPlayerId = orderedPlayers[nextIndex].id
    }

    const isGridComplete = Object.keys(updatedGridClaims).length === 100
    const isDeckComplete = remainingDeck.length === 0
    const gameWinner = isGridComplete || isDeckComplete ? getWinner(updatedPlayers) : null

    setPlayers(updatedPlayers)
    setGridClaims(updatedGridClaims)
    setDeck(remainingDeck)
    setCurrentCard(drawnCard)
    setActivePlayerId(nextPlayerId)
    setBonusTurnsRemaining(nextBonusTurns)
    setHasStarted(true)
    setWinner(gameWinner)
    setCardAnimationTick((value) => value + 1)
  }

  const handleUndo = () => {
    if (!history.length) {
      return
    }

    const lastState = history[history.length - 1]
    setHistory((previous) => previous.slice(0, -1))
    setPlayers(lastState.players)
    setGridClaims(lastState.gridClaims)
    setDeck(lastState.deck)
    setCurrentCard(lastState.currentCard)
    setActivePlayerId(lastState.activePlayerId)
    setBonusTurnsRemaining(lastState.bonusTurnsRemaining)
    setHasStarted(lastState.hasStarted)
    setWinner(lastState.winner)
    setCardAnimationTick((value) => value + 1)
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.35)_0,transparent_42%),radial-gradient(circle_at_80%_90%,rgba(234,179,8,0.22)_0,transparent_36%),linear-gradient(145deg,#031525_0%,#05213b_45%,#06223f_100%)] text-slate-50">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-white/20 bg-white/10 px-4 py-3 shadow-xl backdrop-blur-md md:px-8">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between">
          <div className="w-[128px]" aria-hidden="true" />
          <h1 className="text-center font-heading text-2xl tracking-wide text-white md:text-4xl">
            Number Game
          </h1>
          <button
            type="button"
            onClick={handleResetGame}
            className="glass-button inline-flex w-[128px] items-center justify-center gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Reset Game
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-3 pb-8 pt-24 md:px-6 lg:gap-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.85fr]">
          <section className="space-y-5">
            <div className="glass-panel p-3 sm:p-4 md:p-5">
              <div className="mb-2 flex items-center justify-between px-1">
                <h2 className="font-heading text-lg text-white/95 md:text-xl">Grid Board</h2>
                <span className="text-xs font-medium uppercase tracking-wider text-cyan-100/80 md:text-sm">
                  Claimed {Object.keys(gridClaims).length}/100
                </span>
              </div>

              <div className="grid grid-cols-10 gap-1.5">
                {Array.from({ length: 100 }, (_, index) => {
                  const row = Math.floor(index / 10)
                  const col = index % 10
                  const number = row + 1 + col * 10
                  const playerId = gridClaims[number]
                  const player = players.find((entry) => entry.id === playerId)

                  return (
                    <div
                      key={number}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-white/20 bg-white/10 text-[10px] font-semibold text-white/90 shadow-md transition-all duration-200 ease-in-out hover:scale-105 hover:bg-white/20 sm:text-xs"
                      style={{
                        backgroundColor: player?.color ?? undefined,
                      }}
                    >
                      <div className="absolute inset-0 cell-shine" />
                      <span className="relative z-10 grid h-full place-items-center drop-shadow-sm">
                        {number}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <button
                type="button"
                onClick={handleDrawCard}
                disabled={!canDraw}
                className="group relative mx-auto h-48 w-full max-w-[230px] overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-3 text-left shadow-2xl backdrop-blur-md transition-all duration-200 ease-in-out hover:scale-[1.03] hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-55"
              >
                <div className="pointer-events-none absolute left-2 top-2 h-full w-full rounded-2xl border border-white/15 bg-gradient-to-b from-white/20 to-transparent" />
                <div className="pointer-events-none absolute left-4 top-4 h-full w-full rounded-2xl border border-white/15 bg-gradient-to-b from-white/15 to-transparent" />
                <div className="relative z-10 flex h-full flex-col justify-between rounded-xl border border-white/25 bg-white/10 p-4">
                  <p className="font-heading text-2xl text-white">Cards Deck</p>
                  <p className="text-sm font-medium text-cyan-50/90">Click to open</p>
                </div>
              </button>

              <div className="glass-panel flex min-h-48 flex-col justify-between p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-heading text-lg text-white">Current Card</h3>
                  <p className="text-sm font-semibold text-cyan-100/90">
                    Cards Left: {deck.length}/{TOTAL_CARDS}
                  </p>
                </div>

                <div className="my-4 flex min-h-20 items-center justify-center">
                  {currentCard ? (
                    <div
                      key={`${currentCard.id}-${cardAnimationTick}`}
                      className="card-pop rounded-2xl border border-white/30 bg-white/20 px-8 py-5 text-3xl font-extrabold tracking-wide text-white shadow-[0_12px_35px_rgba(15,23,42,0.35)]"
                    >
                      {currentCard.label}
                    </div>
                  ) : (
                    <span className="text-sm text-cyan-100/80">Draw a card to reveal it</span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShuffle}
                    disabled={isShuffleDisabled}
                    className="glass-button inline-flex items-center gap-2 disabled:pointer-events-none disabled:opacity-45"
                  >
                    <Shuffle className="h-4 w-4" />
                    Shuffle
                  </button>
                  <span className="text-xs text-white/80">
                    Shuffle is available only before the first draw.
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <div className="glass-panel min-h-[540px] flex-1 p-4 md:p-5">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-2xl text-white">Player Score</h2>
                <span className="text-xs uppercase tracking-widest text-cyan-100/80">
                  {sortedPlayers.length} players
                </span>
              </div>

              <div className="space-y-2.5">
                {sortedPlayers.map((player) => {
                  const isActive = player.id === activePlayer?.id && !winner && players.length >= 2

                  return (
                    <div
                      key={player.id}
                      className={`rounded-xl border px-3 py-2.5 transition-all duration-200 ease-in-out ${
                        isActive
                          ? 'active-player-glow border-cyan-300/70 bg-cyan-300/15 shadow-[0_0_16px_rgba(6,182,212,0.5)]'
                          : 'border-white/20 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-3.5 w-3.5 rounded-full border border-white/70"
                            style={{ backgroundColor: player.color }}
                          />
                          <span className="font-medium text-white">{player.name}</span>
                          {isActive ? (
                            <span className="inline-flex items-center gap-0.5 text-cyan-100">
                              <ChevronRight className="h-4 w-4" />
                              Turn
                            </span>
                          ) : null}
                        </div>
                        <span className="text-lg font-bold text-white">{player.score}</span>
                      </div>
                    </div>
                  )
                })}

                {!sortedPlayers.length ? (
                  <p className="rounded-lg border border-white/20 bg-white/5 p-3 text-sm text-white/85">
                    Add players to begin. Minimum 2 players are required.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="glass-panel flex items-center justify-between gap-3 p-4">
              <button
                type="button"
                onClick={() => setIsAddPlayerOpen(true)}
                disabled={players.length >= 30}
                className="glass-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Plus className="h-4 w-4" />
                Add Player
              </button>

              <button
                type="button"
                onClick={handleUndo}
                disabled={!history.length}
                className="glass-button inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <Undo2 className="h-4 w-4" />
                Undo
              </button>
            </div>
          </section>
        </div>
      </main>

      {isAddPlayerOpen ? (
        <AddPlayerModal
          onClose={() => setIsAddPlayerOpen(false)}
          onAddPlayer={(name, color) => {
            const newPlayer = {
              id: crypto.randomUUID(),
              name,
              color,
              score: 0,
            }

            const updatedPlayers = [...players, newPlayer]
            setPlayers(updatedPlayers)

            if (!effectiveActivePlayerId) {
              setActivePlayerId(sortPlayersByName(updatedPlayers)[0].id)
            }
          }}
          players={players}
        />
      ) : null}

      {winner ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/65 px-4 backdrop-blur-md">
          <div className="glass-panel w-full max-w-lg p-6 text-center md:p-8">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full border border-amber-200/60 bg-amber-300/20 shadow-[0_0_20px_rgba(250,204,21,0.45)]">
              <Trophy className="h-7 w-7 text-amber-200" />
            </div>
            <h2 className="font-heading text-3xl text-white">Game Complete</h2>
            <p className="mt-2 text-white/90">
              {winner.isTie
                ? `Tie between ${winner.names.join(', ')}`
                : `${winner.names[0]} wins!`}
            </p>
            <p className="mt-1 text-cyan-100/90">Winning score: {winner.score}</p>

            <button
              type="button"
              onClick={handleResetGame}
              className="glass-button mt-5 inline-flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Play Again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function AddPlayerModal({ onClose, onAddPlayer, players }) {
  const reservedColors = new Set(players.map((player) => player.color.toLowerCase()))
  const firstAvailablePreset =
    COLOR_CHOICES.find((color) => !reservedColors.has(color.toLowerCase())) ??
    COLOR_CHOICES[0]

  const [name, setName] = useState('')
  const [selectedColor, setSelectedColor] = useState(firstAvailablePreset)
  const [customColor, setCustomColor] = useState(() =>
    randomBrightHex(Array.from(reservedColors)),
  )

  const handleSubmit = (event) => {
    event.preventDefault()

    if (players.length >= 30) {
      window.alert('Maximum of 30 players reached.')
      return
    }

    const trimmedName = name.trim()
    if (!trimmedName) {
      window.alert('Player name is required.')
      return
    }

    const duplicateName = players.some(
      (player) => player.name.toLowerCase() === trimmedName.toLowerCase(),
    )

    if (duplicateName) {
      window.alert('Player name must be unique.')
      return
    }

    const color = selectedColor === 'custom' ? customColor : selectedColor
    if (reservedColors.has(color.toLowerCase())) {
      window.alert('Choose a unique color for this player.')
      return
    }

    onAddPlayer(trimmedName, color)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/70 px-4 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="glass-panel w-full max-w-md space-y-4 p-5 md:p-6"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-2xl text-white">Add Player</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-white/20 bg-white/10 p-1.5 text-white transition-all duration-200 hover:bg-white/20"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block space-y-2 text-sm">
          <span className="font-medium text-cyan-50">Player Name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            className="w-full rounded-lg border border-white/25 bg-slate-900/45 px-3 py-2 text-white outline-none transition-all duration-200 placeholder:text-white/45 focus:border-cyan-300/80 focus:ring-2 focus:ring-cyan-400/30"
            placeholder="Enter name"
          />
        </label>

        <div className="space-y-2">
          <p className="text-sm font-medium text-cyan-50">Select Unique Color</p>
          <div className="grid grid-cols-4 gap-2">
            {COLOR_CHOICES.map((color) => {
              const taken = reservedColors.has(color.toLowerCase())
              const isSelected = selectedColor === color
              return (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  disabled={taken}
                  className={`relative h-11 rounded-lg border-2 transition-all duration-200 ${
                    isSelected ? 'scale-105 border-white shadow-[0_0_12px_rgba(255,255,255,0.35)]' : 'border-transparent'
                  } ${taken ? 'cursor-not-allowed opacity-30' : 'hover:scale-105'}`}
                  style={{ backgroundColor: color }}
                >
                  {taken ? (
                    <span className="absolute inset-0 grid place-items-center text-xs font-bold text-black/70">
                      Used
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>

          <div className="mt-2 rounded-lg border border-white/20 bg-white/5 p-2.5">
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-cyan-50">Custom Color</span>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(event) => {
                    setCustomColor(event.target.value)
                    setSelectedColor('custom')
                  }}
                  className="h-9 w-11 cursor-pointer rounded border border-white/25 bg-transparent"
                />
                <span className="w-20 text-xs uppercase text-white/80">{customColor}</span>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" className="glass-button w-full justify-center">
          Add Player
        </button>
      </form>
    </div>
  )
}

export default App
