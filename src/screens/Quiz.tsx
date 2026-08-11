// Quiz.tsx - one statement at a time. Picking an answer briefly highlights
// it and auto-advances; a back link lets you revisit and change answers.
//
// Two things make it feel like movement rather than a slideshow: each
// statement slides in, and the number keys 1-5 answer directly, so a
// keyboard user never reaches for the mouse.
import { useEffect, useRef, useState } from 'react'
import Header from '../components/Header'
import LikertScale, { LIKERT_OPTIONS } from '../components/LikertScale'
import ProgressBar from '../components/ProgressBar'
import type { Question } from '../content/types'
import type { Answer } from '../engine/scoring'
import { p, useGender } from '../lib/gender'

interface QuizProps {
  questions: Question[]
  onFinish: (answers: Answer[]) => void
}

export default function Quiz({ questions, onFinish }: QuizProps) {
  const { g } = useGender()
  const [index, setIndex] = useState(0)
  // One slot per statement; null = not answered yet.
  const [answers, setAnswers] = useState<(number | null)[]>(() => questions.map(() => null))
  // While the short "selected" highlight plays we ignore extra input.
  const [pending, setPending] = useState(false)
  const timerRef = useRef<number | undefined>(undefined)

  // If the component unmounts mid-highlight, cancel the pending timer.
  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const question = questions[index]

  // Defensive: an empty mix would otherwise crash on the first render.
  if (!question) {
    return (
      <>
        <Header />
        <main className="mx-auto max-w-xl px-4 py-16 text-center text-muted">
          {g(p('השאלון אינו זמין כרגע. נסו שוב מאוחר יותר.', 'השאלון אינו זמין כרגע. נסה/י שוב מאוחר יותר.'))}
        </main>
      </>
    )
  }

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
        // Every slot is filled by now, because advancing only happens
        // after a selection.
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
      <main className="mx-auto max-w-xl px-4 py-6 sm:py-8">
        <ProgressBar
          current={index + 1}
          total={questions.length}
          onBack={() => setIndex(index - 1)}
          canGoBack={index > 0}
        />
        {/* key on the index restarts the entrance animation per statement */}
        <div
          key={index}
          className="slide-in mt-5 rounded-xl border border-line bg-white p-5 shadow-sm sm:mt-6 sm:p-8"
        >
          {/* Fixed height, so the card and the answers below it never move
              between statements. The text starts at the top and grows down
              into the space, rather than shifting as it gets longer. */}
          <div className="flex h-56 items-start overflow-y-auto">
            <p className="text-base font-semibold leading-relaxed text-navy sm:text-xl">
              {g(question.text)}
            </p>
          </div>
          <div className="mt-5 sm:mt-6">
            <LikertScale
              value={answers[index]}
              onSelect={handleSelect}
              disabled={pending}
              enableKeyboard
            />
          </div>
        </div>
        <p className="mt-6 hidden text-center text-xs text-muted sm:block">
          אפשר גם במקלדת: {LIKERT_OPTIONS.length}-1
        </p>
      </main>
    </>
  )
}
