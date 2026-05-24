'use client';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [config, setConfig] = useState({ provider: 'siliconflow-tts', voice: 'alex' });

  useEffect(() => {
    fetch('/api/admin/config').then(res => res.json()).then(setConfig);
  }, []);

  const handleSave = async () => {
    await fetch('/api/admin/config', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    alert('Saved!');
  };

  return (
    <div className="bg-white p-6 rounded shadow">
      <h2 className="text-xl font-bold mb-4">Global TTS Settings</h2>
      <div className="space-y-4 max-w-md">
        <div>
          <label className="block mb-1">Provider</label>
          <select className="w-full p-2 border rounded" value={config.provider} onChange={e => setConfig({...config, provider: e.target.value})}>
            <option value="siliconflow-tts">SiliconFlow</option>
            <option value="openai-tts">OpenAI</option>
          </select>
        </div>
        <div>
          <label className="block mb-1">Voice</label>
          <input className="w-full p-2 border rounded" value={config.voice} onChange={e => setConfig({...config, voice: e.target.value})} />
        </div>
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save Config</button>
      </div>
    </div>
  );
}
