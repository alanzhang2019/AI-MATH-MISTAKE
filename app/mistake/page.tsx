'use client';

import { useEffect, useMemo, useState } from 'react';

type ExtractResponse = {
  success: true;
  extraction: {
    problemText: string;
    studentAnswer?: string;
    correctAnswerCandidate?: string;
    confidence: number;
    needsUserConfirmation: boolean;
  };
};

type AnalyzeResponse = {
  diagnosis: {
    guessedMistake: string;
    explanationForChild: string;
    practiceSuggestions: Array<{ prompt: string; answer: string }>;
    parentSummary?: {
      headline: string;
      nextStep: string;
    };
  };
};

type PageStatus = 'idle' | 'extracting' | 'confirming' | 'analyzing' | 'done' | 'error';

export default function MistakePage() {
  const [image, setImage] = useState<File | null>(null);
  const [problemText, setProblemText] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [status, setStatus] = useState<PageStatus>('idle');
  const [error, setError] = useState('');
  const [diagnosis, setDiagnosis] = useState<AnalyzeResponse['diagnosis'] | null>(null);

  const previewUrl = useMemo(() => {
    if (!image) {
      return null;
    }

    return URL.createObjectURL(image);
  }, [image]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function handleExtract() {
    if (!image) {
      setError('请先上传图片');
      setStatus('error');
      return;
    }

    setStatus('extracting');
    setError('');
    setDiagnosis(null);

    const formData = new FormData();
    formData.set('image', image);
    formData.set('subject', 'math');

    const response = await fetch('/api/mistake/session/extract', {
      method: 'POST',
      body: formData,
    });
    const json = (await response.json()) as ExtractResponse | { error?: string };

    if (!response.ok || !('extraction' in json)) {
      setStatus('error');
      setError(json.error ?? '图片提取失败');
      return;
    }

    setProblemText(json.extraction.problemText);
    setStudentAnswer(json.extraction.studentAnswer ?? '');
    setCorrectAnswer(json.extraction.correctAnswerCandidate ?? '');
    setStatus('confirming');
  }

  async function handleAnalyze() {
    setStatus('analyzing');
    setError('');

    const response = await fetch('/api/mistake/session/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        grade: 4,
        subject: 'math',
        source: 'photo',
        problemText,
        studentAnswer: studentAnswer || undefined,
        correctAnswer: correctAnswer || undefined,
      }),
    });
    const json = (await response.json()) as AnalyzeResponse | { error?: string };

    if (!response.ok || !('diagnosis' in json)) {
      setStatus('error');
      setError(json.error ?? '错题诊断失败');
      return;
    }

    setDiagnosis(json.diagnosis);
    setStatus('done');
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 720 }}>
      <h1>AI 错题讲解机</h1>
      <p>拍一张单题图片，先识别题面并确认，再进入现有的错因诊断与讲解链路。</p>

      <input
        accept="image/*"
        type="file"
        onChange={(event) => {
          setImage(event.target.files?.[0] ?? null);
          setStatus('idle');
          setError('');
          setDiagnosis(null);
        }}
      />

      {previewUrl ? (
        <img
          alt="待识别题目预览"
          src={previewUrl}
          style={{ maxWidth: 360, borderRadius: 8, border: '1px solid #ddd' }}
        />
      ) : null}

      <button disabled={status === 'extracting' || !image} onClick={handleExtract} type="button">
        {status === 'extracting' ? '识别中...' : '识别题目'}
      </button>

      {(status === 'confirming' || status === 'analyzing' || status === 'done') && (
        <section style={{ display: 'grid', gap: 8 }}>
          <label>
            题干
            <textarea
              rows={4}
              value={problemText}
              onChange={(event) => setProblemText(event.target.value)}
            />
          </label>
          <label>
            学生答案
            <input value={studentAnswer} onChange={(event) => setStudentAnswer(event.target.value)} />
          </label>
          <label>
            正确答案候选
            <input value={correctAnswer} onChange={(event) => setCorrectAnswer(event.target.value)} />
          </label>
          <button
            disabled={status === 'analyzing' || problemText.trim().length === 0}
            onClick={handleAnalyze}
            type="button"
          >
            {status === 'analyzing' ? '诊断中...' : '确认并诊断'}
          </button>
        </section>
      )}

      {error ? <p>{error}</p> : null}

      {diagnosis ? (
        <section style={{ display: 'grid', gap: 8 }}>
          <p>错因：{diagnosis.guessedMistake}</p>
          <p>讲解：{diagnosis.explanationForChild}</p>
          {diagnosis.parentSummary ? <p>家长提示：{diagnosis.parentSummary.headline}</p> : null}
          <ul>
            {diagnosis.practiceSuggestions.map((item) => (
              <li key={item.prompt}>
                {item.prompt}（答案：{item.answer}）
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
