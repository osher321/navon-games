import confetti from 'canvas-confetti'

export function fireConfetti() {
  const colors = ['#ffab00', '#ff2d82', '#0aa8f0', '#12cc65', '#7226f5']
  confetti({
    particleCount: 90,
    spread: 75,
    origin: { y: 0.6 },
    colors,
    startVelocity: 38,
  })
  setTimeout(() => {
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.7 },
      colors,
    })
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.7 },
      colors,
    })
  }, 200)
}

export function fireBigConfetti() {
  const end = Date.now() + 900
  const colors = ['#ffab00', '#ff2d82', '#0aa8f0', '#12cc65', '#7226f5']
  ;(function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0 }, colors })
    confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1 }, colors })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}
