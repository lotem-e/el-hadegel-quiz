// Quiz.tsx - one statement at a time. Picking an answer briefly highlights
// it and auto-advances; a back link lets you revisit and change answers.
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import LikertScale from '../components/LikertScale'
import ProgressBar from '../components/ProgressBar'
import type { Question } from '../content/types'
import type { Answer } from '../engine/scoring'

interface QuizProps {
  questions: Question[]
  onFinish: (answers: Answer[]) => void
}

export default function Quiz({ questions, onFinish }: QuizProps) {
  const [index, setIndex] = useState(0)
  // One slot per question; null = not answered yet.
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  // While the short "selected" highlight plays we ignore extra clicks.
  const [pending, setPending] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  // If the component unmounts mid-highlight, cancel the pending timer.
  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const question = questions[index]

  function handleSelect(value: number) {
    if (pending) return
    const nextAnswers = answers.map((answer, i) => (i === index ? value : answer))
    setAnswers(nextAnswers)
    setPending(true)
    timerRef.current = window.setTimeout(() => {
      setPending(false)
      if (index + 1 < questions.length) {
        setIndex(index + 1)
      } else {
        // Build the final Answer list. Every slot is filled by now because
        // advancing only happens after a selection.
        const finished: Answer[] = []
        questions.forEach((q, i) => {
          const value = nextAnswers[i]
          if (value != null) finished.push({ questionId: q.id, pillarId: q.pillarId, value })
        })
        onFinish(finished)
      }
    }, 250)
  }

  return (
    <>
      <Header />
      <main className="mx-auto max-w-xl px-4 py-8">
        <ProgressBar current={index + 1} total={questions.length} />
        <div className="mt-6 rounded-xl border border-line bg-white p-6 shadow-sm sm:p-8">
          {/* min height keeps the card from jumping between short and long statements */}
          <p className="min-h-24 text-xl font-bold leading-snug text-navy sm:text-2xl">
            {question.text}
          </p>
          <div className="mt-6">
            <LikertScale value={answers[index]} onSelect={handleSelect} disabled={pending} />
          </div>
        </div>
        {index > 0 && (
          <button
            type="button"
            onClick={() => setIndex(index - 1)}
            className="mt-4 text-sm text-muted transition-colors hover:text-navy"
          >
            חזרה לשאלה הקודמת
          </button>
        )}
      </main>
    </>
  )
}
