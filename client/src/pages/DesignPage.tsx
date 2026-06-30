import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { quizApi } from '../services/quizApi'
import { QuestionEditor } from '../components/design/QuestionEditor'
import { ImageUploader } from '../components/design/ImageUploader'
import type { Quiz, Question } from '../types/quiz'

function emptyQuestion(defaultTimeLimit = 20): Omit<Question, 'id'> {
  return {
    text: '',
    imageUrl: null,
    timeLimit: defaultTimeLimit,
    options: [
      { index: 0, text: '', imageUrl: null },
      { index: 1, text: '', imageUrl: null },
      { index: 2, text: '', imageUrl: null },
      { index: 3, text: '', imageUrl: null },
    ],
    correctIndex: 0,
  }
}

function SortableItem({ id, label, selected, onClick }: { id: string; label: string; selected: boolean; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onClick}
      className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer border ${selected ? 'bg-indigo-50 border-indigo-400' : 'bg-white border-gray-200 hover:bg-gray-50'}`}
    >
      <span {...attributes} {...listeners} className="text-gray-400 cursor-grab">☰</span>
      <span className="text-sm text-gray-700 flex-1 truncate">{label || '（無題目文字）'}</span>
    </div>
  )
}

export default function DesignPage() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [selectedIdx, setSelectedIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [pendingQuestion, setPendingQuestion] = useState<Omit<Question, 'id'> | null>(null)

  useEffect(() => {
    if (!quizId) return
    quizApi.get(quizId).then(setQuiz).catch(() => navigate('/'))
  }, [quizId, navigate])

  const saveQuestion = useCallback(async (idx: number, updates: Partial<Question>) => {
    if (!quiz || !quizId) return
    setSaving(true)
    try {
      const updated = await quizApi.updateQuestion(quizId, idx, updates)
      setQuiz((q) => {
        if (!q) return q
        const questions = [...q.questions]
        questions[idx] = updated
        return { ...q, questions }
      })
    } finally {
      setSaving(false)
    }
  }, [quiz, quizId])

  function addQuestion() {
    if (!quiz || !quizId) return
    setPendingQuestion(emptyQuestion(quiz.defaultTimeLimit))
    setSelectedIdx(quiz.questions.length)
  }

  async function commitPendingQuestion() {
    if (!quiz || !quizId || !pendingQuestion) return
    setSaving(true)
    try {
      const saved = await quizApi.addQuestion(quizId, pendingQuestion)
      const newIdx = quiz.questions.length
      setQuiz((prev) => prev ? { ...prev, questions: [...prev.questions, saved] } : prev)
      setSelectedIdx(newIdx)
      setPendingQuestion(null)
    } finally {
      setSaving(false)
    }
  }

  async function handleLobbyImageUpdate(url: string | null) {
    if (!quiz || !quizId) return
    setSaving(true)
    try {
      await quizApi.update(quizId, { lobbyImageUrl: url })
      setQuiz((q) => q ? { ...q, lobbyImageUrl: url } : q)
    } finally {
      setSaving(false)
    }
  }

  async function deleteQuestion(idx: number) {
    if (!quiz || !quizId) return
    await quizApi.deleteQuestion(quizId, idx)
    const questions = quiz.questions.filter((_, i) => i !== idx)
    setQuiz({ ...quiz, questions })
    setSelectedIdx(Math.min(idx, questions.length - 1))
  }

  function handleSelectQuestion(idx: number) {
    setPendingQuestion(null)
    setSelectedIdx(idx)
  }

  async function handleDragEnd(event: { active: { id: string }; over: { id: string } | null }) {
    if (!quiz || !quizId || !event.over) return
    const ids = quiz.questions.map((q) => q.id)
    const oldIndex = ids.indexOf(event.active.id)
    const newIndex = ids.indexOf(event.over.id)
    if (oldIndex === newIndex) return
    const reordered = await quizApi.reorderQuestions(quizId, oldIndex, newIndex)
    setQuiz(reordered)
    setSelectedIdx(newIndex)
  }

  if (!quiz) return <div className="p-8 text-gray-500">載入中...</div>

  const isPending = pendingQuestion !== null && selectedIdx === quiz.questions.length
  const currentQ = isPending
    ? ({ ...pendingQuestion, id: '__pending__' } as Question)
    : quiz.questions[selectedIdx]
  const canSavePending = Boolean(pendingQuestion?.text || pendingQuestion?.imageUrl)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-indigo-900 text-white px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')} className="text-white/70 hover:text-white">← 返回</button>
        <h1 className="font-bold text-lg flex-1 truncate">{quiz.title}</h1>
        {saving && <span className="text-white/60 text-sm">儲存中...</span>}
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r flex flex-col overflow-y-auto">
          <div className="p-3 border-b flex flex-col gap-3">
            <button
              onClick={addQuestion}
              disabled={quiz.questions.length >= 256 || isPending}
              className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
              aria-label="新增題目"
            >
              + 新增題目
            </button>
            <div role="region" aria-label="等待畫面圖片上傳">
              <p className="text-xs font-medium text-gray-500 mb-1">等待畫面圖片</p>
              <ImageUploader
                imageUrl={quiz.lobbyImageUrl}
                onUploaded={(url) => handleLobbyImageUpdate(url)}
                onRemoved={() => handleLobbyImageUpdate(null)}
              />
            </div>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd as never}>
            <SortableContext items={quiz.questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1 p-2">
                {quiz.questions.map((q, i) => (
                  <SortableItem
                    key={q.id}
                    id={q.id}
                    label={`${i + 1}. ${q.text}`}
                    selected={i === selectedIdx && !isPending}
                    onClick={() => handleSelectQuestion(i)}
                  />
                ))}
                {isPending && (
                  <div className="flex items-center gap-2 p-3 rounded-lg border bg-indigo-50 border-indigo-400">
                    <span className="text-gray-400">☰</span>
                    <span className="text-sm text-indigo-500 flex-1 italic">（新題目）</span>
                  </div>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </aside>

        <main className="flex-1 overflow-y-auto">
          {currentQ ? (
            <div>
              <div className="p-4 border-b bg-white flex items-center justify-between">
                <span className="text-gray-600 text-sm">
                  {isPending ? '新題目' : `第 ${selectedIdx + 1} 題`}
                </span>
                {isPending ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setPendingQuestion(null)}
                      className="text-gray-400 text-sm hover:underline"
                    >
                      取消
                    </button>
                    <button
                      onClick={commitPendingQuestion}
                      disabled={!canSavePending || saving}
                      className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                    >
                      儲存題目
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => deleteQuestion(selectedIdx)}
                    className="text-red-500 text-sm hover:underline"
                    aria-label="刪除題目"
                  >
                    刪除
                  </button>
                )}
              </div>
              <QuestionEditor
                question={currentQ}
                onChange={
                  isPending
                    ? (updates) => setPendingQuestion((prev) => prev ? { ...prev, ...updates } : prev)
                    : (updates) => saveQuestion(selectedIdx, updates)
                }
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              點擊「新增題目」開始出題
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
