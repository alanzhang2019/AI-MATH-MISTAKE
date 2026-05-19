'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { buildMistakeGenerationSession } from '@/lib/mistake/openmaic/build-generation-session';
import { createMistakeSession } from '@/lib/mistake/session/client';
import { shouldSkipConfirmation } from '@/lib/mistake/session/confidence-policy';

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

type PageStatus =
  | 'idle'
  | 'extracting'
  | 'confirming'
  | 'creating_session'
  | 'starting_preview'
  | 'error';

export default function MistakePage() {
  const router = useRouter();
  const [image, setImage] = useState<File | null>(null);
  const [problemText, setProblemText] = useState('');
  const [studentAnswer, setStudentAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [status, setStatus] = useState<PageStatus>('idle');
  const [error, setError] = useState('');
  const [lastExtraction, setLastExtraction] = useState<ExtractResponse['extraction'] | null>(null);

  const previewUrl = useMemo(() => {
    if (!image) {
      return null;
    }

    return URL.createObjectURL(image);
  }, [image]);
  const isStartingPreview = status === 'creating_session' || status === 'starting_preview';

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

    const formData = new FormData();
    formData.set('image', image);
    formData.set('subject', 'math');

    const response = await fetch('/api/mistake/session/extract', {
      method: 'POST',
      body: formData,
    });
    const json = (await response.json()) as ExtractResponse | { error?: string };
    const extractError = 'error' in json ? json.error : undefined;

    if (!response.ok || !('extraction' in json)) {
      setStatus('error');
      setError(extractError ?? '图片提取失败');
      return;
    }

    setProblemText(json.extraction.problemText);
    setStudentAnswer(json.extraction.studentAnswer ?? '');
    setCorrectAnswer(json.extraction.correctAnswerCandidate ?? '');
    setLastExtraction(json.extraction);

    if (shouldSkipConfirmation(json.extraction)) {
      await startMistakeFlow({
        extraction: json.extraction,
        problemText: json.extraction.problemText,
        studentAnswer: json.extraction.studentAnswer,
        correctAnswer: json.extraction.correctAnswerCandidate,
      });
      return;
    }

    setStatus('confirming');
  }

  async function startMistakeFlow(input: {
    extraction: ExtractResponse['extraction'];
    problemText: string;
    studentAnswer?: string;
    correctAnswer?: string;
  }) {
    setStatus('creating_session');
    setError('');

    try {
      const created = await createMistakeSession({
        source: 'photo',
        ocr: input.extraction,
        confirmed: {
          problemText: input.problemText,
          ...(input.studentAnswer ? { studentAnswer: input.studentAnswer } : {}),
          ...(input.correctAnswer ? { correctAnswer: input.correctAnswer } : {}),
        },
        status: 'draft',
      });

      setStatus('starting_preview');

      const generationSession = buildMistakeGenerationSession({
        mistakeSessionId: created.session.id,
        input: {
          grade: 4,
          subject: 'math',
          source: 'photo',
          problemText: input.problemText,
          ...(input.studentAnswer ? { studentAnswer: input.studentAnswer } : {}),
          ...(input.correctAnswer ? { correctAnswer: input.correctAnswer } : {}),
        },
      });
      sessionStorage.setItem('generationSession', JSON.stringify(generationSession));

      router.push('/generation-preview');
    } catch (flowError) {
      setStatus('error');
      setError(flowError instanceof Error ? flowError.message : '进入讲解失败');
    }
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 16, maxWidth: 720 }}>
      <h1>AI 错题讲解机</h1>
      <p>拍照或上传一道题，系统会尽快把你带到讲解播放页。</p>

      <input
        accept="image/*"
        capture="environment"
        type="file"
        onChange={(event) => {
          setImage(event.target.files?.[0] ?? null);
          setStatus('idle');
          setError('');
          setLastExtraction(null);
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
        {status === 'extracting' ? '识别中...' : '拍照识题'}
      </button>

      {status === 'confirming' && (
        <section style={{ display: 'grid', gap: 12 }}>
          <label style={{ display: 'grid', gap: 6 }}>
            题干
            <textarea
              aria-label="题干"
              rows={4}
              value={problemText}
              onChange={(event) => setProblemText(event.target.value)}
              style={{ width: '100%', minHeight: 112, padding: 10, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            学生答案
            <input
              aria-label="学生答案"
              value={studentAnswer}
              onChange={(event) => setStudentAnswer(event.target.value)}
              style={{ width: '100%', padding: 10, boxSizing: 'border-box' }}
            />
          </label>
          <label style={{ display: 'grid', gap: 6 }}>
            正确答案候选
            <input
              aria-label="正确答案候选"
              value={correctAnswer}
              onChange={(event) => setCorrectAnswer(event.target.value)}
              style={{ width: '100%', padding: 10, boxSizing: 'border-box' }}
            />
          </label>
          <button
            disabled={isStartingPreview || problemText.trim().length === 0}
            onClick={() => {
              if (!lastExtraction) {
                setStatus('error');
                setError('题目识别结果已丢失，请重新拍照');
                return;
              }

              void startMistakeFlow({
                extraction: lastExtraction,
                problemText,
                studentAnswer: studentAnswer || undefined,
                correctAnswer: correctAnswer || undefined,
              });
            }}
            type="button"
            style={{ justifySelf: 'start', padding: '10px 16px' }}
          >
            {isStartingPreview ? '正在进入讲解...' : '开始讲解'}
          </button>
        </section>
      )}

      {error ? <p>{error}</p> : null}
    </main>
  );
}
