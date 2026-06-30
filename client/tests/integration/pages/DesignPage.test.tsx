import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { http, HttpResponse } from 'msw'
import { server } from '../../mocks/server'
import { sampleQuiz } from '../../mocks/handlers'
import DesignPage from '../../../src/pages/DesignPage'

function renderDesignPage(quizId = 'quiz-1') {
  return render(
    <MemoryRouter initialEntries={[`/design/${quizId}`]}>
      <Routes>
        <Route path="/design/:quizId" element={<DesignPage />} />
        <Route path="/" element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('DesignPage', () => {
  it('shows loading state initially', () => {
    renderDesignPage()
    expect(screen.getByText('載入中...')).toBeInTheDocument()
  })

  it('renders quiz title after loading', async () => {
    renderDesignPage()
    await waitFor(() => expect(screen.getByText('Test Quiz')).toBeInTheDocument())
  })

  it('shows the add question button', async () => {
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    expect(screen.getByLabelText('新增題目')).toBeInTheDocument()
  })

  it('shows existing question in sidebar', async () => {
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    // question text appears in both sidebar and editor, so use getAllBy
    expect(screen.getAllByText(/Who wrote Romans/).length).toBeGreaterThan(0)
  })

  it('shows editor and pending sidebar item immediately when 新增題目 is clicked', async () => {
    const user = userEvent.setup()
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByLabelText('新增題目'))
    // Editor and pending item must appear before any API call
    expect(screen.getByText('（新題目）')).toBeInTheDocument()
    expect(screen.getByLabelText('題目文字')).toBeInTheDocument()
    expect(screen.getByText('儲存題目')).toBeInTheDocument()
  })

  it('disables 儲存題目 until question text is entered', async () => {
    const user = userEvent.setup()
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByLabelText('新增題目'))
    expect(screen.getByText('儲存題目')).toBeDisabled()
    await user.type(screen.getByLabelText('題目文字'), '彼得是誰?')
    expect(screen.getByText('儲存題目')).not.toBeDisabled()
  })

  it('calls POST API and removes pending state after 儲存題目 is clicked', async () => {
    const user = userEvent.setup()
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByLabelText('新增題目'))
    await user.type(screen.getByLabelText('題目文字'), '彼得是誰?')
    await user.click(screen.getByText('儲存題目'))
    await waitFor(() => {
      expect(screen.queryByText('（新題目）')).not.toBeInTheDocument()
      expect(screen.queryByText('儲存題目')).not.toBeInTheDocument()
    })
  })

  it('navigates to home when back button is clicked', async () => {
    const user = userEvent.setup()
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByText('← 返回'))
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument())
  })

  it('redirects to home if quiz not found', async () => {
    server.use(
      http.get('/api/quizzes/:id', () => new HttpResponse(null, { status: 404 }))
    )
    renderDesignPage('nonexistent')
    await waitFor(() => expect(screen.getByText('Home')).toBeInTheDocument(), { timeout: 3000 })
  })

  it('renders lobby image upload section', async () => {
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    expect(screen.getByRole('region', { name: '等待畫面圖片上傳' })).toBeInTheDocument()
    expect(screen.getByText('等待畫面圖片')).toBeInTheDocument()
  })

  it('uploads lobby image and saves via PUT', async () => {
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))

    const section = screen.getByRole('region', { name: '等待畫面圖片上傳' })
    const fileInput = section.querySelector('input[type="file"]')!
    const file = new File(['img'], 'banner.png', { type: 'image/png' })
    Object.defineProperty(fileInput, 'files', { value: [file], configurable: true })
    fireEvent.change(fileInput)

    await waitFor(() => {
      expect(within(section).getByAltText('題目圖片')).toHaveAttribute('src', '/uploads/test.png')
    })
  })

  it('clicking an existing question in sidebar selects it and clears pending', async () => {
    const user = userEvent.setup()
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    // Open a pending new question
    await user.click(screen.getByLabelText('新增題目'))
    expect(screen.getByText('（新題目）')).toBeInTheDocument()
    // Click the existing question in the sidebar
    await user.click(screen.getAllByText(/Who wrote Romans/)[0])
    // Pending item should be gone, editor should show the existing question
    expect(screen.queryByText('（新題目）')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Who wrote Romans/).length).toBeGreaterThan(0)
  })

  it('clicking 刪除 removes the current question', async () => {
    const user = userEvent.setup()
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))
    await user.click(screen.getByLabelText('刪除題目'))
    await waitFor(() => {
      expect(screen.queryByText(/Who wrote Romans/)).not.toBeInTheDocument()
    })
  })

  it('removes lobby image and saves via PUT', async () => {
    server.use(
      http.get('/api/quizzes/:id', () =>
        HttpResponse.json({ ...sampleQuiz, lobbyImageUrl: '/uploads/existing.png' })
      )
    )
    renderDesignPage()
    await waitFor(() => screen.getByText('Test Quiz'))

    const section = screen.getByRole('region', { name: '等待畫面圖片上傳' })
    const removeBtn = within(section).getByLabelText('移除圖片')
    await userEvent.setup().click(removeBtn)

    await waitFor(() => {
      expect(within(section).queryByAltText('題目圖片')).not.toBeInTheDocument()
    })
  })
})
