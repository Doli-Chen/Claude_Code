import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import HomePage from '../../../src/pages/HomePage'

const mockSocket = vi.hoisted(() => ({
  auth: {} as Record<string, unknown>,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  once: vi.fn(),
}))

vi.mock('../../../src/socket', () => ({ socket: mockSocket }))
vi.mock('../../../src/services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    createGame: vi.fn(),
  },
}))

function renderHomePage() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/design/:quizId" element={<div>Design Page</div>} />
        <Route path="/host/:gameCode" element={<div>Host Page</div>} />
        <Route path="/display/:gameCode" element={<div>Display Page</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('HomePage', () => {
  it('renders the page header', () => {
    renderHomePage()
    expect(screen.getByText('聖經問答遊戲')).toBeInTheDocument()
  })

  it('shows loading initially', () => {
    renderHomePage()
    expect(screen.getByText('載入中...')).toBeInTheDocument()
  })

  it('shows quiz list after loading', async () => {
    renderHomePage()
    await waitFor(() => expect(screen.getByText('Test Quiz')).toBeInTheDocument())
  })

  it('shows question count for quiz', async () => {
    renderHomePage()
    await waitFor(() => expect(screen.getByText('1 題')).toBeInTheDocument())
  })

  it('shows empty state when no quizzes', async () => {
    server.use(http.get('/api/quizzes', () => HttpResponse.json([])))
    renderHomePage()
    await waitFor(() => expect(screen.getByText('尚未建立題庫')).toBeInTheDocument())
  })

  it('new quiz button is disabled when input is empty', () => {
    renderHomePage()
    const btn = screen.getByRole('button', { name: '新增題庫' })
    expect(btn).toBeDisabled()
  })

  it('navigates to design page after creating quiz', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await user.type(screen.getByLabelText('新題庫名稱'), 'My New Quiz')
    await user.click(screen.getByRole('button', { name: '新增題庫' }))
    await waitFor(() => expect(screen.getByText('Design Page')).toBeInTheDocument())
  })

  it('navigates to design page on edit button click', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByRole('button', { name: '編輯' }))
    await waitFor(() => expect(screen.getByText('Design Page')).toBeInTheDocument())
  })

  it('display button is disabled when input is empty', async () => {
    renderHomePage()
    const btn = screen.getByRole('button', { name: '開啟顯示' })
    expect(btn).toBeDisabled()
  })
})
