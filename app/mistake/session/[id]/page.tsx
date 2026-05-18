'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

type SessionResponse = {
  success: true;
  session: {
    id: string;
    status: string;
    classroomId?: string;
    confirmed: {
      problemText: string;
      studentAnswer?: string;
      correctAnswer?: string;
    };
  };
};

export default function MistakeLiveSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionResponse['session'] | null>(null);
  const pollTimerRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch(`/api/mistake/session/${encodeURIComponent(sessionId)}`);
        const json = (await response.json()) as SessionResponse & { error?: string };

        if (!response.ok || !json.session) {
          throw new Error(json.error ?? '读取错题会话失败');
        }

        if (cancelled) {
          return;
        }

        setSession(json.session);
        setLoading(false);

        if (json.session.classroomId) {
          router.replace(`/classroom/${json.session.classroomId}`);
          return;
        }

        pollTimerRef.current = window.setTimeout(poll, 2000);
      } catch (err) {
        if (cancelled) {
          return;
        }

        setLoading(false);
        setError(err instanceof Error ? err.message : '读取错题会话失败');
      }
    }

    void poll();

    return () => {
      cancelled = true;
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [router, sessionId]);

  if (loading) {
    return <main style={{ padding: 24 }}>正在读取错题讲解任务...</main>;
  }

  if (error) {
    return <main style={{ padding: 24 }}>任务读取失败：{error}</main>;
  }

  return (
    <main style={{ padding: 24, display: 'grid', gap: 12 }}>
      <h1>正在准备第一段讲解</h1>
      <p>{session?.confirmed.problemText}</p>
      <p>系统已经收到你的题目，正在尽快生成第一段可播放内容。</p>
    </main>
  );
}
