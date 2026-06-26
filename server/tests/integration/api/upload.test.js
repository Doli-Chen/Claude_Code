const request = require('supertest');
const path = require('path');
const fs = require('fs');
const os = require('os');

let app;
let TEST_UPLOAD_DIR;

beforeAll(() => {
  TEST_UPLOAD_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'upload-test-'));
  process.env.UPLOAD_DIR = TEST_UPLOAD_DIR;
  jest.resetModules();
  app = require('../../../src/app');
});

afterAll(() => {
  fs.rmSync(TEST_UPLOAD_DIR, { recursive: true, force: true });
});

describe('Upload API', () => {
  it('POST /api/upload - uploads a valid image', async () => {
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const res = await request(app)
      .post('/api/upload')
      .attach('image', pngBuffer, { filename: 'test.png', contentType: 'image/png' });

    expect(res.status).toBe(201);
    expect(res.body.url).toMatch(/^\/uploads\//);
    expect(res.body.filename).toBeTruthy();

    const uploadedPath = path.join(TEST_UPLOAD_DIR, res.body.filename);
    expect(fs.existsSync(uploadedPath)).toBe(true);

    return res.body.filename;
  });

  it('POST /api/upload - rejects non-image file type', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('image', Buffer.from('not an image'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
  });

  it('POST /api/upload - returns 400 with no file', async () => {
    const res = await request(app).post('/api/upload');
    expect(res.status).toBe(400);
  });

  it('DELETE /api/upload/:filename - 404 for nonexistent file', async () => {
    const res = await request(app).delete('/api/upload/nonexistent.png');
    expect(res.status).toBe(404);
  });

  it('DELETE /api/upload/:filename - deletes an existing file', async () => {
    const testFile = path.join(TEST_UPLOAD_DIR, 'todelete.png');
    fs.writeFileSync(testFile, 'dummy');
    const res = await request(app).delete('/api/upload/todelete.png');
    expect(res.status).toBe(204);
    expect(fs.existsSync(testFile)).toBe(false);
  });
});
