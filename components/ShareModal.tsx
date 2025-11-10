import React, { useState, useEffect } from 'react';

interface ShareModalProps {
  url: string;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ url, onClose }) => {
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess('コピーしました！');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('コピーに失敗しました。');
    }
  };
  
  useEffect(() => {
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 shadow-xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4 text-white">作品を共有</h2>
        <p className="text-gray-400 mb-4">
          このURLをコピーしてプロジェクトを共有します。すべての音楽データはリンクに直接保存されます！
        </p>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            readOnly
            value={url}
            className="w-full bg-gray-900 text-gray-300 border border-gray-700 rounded-md p-2 text-sm"
          />
          <button
            onClick={copyToClipboard}
            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200 w-full sm:w-auto"
          >
            {copySuccess || 'URLをコピー'}
          </button>
        </div>
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