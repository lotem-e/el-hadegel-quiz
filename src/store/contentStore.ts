// contentStore.ts - the app's single source of quiz content at runtime.
//
// Strategy: start from the BAKED content (ships inside the code, always
// available), then try to refresh from Supabase. If the fetch succeeds the
// live content replaces the baked copy - so admin edits reach visitors
// without redeploying. If it fails (offline, misconfigured), the baked
// content keeps the site fully functional.
import { PILLARS as BAKED_PILLARS } from '../content/pillars'
import { BASE_QUESTIONS } from '../content/questions'
import { DEFAULT_QUOTAS, PIN_FLAG_THRESHOLD, PIN_FLAG_URL } from '../content/quizConfig'
import type { Pillar, PillarId, Question } from '../content/types'
import { supabase } from '../lib/supabaseClient'

export interface QuizContent {
  pillars: Pillar[]
  questions: Question[]
  quotas: Record<PillarId, number>
  /** Derived: how many questions a visitor will actually be asked */
  quizLength: number
  pinFlagThreshold: number
  pinFlagUrl: string
}

/**
 * The quiz length is not stored - it is what the mix yields. A pillar can
 * never contribute more than the questions it actually has, so we count
 * what is achievable rather than what was requested; that keeps the number
 * shown to visitors honest even if the pool shrank.
 */
function deriveQuizLength(
  pillars: Pillar[],
  questions: Question[],
  quotas: Record<PillarId, number>,
): number {
  return pillars.reduce((total, pillar) => {
    const available = questions.filter((q) => q.pillarId === pillar.id && q.active).length
    return total + Math.min(quotas[pillar.id] ?? 0, available)
  }, 0)
}

function bakedContent(): QuizContent {
  const quotas = { ...DEFAULT_QUOTAS }
  return {
    pillars: BAKED_PILLARS,
    questions: BASE_QUESTIONS,
    quotas,
    quizLength: deriveQuizLength(BAKED_PILLARS, BASE_QUESTIONS, quotas),
    pinFlagThreshold: PIN_FLAG_THRESHOLD,
    pinFlagUrl: PIN_FLAG_URL,
  }
}

let current: QuizContent = bakedContent()

export function getContent(): QuizContent {
  return current
}

// The in-flight (or finished) refresh, so callers can wait for the live
// content instead of racing it. Starting the quiz awaits this: without it a
// visitor who clicks before the fetch resolves would get the baked copy,
// which drifts further from reality with every admin publish.
let refreshPromise: Promise<void> | null = null

/**
 * Pull the latest PUBLISHED snapshot from Supabase and swap it in.
 * Visitors never see the admin's draft - only what was explicitly
 * published. Safe to fire-and-forget: any failure leaves the baked
 * content in place. Repeat calls share the first fetch.
 */
export function refreshContent(): Promise<void> {
  if (!refreshPromise) refreshPromise = fetchPublished()
  return refreshPromise
}

async function fetchPublished(): Promise<void> {
  if (!supabase) return
  try {
    const { data, error } = await supabase
      .from('published_content')
      .select('content')
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error || !data?.content) return
    const snapshot = data.content as {
      pillars?: Array<Record<string, unknown>>
      questions?: Array<Record<string, unknown>>
      config?: Record<string, unknown>
    }
    if (!snapshot.pillars?.length || !snapshot.questions?.length || !snapshot.config) return

    const pillars: Pillar[] = snapshot.pillars.map((row) => ({
      id: row.id as PillarId,
      title: row.title as string,
      short: row.short as string,
      description: row.description as string,
      sourceUrl: row.source_url as string,
      // Snapshots published before the sources feature lack this field.
      sources: (row.sources as Pillar['sources'] | undefined) ?? [],
    }))
    const pillarIds = new Set(pillars.map((p) => p.id))
    const quotas = Object.fromEntries(
      snapshot.pillars.map((row) => [row.id, row.quota]),
    ) as Record<PillarId, number>
    // Ignore questions pointing at unknown pillars - defensive.
    const questions: Question[] = snapshot.questions
      .filter((row) => pillarIds.has(row.pillar_id as PillarId))
      .map((row) => ({
        id: row.id as string,
        pillarId: row.pillar_id as PillarId,
        text: row.text as string,
        active: row.active as boolean,
        // Snapshots published before the pinned feature lack this field.
        pinned: (row.pinned as boolean | undefined) ?? false,
        sourceUrl: row.source_url as string,
        sourceLabel: row.source_label as string,
      }))

    current = {
      pillars,
      questions,
      quotas,
      quizLength: deriveQuizLength(pillars, questions, quotas),
      pinFlagThreshold: snapshot.config.pin_flag_threshold as number,
      pinFlagUrl: snapshot.config.pin_flag_url as string,
    }
  } catch {
    // Network or parsing problem - keep whatever content we already have.
  }
}
