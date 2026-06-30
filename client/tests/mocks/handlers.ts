import { http, HttpResponse } from 'msw'

export const sampleQuiz = {
  id: 'quiz-1',
  title: 'Test Quiz',
  description: '',
  defaultTimeLimit: 20,
  lobbyImageUrl: null as string | null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  questions: [
    {
      id: 'q-1',
      text: 'Who wrote Romans?',
      imageUrl: null,
      timeLimit: 20,
      options: [
        { index: 0, text: 'Peter' },
        { index: 1, text: 'Paul' },
        { index: 2, text: 'John' },
        { index: 3, text: 'James' },
      ],
      correctIndex: 1,
    },
  ],
}

export const handlers = [
  http.get('/api/quizzes', () => HttpResponse.json([
    { id: 'quiz-1', title: 'Test Quiz', questionCount: 1, updatedAt: '2026-01-01T00:00:00Z' }
  ])),

  http.get('/api/quizzes/:id', () => HttpResponse.json(sampleQuiz)),

  http.post('/api/quizzes', async ({ request }) => {
    const body = await request.json() as { title: string }
    return HttpResponse.json({ ...sampleQuiz, id: 'new-quiz', title: body.title }, { status: 201 })
  }),

  http.put('/api/quizzes/:id', async ({ request }) => {
    const body = await request.json() as object
    return HttpResponse.json({ ...sampleQuiz, ...body })
  }),

  http.delete('/api/quizzes/:id', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/quizzes/:id/duplicate', () =>
    HttpResponse.json({ ...sampleQuiz, id: 'dup-quiz', title: 'Test Quiz (複製)' }, { status: 201 })
  ),

  http.post('/api/quizzes/:id/questions', async ({ request }) => {
    const body = await request.json() as object
    return HttpResponse.json({ ...sampleQuiz.questions[0], ...body, id: 'new-q' }, { status: 201 })
  }),

  http.put('/api/quizzes/:id/questions/:idx', async ({ request }) => {
    const body = await request.json() as object
    return HttpResponse.json({ ...sampleQuiz.questions[0], ...body })
  }),

  http.delete('/api/quizzes/:id/questions/:idx', () => new HttpResponse(null, { status: 204 })),

  http.post('/api/quizzes/:id/questions/reorder', () => HttpResponse.json(sampleQuiz)),

  http.get('/api/network', () => HttpResponse.json({ localIP: '192.168.1.1', port: 3001 })),

  http.post('/api/upload', () => HttpResponse.json({ url: '/uploads/test.png', filename: 'test.png' }, { status: 201 })),

  http.delete('/api/upload/:filename', () => new HttpResponse(null, { status: 204 })),
]
