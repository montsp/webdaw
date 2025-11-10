import React, { useRef } from 'react';

interface TimelineRulerProps {
    bars: number;
    currentStep: number;
    isPlaying: boolean;
    stepWidthPx: number;
    loopStartBar: number;
    loopEndBar: number;
    onLoopRangeChange: (start: number, end: number) => void;
    arrangementContainerRef: React.RefObject<HTMLDivElement>;
}

export const TimelineRuler: React.FC<TimelineRulerProps> = ({ bars, currentStep, isPlaying, stepWidthPx, loopStartBar, loopEndBar, onLoopRangeChange, arrangementContainerRef }) => {
    const totalSteps = bars * 16;
    const width = totalSteps * stepWidthPx;
    const rulerRef = useRef<HTMLDivElement>(null);
    const dragStartBar = useRef<number | null>(null);
    const autoScrollIntervalRef = useRef<number | null>(null);

    const stopAutoScroll = () => {
        if (autoScrollIntervalRef.current) {
            clearInterval(autoScrollIntervalRef.current);
            autoScrollIntervalRef.current = null;
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!rulerRef.current || !arrangementContainerRef.current) return;

        const arrangementContainer = arrangementContainerRef.current;
        const arrangementRect = arrangementContainer.getBoundingClientRect();
        const barWidth = 16 * stepWidthPx;

        const getBarFromClientX = (clientX: number) => {
            const xInContainer = clientX - arrangementRect.left;
            const absoluteX = xInContainer + arrangementContainer.scrollLeft;
            const bar = Math.floor(absoluteX / barWidth) + 1;
            return Math.max(1, Math.min(bars, bar));
        };

        const clickedBar = getBarFromClientX(e.clientX);
        
        dragStartBar.current = clickedBar;
        onLoopRangeChange(clickedBar, clickedBar);

        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (dragStartBar.current === null) return;
            moveEvent.preventDefault();

            const clientX = moveEvent.clientX;

            // Stop any existing scroll to handle the normal move first
            stopAutoScroll();

            // Update loop range based on current mouse position
            const currentBar = getBarFromClientX(clientX);
            onLoopRangeChange(dragStartBar.current, currentBar);

            // Start a new auto-scroll interval if needed
            const scrollMargin = 60; // pixels from the edge to trigger scroll
            const scrollSpeed = 15; // pixels per interval
            
            if (clientX < arrangementRect.left + scrollMargin) {
                autoScrollIntervalRef.current = window.setInterval(() => {
                    arrangementContainer.scrollLeft -= scrollSpeed;
                    const edgeBar = getBarFromClientX(arrangementRect.left);
                    onLoopRangeChange(dragStartBar.current!, edgeBar);
                }, 30);
            } else if (clientX > arrangementRect.right - scrollMargin) {
                autoScrollIntervalRef.current = window.setInterval(() => {
                    arrangementContainer.scrollLeft += scrollSpeed;
                    const edgeBar = getBarFromClientX(arrangementRect.right);
                    onLoopRangeChange(dragStartBar.current!, edgeBar);
                }, 30);
            }
        };

        const handlePointerUp = () => {
            stopAutoScroll();
            dragStartBar.current = null;
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerUp);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
    };

    const handleDoubleClick = () => {
        onLoopRangeChange(1, bars);
    };

    const renderMarkers = () => {
        const markers = [];
        for (let i = 0; i < totalSteps; i++) {
            const isBar = i % 16 === 0;
            const isBeat = i % 4 === 0;
            if (isBar) {
                markers.push(
                    <div key={`bar-${i}`} className="text-xs text-gray-400 absolute select-none" style={{left: `${i * stepWidthPx}px`}}>
                       {i / 16 + 1}
                    </div>
                );
            } else if (isBeat) {
                 markers.push(
                    <div key={`beat-${i}`} className="w-px h-1 bg-gray-500 absolute bottom-0" style={{left: `${i * stepWidthPx}px`}} />
                 );
            }
        }
        return markers;
    }
    
    const loopRegionLeft = (loopStartBar - 1) * 16 * stepWidthPx;
    const loopRegionWidth = (loopEndBar - loopStartBar + 1) * 16 * stepWidthPx;

    return (
        <div 
            ref={rulerRef}
            className="relative h-6 cursor-pointer touch-none" 
            style={{width: `${width}px`}}
            onPointerDown={handlePointerDown}
            onDoubleClick={handleDoubleClick}
        >
            <div 
                className="absolute top-0 h-full bg-cyan-500/20 rounded"
                style={{
                    left: `${loopRegionLeft}px`,
                    width: `${loopRegionWidth}px`,
                    pointerEvents: 'none'
                }}
            />
            {renderMarkers()}
        </div>
    );
};