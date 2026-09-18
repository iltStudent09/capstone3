import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import ProtectedRoute from '../components/ProtectedRoute'
import Navbar from '../components/layout/Navbar'
import { useAuth } from '../context/AuthContext'
import LoginPage from '../pages/LoginPage'

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const mockUseAuth = vi.mocked(useAuth)

describe('React component tests', () => {
  beforeEach(() => {
    mockUseAuth.mockReset()
  })

  it('Login page renders email and password fields', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('Navbar renders navigation links and the app name', () => {
    mockUseAuth.mockReturnValue({
      user: {
        _id: 'user-1',
        name: 'Jon Snow',
        email: 'jon@example.com',
        role: 'admin',
        createdAt: '2026-09-18T00:00:00.000Z',
        updatedAt: '2026-09-18T00:00:00.000Z',
      },
      token: 'token',
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    )

    expect(screen.getByText('Policy Claims Tracker')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Claims' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Policies' })).toBeInTheDocument()
  })

  it('Protected routes redirect unauthenticated users', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      loading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    })

    render(
      <MemoryRouter initialEntries={['/claims']}>
        <Routes>
          <Route path="/login" element={<div>Login screen</div>} />
          <Route element={<ProtectedRoute />}>
            <Route path="/claims" element={<div>Claims screen</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByText('Claims screen')).not.toBeInTheDocument()
  })
})