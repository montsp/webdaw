import React, { useState } from 'react';
import type { SessionData } from '../types';

interface DeployModalProps {
  sessionData: SessionData;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ sessionData, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleGenerateAndDownload = async () => {
    setStatus('generating');
    setErrorMessage('');
    try {
      const response = await fetch(window.location.origin + '/index.html');
      if (!response.ok) {
        throw new Error(`HTMLの取得に失敗しました: ${response.statusText}`);
      }
      let htmlContent = await response.text();
      const injectedScript = `<script>window.INITIAL_SESSION_DATA = ${JSON.stringify(sessionData)};</script>`;
      htmlContent = htmlContent.replace('</head>', `  ${injectedScript}\n  </head>`);
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error: any) {
      console.error('デプロイ用HTMLの生成に失敗しました:', error);
      setErrorMessage(error.message || '不明なエラーが発生しました。');
      setStatus('error');
    }
  };
  
  React.useEffect(() => {
      const handleEsc = (event: KeyboardEvent) => {
         if (event.key === 'Escape') {
            onClose();
         }
      };
      window.addEventListener('keydown', handleEsc);
      return () => {
          window.removeEventListener('keydown', handleEsc);
      };
  }, [onClose]);

  const getButtonText = () => {
    switch (status) {
      case 'generating': return '生成中...';
      case 'success': return 'ダウンロードしました！';
      case 'error': return '再試行';
      default: return 'HTMLを生成＆ダウンロード';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">GitHub Pagesにデプロイ</h2>
        <div className="text-gray-400 mb-4 space-y-3">
            <p>
                この機能は、プロジェクト全体を自己完結型の単一<code className="bg-gray-900 text-cyan-400 px-1 py-0.5 rounded text-sm">index.html</code>ファイルとして生成します。
            </p>
            <p>
                ダウンロードしたファイルをGitHubリポジトリにアップロードし、<a href="https://docs.github.com/ja/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">GitHub Pagesを有効化</a>することで、あなたの音楽をウェブサイトとして公開できます。
            </p>
        </div>
        <button
            onClick={handleGenerateAndDownload}
            disabled={status === 'generating' || status === 'success'}
            className="bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-md transition duration-200 w-full"
        >
          {getButtonText()}
        </button>
        {status === 'error' && <p className="text-red-400 mt-2 text-sm">{errorMessage}</p>}
        <button
          onClick={onClose}
          className="mt-6 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md w-full"
        >
          閉じる
        </button>
      </div>
    </div>
  );
};