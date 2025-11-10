
import React, { useState } from 'react';
import { HelpIcon } from './icons.tsx';

export const HelpTooltip: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white"
      >
        <HelpIcon />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl p-4 z-10">
          <h3 className="font-bold text-white mb-2">使い方</h3>
          <p className="text-sm text-gray-300">
            これはサーバーレスのDAWです。あなたの音楽はすべてURLに保存されます。
            「プロジェクトを共有」ボタンをクリックして、あなたの作品へのユニークなリンクを取得してください。
            すべてがブラウザで、無料で、永遠に実行されます。
          </p>
        </div>
      )}
    </div>
  );
};