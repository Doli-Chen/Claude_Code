import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import HomePage from '../../../src/pages/HomePage'
import { socketService } from '../../../src/services/socketService'

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

beforeEach(() => { vi.clearAllMocks() })

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

  it('clicking 刪除 shows confirm buttons', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByRole('button', { name: '刪除題庫' }))
    expect(screen.getByText('確定刪除？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '確認刪除' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
  })

  it('clicking 取消 after 刪除 hides confirm', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByRole('button', { name: '刪除題庫' }))
    await user.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByText('確定刪除？')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: '刪除題庫' })).toBeInTheDocument()
  })

  it('confirming delete removes quiz from list', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByRole('button', { name: '刪除題庫' }))
    await user.click(screen.getByRole('button', { name: '確認刪除' }))
    await waitFor(() => expect(screen.queryByText('Test Quiz')).not.toBeInTheDocument())
  })

  it('clicking 複製 adds duplicated quiz to list', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByRole('button', { name: '複製題庫' }))
    await waitFor(() => expect(screen.getByText('Test Quiz (複製)')).toBeInTheDocument())
  })

  it('clicking quiz title shows an input for rename', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByText('Test Quiz'))
    expect(screen.getByRole('textbox', { name: '題庫名稱' })).toBeInTheDocument()
  })

  it('pressing Escape cancels rename without saving', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByText('Test Quiz'))
    const input = screen.getByRole('textbox', { name: '題庫名稱' })
    await user.clear(input)
    await user.type(input, 'Should Not Save')
    await user.keyboard('{Escape}')
    expect(screen.getByText('Test Quiz')).toBeInTheDocument()
    expect(screen.queryByRole('textbox', { name: '題庫名稱' })).not.toBeInTheDocument()
  })

  it('pressing Enter saves the new title', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByText('Test Quiz'))
    const input = screen.getByRole('textbox', { name: '題庫名稱' })
    await user.clear(input)
    await user.type(input, 'Renamed Quiz')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByText('Renamed Quiz')).toBeInTheDocument())
    expect(screen.queryByRole('textbox', { name: '題庫名稱' })).not.toBeInTheDocument()
  })

  it('clicking 開始遊戲 connects socket and calls createGame', async () => {
    const user = userEvent.setup()
    renderHomePage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByRole('button', { name: '開始遊戲' }))
    expect(mockSocket.connect).toHaveBeenCalled()
    expect(mockSocket.once).toHaveBeenCalledWith('host:game_created', expect.any(Function))
    expect(socketService.createGame).toHaveBeenCalledWith('quiz-1')
  })
})
