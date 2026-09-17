import type { Claim, ClaimNote, ClaimStatus, Policy, PolicyStatus, User } from '../types'

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)

export const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

export const formatStatusLabel = (status: ClaimStatus | PolicyStatus | string) =>
  status
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')

export const makeProgressWidth = (value: number, max: number) => {
  if (max <= 0 || value <= 0) {
    return 0
  }

  return Math.max(8, (value / max) * 100)
}

export const formatPolicySummary = (policyNumber: string, holderName: string) =>
  `${policyNumber} · ${holderName}`

export const getPolicyId = (policy: Claim['policy'] | Policy) =>
  typeof policy === 'string' ? policy : policy._id

export const getPolicySummary = (policy: Claim['policy'] | Policy) => {
  if (typeof policy === 'string') {
    return policy
  }

  return formatPolicySummary(policy.policyNumber, policy.holderName)
}

export const getUserName = (user: string | User) =>
  typeof user === 'string' ? user : user.name

export const getClaimNoteAuthorName = (note: ClaimNote) => getUserName(note.author)