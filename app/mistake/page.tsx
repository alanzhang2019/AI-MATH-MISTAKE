export default function MistakePage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>AI 错题讲解机</h1>
      <p>当前为 MVP：先支持文本录题的错因诊断、儿童化讲解与同类题验证。</p>
      <p>接口：POST /api/mistake/session/analyze</p>
    </main>
  );
}
