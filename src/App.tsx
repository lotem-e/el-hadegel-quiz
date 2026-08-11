// App.tsx - the top-level component: tiny hash router + the quiz flow.
//
// Routing: we use the URL "hash" (the part after #). '#/admin' shows the
// backoffice; anything else shows the public quiz. Hash routing needs no
// server configuration, so the site can be hosted as plain static files
// and '#/admin' still works after a refresh.
import { useEffect, useState } from 'react'
import AuthGate from './components/AuthGate'
import Admin from './screens/Admin'
import Landing from './screens/Landing'
import Quiz from './screens/Quiz'
import Results from './screens/Results'
import type { Question } from './content/types'
import type { Answer } from './engine/scoring'
import { scoreAnswers } from './engine/scoring'
import { selectQuizQuestions } from './engine/selectQuestions'
import { supabase } from './lib/supabaseClient'
import { getContent, refreshContent } from './store/contentStore'
import { getSeenStatements, rememberStatements } from './store/seenStatements'

/** Tracks window.location.hash and re-renders when it changes */
function useHashRoute(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

// The quiz flow is a tiny state machine: landing -> quiz -> results.
// `nonce` grows on every new quiz and is used as the Quiz key, which forces
// React to rebuild the component (fresh answers) for each fresh selection.
type Phase =
  | { name: 'landing' }
  | { name: 'quiz'; questions: Question[]; nonce: number }
  | { name: 'results'; answers: Answer[]; nonce: number }

export default function App() {
  const route = useHashRoute()
  const [phase, setPhase] = useState<Phase>({ name: 'landing' })
  const [starting, setStarting] = useState(false)

  // Pull the live content from Supabase once at startup. Until it lands
  // (or if it fails) the baked-in content keeps everything working.
  useEffect(() => {
    void refreshContent()
  }, [])

  // The browser tab should say which of the two screens you are on.
  useEffect(() => {
    document.title = route.startsWith('#/admin')
      ? 'אל הדגל | שאלון ההתאמה | ממשק ניהול'
      : 'אל הדגל | שאלון ההתאמה'
  }, [route])

  if (route.startsWith('#/admin')) {
    return (
      <AuthGate>
        <Admin />
      </AuthGate>
    )
  }

  async function startQuiz(nonce: number) {
    // Wait for the published content before composing, so a fast click never
    // gets the baked fallback. Never hang on it though: after a short grace
    // period we start with whatever we have.
    setStarting(true)
    await Promise.race([
      refreshContent(),
      new Promise((resolve) => window.setTimeout(resolve, 2500)),
    ])
    setStarting(false)
    const content = getContent()
    // Prefer statements this visitor has not met yet, so "another round"
    // genuinely shows them something new.
    const questions = selectQuizQuestions(content.questions, content.quotas, getSeenStatements())
    rememberStatements(questions.map((question) => question.id))
    setPhase({ name: 'quiz', questions, nonce })
  }

  function finishQuiz(answers: Answer[], nonce: number) {
    // Record the anonymous result. Fire-and-forget: the visitor's flow
    // never waits on (or breaks because of) the network.
    if (supabase) {
      const score = scoreAnswers(answers)
      void supabase
        .from('results')
        .insert({ total_percent: score.totalPercent, by_pillar: score.byPillar, answers })
        .then(undefined, () => {})
    }
    setPhase({ name: 'results', answers, nonce })
  }

  switch (phase.name) {
    case 'landing':
      return <Landing onStart={() => void startQuiz(1)} busy={starting} />
    case 'quiz':
      return (
        <Quiz
          key={phase.nonce}
          questions={phase.questions}
          onFinish={(answers) => finishQuiz(answers, phase.nonce)}
        />
      )
    case 'results':
      return <Results answers={phase.answers} onRestart={() => void startQuiz(phase.nonce + 1)} />
  }
}
