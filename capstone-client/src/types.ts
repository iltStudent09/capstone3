export type UserRole = 'adjuster' | 'admin'
export type PolicyType = 'auto' | 'home' | 'life'
export type PolicyStatus = 'active' | 'expired' | 'cancelled'
export type ClaimStatus = 'submitted' | 'under-review' | 'approved' | 'denied' | 'closed'

export interface User {
  _id: string
  name: string
  email: string
  role: UserRole
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export interface Policy {
  _id: string
  policyNumber: string
  holderName: string
  type: PolicyType
  premium: number
  status: PolicyStatus
  effectiveDate: string
  expirationDate: string
  owner: string | User
  createdAt: string
  updatedAt: string
}

export interface ClaimNote {
  _id: string
  author: string | User
  text: string
  createdAt: string
  updatedAt?: string
}

export interface Claim {
  _id: string
  claimNumber: string
  policy: string | Policy
  description: string
  incidentDate: string
  amount: number
  status: ClaimStatus
  assignedTo?: string | User
  notes: ClaimNote[]
  createdAt: string
  updatedAt: string
}

export interface StatusCount {
  _id: string
  count: number
}

export interface DashboardStats {
  totalClaims: number
  claimsByStatus: StatusCount[]
  totalPolicies: number
  totalUsers: number
  recentClaims: Claim[]
  totalClaimAmount: number
}

export interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export interface PaginatedResponse<T> {
  message: string
  data: T[]
  pagination: Pagination
}

export interface DashboardResponse {
  message: string
  data: DashboardStats
}

export interface ResourceResponse<T> {
  message: string
  data: T
}

export interface AuthMeResponse {
  message: string
  user: User
}

export interface ClaimInput {
  policy: string
  description: string
  incidentDate: string
  amount: number
}

export interface PolicyInput {
  policyNumber: string
  holderName: string
  type: PolicyType
  premium: number
  status: PolicyStatus
  effectiveDate: string
  expirationDate: string
}

export interface ApiErrorDetail {
  field: string
  message: string
}

export interface ApiErrorResponse {
  error: string
  details?: ApiErrorDetail[]
}
