import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  convertQuote,
  createQuote,
  deleteQuote,
  getQuote,
  listQuotes,
  markQuoteAccepted,
  markQuoteRejected,
  markQuoteSent,
  reopenQuote,
  updateQuote,
  type ConvertQuotePayload,
  type QuoteCreatePayload,
  type QuoteListQuery,
  type QuoteUpdatePayload,
} from './api'

const quotesKey = (q: QuoteListQuery) => ['quotes', q] as const
const quoteKey = (id: number) => ['quotes', id] as const

export function useQuotes(query: QuoteListQuery) {
  return useQuery({
    queryKey: quotesKey(query),
    queryFn: () => listQuotes(query),
    staleTime: 30_000,
  })
}

export function useQuote(id: number | undefined) {
  return useQuery({
    queryKey: id ? quoteKey(id) : ['quotes', 'none'],
    queryFn: () => getQuote(id as number),
    enabled: !!id,
  })
}

export function useCreateQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuoteCreatePayload) => createQuote(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useUpdateQuote(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: QuoteUpdatePayload) => updateQuote(id, payload),
    onSuccess: (q) => {
      qc.setQueryData(quoteKey(id), q)
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useDeleteQuote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteQuote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useMarkQuoteSent(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markQuoteSent(id),
    onSuccess: (q) => {
      qc.setQueryData(quoteKey(id), q)
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useMarkQuoteAccepted(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markQuoteAccepted(id),
    onSuccess: (q) => {
      qc.setQueryData(quoteKey(id), q)
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useMarkQuoteRejected(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => markQuoteRejected(id),
    onSuccess: (q) => {
      qc.setQueryData(quoteKey(id), q)
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useReopenQuote(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => reopenQuote(id),
    onSuccess: (q) => {
      qc.setQueryData(quoteKey(id), q)
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })
}

export function useConvertQuote(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ConvertQuotePayload) => convertQuote(id, payload),
    onSuccess: ({ quote }) => {
      qc.setQueryData(quoteKey(id), quote)
      qc.invalidateQueries({ queryKey: ['quotes'] })
      qc.invalidateQueries({ queryKey: ['charges'] })
      qc.invalidateQueries({ queryKey: ['cash-sessions'] })
    },
  })
}
