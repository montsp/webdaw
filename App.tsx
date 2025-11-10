import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Transport } from './components/Transport';
import { ShareModal } from './components/ShareModal';
import { HelpTooltip } from './components/HelpTooltip';
import { DEFAULT_SESSION_DATA } from './constants';
import { encodeSessionData, decodeSessionData } from './utils/dataEncoder';
import { AudioEngine } from './audio/AudioEngine';
import type { SessionData, Note, DrumPatternGrid, TrackType, SynthInstrumentType } from './types';
import { PlayIcon, PlusIcon } from './components/icons';
import { Track } from './components/Track';
import { DetailView } from './components/DetailView';
import { TimelineRuler } from './components/TimelineRuler';

const App: React.FC = () => {
  const [sessionData, setSessionData] = useState<SessionData>(DEFAULT_SESSION_DATA);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isAudioEngineReady, setIsAudioEngineReady] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(DEFAULT_SESSION_DATA.tracks[0]?.id ?? null);

  const audioEngine = useRef<AudioEngine | null>(null);
  const arrangementContainerRef = useRef<HTMLDivElement>(null);
  const detailContainerRef = useRef<HTMLDivElement>(null);

  const loadDataFromUrl = useCallback(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const data = urlParams.get('data');
      if (data) {
        const decodedData = decodeSessionData(data);
        if (decodedData) {
          setSessionData(decodedData);
          setSelectedTrackId(decodedData.tracks[0]?.id ?? null);
        }
      }
    } catch (error) {
      console.error("URLからのデータ読み込みに失敗しました:", error);
      alert("URLからプロジェクトを読み込めませんでした。データが破損している可能性があります。");
    }
  }, []);
  
  const initAudioEngine = async () => {
      if (!audioEngine.current) {
          audioEngine.current = new AudioEngine();
          await audioEngine.current.init();
          setIsAudioEngineReady(true);
      }
  };

  useEffect(() => {
    loadDataFromUrl();
  }, [loadDataFromUrl]);

  const play = async () => {
      if (!audioEngine.current || !isAudioEngineReady) {
          await initAudioEngine();
      }
      if (!audioEngine.current) return;

      if (!isPlaying) {
          const loopStartStep = (sessionData.loopStartBar - 1) * 16;
          setCurrentStep(loopStartStep);
          audioEngine.current.start();
          setIsPlaying(true);
      }
  };
  
  const stop = () => {
    if (audioEngine.current && isPlaying) {
      audioEngine.current.stop();
      setIsPlaying(false);
      setCurrentStep(0);
    }
  };
  
  useEffect(() => {
    if (isPlaying && isAudioEngineReady && audioEngine.current) {
        const scheduler = () => {
            const now = audioEngine.current!.getCurrentTime();
            const stepDuration = 60 / sessionData.bpm / 4;

            const loopStartStep = (sessionData.loopStartBar - 1) * 16;
            const loopEndStep = sessionData.loopEndBar * 16;
            const loopDurationSteps = loopEndStep - loopStartStep;
            
            if (loopDurationSteps <= 0) return;

            const totalElapsedSteps = Math.floor(now / stepDuration);
            const currentLoopStep = totalElapsedSteps % loopDurationSteps;
            const newCurrentStep = loopStartStep + currentLoopStep;
            
            setCurrentStep(newCurrentStep);

            const scrollIntoViewIfNeeded = (container: HTMLDivElement | null, stepWidth: number) => {
                if (!container) return;
                const scrollLeft = container.scrollLeft;
                const containerWidth = container.clientWidth;
                const playheadPosition = newCurrentStep * stepWidth;

                if (playheadPosition < scrollLeft || playheadPosition >= scrollLeft + containerWidth) {
                    container.scrollLeft = playheadPosition - containerWidth / 2;
                }
            }

            const arrangementStepWidth = STEP_WIDTH_PX;
            scrollIntoViewIfNeeded(arrangementContainerRef.current, arrangementStepWidth);

             if (detailContainerRef.current) {
                const detailGrid = detailContainerRef.current.querySelector('.grid');
                if (detailGrid) {
                    const totalSteps = sessionData.bars * 16;
                    const detailStepWidth = detailGrid.clientWidth / totalSteps;
                    scrollIntoViewIfNeeded(detailContainerRef.current, detailStepWidth);
                }
            }

            const anySolo = sessionData.tracks.some(t => t.soloed);

            sessionData.tracks.forEach(track => {
                if (track.muted) return;
                if (anySolo && !track.soloed) return;

                if (track.type === 'drum') {
                    track.pattern.grid.forEach((row, soundIndex) => {
                        if (row[newCurrentStep]) {
                            const sound = track.pattern.sounds[soundIndex];
                            audioEngine.current?.playDrum(sound, now + 0.05, track.volume);
                        }
                    });
                } else if (track.type === 'synth') {
                    track.notes.forEach(note => {
                        const noteStartStep = note.startBeat * 4;
                        if (noteStartStep === newCurrentStep) {
                           audioEngine.current?.playSynth(note.pitch, now + 0.05, note.duration * stepDuration, track.volume, track.instrument);
                        }
                    });
                }
            });
        };
        
        const timerId = setInterval(scheduler, 50);
        return () => clearInterval(timerId);
    }
  }, [isPlaying, isAudioEngineReady, sessionData]);


  const updateBPM = (newBpm: number) => {
    setSessionData(prev => ({ ...prev, bpm: newBpm }));
  };
  
  const updateBars = (newBars: number) => {
    setSessionData(prev => {
        const clampedBars = Math.max(1, Math.min(128, newBars));
        const newTotalSteps = clampedBars * 16;

        const newTracks = prev.tracks.map(track => {
            if (track.type === 'drum') {
                const newGrid = track.pattern.grid.map(row => {
                    if (row.length > newTotalSteps) {
                        return row.slice(0, newTotalSteps);
                    } else {
                        return [...row, ...Array(newTotalSteps - row.length).fill(false)];
                    }
                });
                return { ...track, pattern: { ...track.pattern, grid: newGrid } };
            }
            if (track.type === 'synth') {
                const newNotes = track.notes.filter(note => (note.startBeat * 4) < newTotalSteps);
                return { ...track, notes: newNotes };
            }
            return track;
        });

        return { 
            ...prev, 
            bars: clampedBars,
            tracks: newTracks,
            loopEndBar: Math.min(prev.loopEndBar, clampedBars)
        };
    });
  };

  const updateLoopRange = (start: number, end: number) => {
      setSessionData(prev => ({
          ...prev,
          loopStartBar: Math.max(1, Math.min(start, end)),
          loopEndBar: Math.min(prev.bars, Math.max(start, end)),
      }));
  }

  const addTrack = (type: 'synth' | 'drum') => {
      let newTrack: TrackType;
      const newId = `track-${type}-${Date.now()}`;

      if (type === 'synth') {
          newTrack = {
              id: newId,
              type: 'synth',
              name: '新規シンセ',
              instrument: 'piano',
              volume: 0.8,
              muted: false,
              soloed: false,
              notes: [],
          };
      } else {
          newTrack = {
              id: newId,
              type: 'drum',
              name: '新規ドラム',
              volume: 1.0,
              muted: false,
              soloed: false,
              pattern: {
                  sounds: ['kick', 'snare', 'hihat', 'clap'],
                  grid: Array(4).fill(null).map(() => Array(sessionData.bars * 16).fill(false)),
              },
          };
      }
      
      setSessionData(prev => ({
          ...prev,
          tracks: [...prev.tracks, newTrack]
      }));
      setSelectedTrackId(newId);
  };

  const deleteTrack = (trackId: string) => {
      setSessionData(prev => {
        const newTracks = prev.tracks.filter(track => track.id !== trackId);
        if(selectedTrackId === trackId) {
            setSelectedTrackId(newTracks[0]?.id ?? null);
        }
        return {
          ...prev,
          tracks: newTracks
        }
      });
  };

  const updateTrackProperties = (trackId: string, updatedProps: Partial<TrackType>) => {
      setSessionData(prev => ({
          ...prev,
          tracks: prev.tracks.map(track =>
              track.id === trackId ? { ...track, ...updatedProps } : track
          )
      }));
  };

  const updateTrackPatternOrNotes = (trackId: string, newData: DrumPatternGrid | Note[]) => {
    setSessionData(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          if (track.type === 'drum') {
            return { ...track, pattern: { ...track.pattern, grid: newData as DrumPatternGrid } };
          } else if (track.type === 'synth') {
            return { ...track, notes: newData as Note[] };
          }
        }
        return track;
      })
    }));
  };
  
  const handleShare = () => {
      const url = encodeSessionData(sessionData);
      setShareUrl(url);
      setIsShareModalOpen(true);
  };

  const playNotePreview = (pitch: string) => {
    const track = sessionData.tracks.find(t => t.id === selectedTrackId);
    if (!audioEngine.current || !track || track.type !== 'synth') return;

    audioEngine.current.playSynth(pitch, audioEngine.current.getCurrentTime(), 0.25, track.volume, track.instrument);
    
    const newNote: Note = {
        id: `note-${Date.now()}`,
        pitch,
        startBeat: currentStep / 4,
        duration: 0.25
    };
    updateTrackPatternOrNotes(track.id, [...track.notes, newNote]);
  };

  const playDrumPreview = (soundIndex: number) => {
      const track = sessionData.tracks.find(t => t.id === selectedTrackId);
      if (!audioEngine.current || !track || track.type !== 'drum') return;

      const sound = track.pattern.sounds[soundIndex];
      audioEngine.current.playDrum(sound, audioEngine.current.getCurrentTime(), track.volume);

      const newGrid = track.pattern.grid.map(row => [...row]);
      if (newGrid[soundIndex] && currentStep < newGrid[soundIndex].length) {
          newGrid[soundIndex][currentStep] = !newGrid[soundIndex][currentStep];
      }
      updateTrackPatternOrNotes(track.id, newGrid);
  };


  if (!isAudioEngineReady) {
      return (
          <div className="flex flex-col items-center justify-center h-screen bg-gray-950 text-white">
              <h1 className="text-4xl font-bold mb-4">ウェブDAW</h1>
              <p className="text-gray-400 mb-8">オーディオエンジンを起動して創作を始めましょう。</p>
              <button
                  onClick={initAudioEngine}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform transform hover:scale-105 flex items-center space-x-3"
              >
                  <PlayIcon />
                  <span>創作を始める</span>
              </button>
          </div>
      );
  }

  const selectedTrack = sessionData.tracks.find(t => t.id === selectedTrackId);
  const totalSteps = sessionData.bars * 16;
  const STEP_WIDTH_PX = 24;
  const arrangementWidth = totalSteps * STEP_WIDTH_PX;

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-200 font-sans">
      <header className="flex-shrink-0 flex flex-col sm:flex-row justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
          <h1 className="text-3xl font-bold text-white tracking-tight">
            ウェブDAW
            <span className="text-cyan-400">.</span>
          </h1>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <HelpTooltip />
            <button
                onClick={handleShare}
                className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200"
            >
                プロジェクトを共有
            </button>
          </div>
        </header>
      
        <div className="flex-shrink-0 bg-gray-900 border-b border-gray-800">
            <Transport
                isPlaying={isPlaying}
                onPlay={play}
                onStop={stop}
                bpm={sessionData.bpm}
                onBpmChange={updateBPM}
                bars={sessionData.bars}
                onBarsChange={updateBars}
            />
        </div>

      <main className="flex-grow flex flex-col min-h-0">
        {/* Arrangement View */}
        <div className="flex-grow flex flex-col overflow-hidden">
          <div className="flex-grow overflow-auto overscroll-y-contain overscroll-x-none" ref={arrangementContainerRef}>
            <div className="relative" style={{ width: `${arrangementWidth}px`}}>
              {/* Header and Ruler (Sticky) */}
              <div className="sticky top-0 z-20 flex bg-gray-800 border-b border-gray-700">
                <div className="w-48 flex-shrink-0 p-2 font-semibold px-3 border-r border-gray-700 flex items-center">トラック</div>
                <div className="flex-grow">
                  <TimelineRuler 
                      bars={sessionData.bars} 
                      currentStep={currentStep} 
                      isPlaying={isPlaying} 
                      stepWidthPx={STEP_WIDTH_PX} 
                      loopStartBar={sessionData.loopStartBar}
                      loopEndBar={sessionData.loopEndBar}
                      onLoopRangeChange={updateLoopRange}
                      arrangementContainerRef={arrangementContainerRef}
                  />
                </div>
              </div>

              {/* Tracks */}
              {sessionData.tracks.map(track => (
                <Track
                  key={track.id}
                  trackData={track}
                  currentStep={currentStep}
                  isPlaying={isPlaying}
                  isSelected={track.id === selectedTrackId}
                  onSelect={() => setSelectedTrackId(track.id)}
                  onUpdateTrack={(props) => updateTrackProperties(track.id, props)}
                  onDeleteTrack={() => deleteTrack(track.id)}
                  totalSteps={totalSteps}
                  stepWidthPx={STEP_WIDTH_PX}
                />
              ))}
              
               {isPlaying && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500/90 pointer-events-none z-30"
                  style={{ left: `${currentStep * STEP_WIDTH_PX}px`, height: '100%' }}
                />
              )}
            </div>
          </div>
          <div className="flex-shrink-0 p-3 flex items-center space-x-2 border-t border-gray-800 bg-gray-800">
              <button onClick={() => addTrack('synth')} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
                  <PlusIcon /> <span>シンセを追加</span>
              </button>
              <button onClick={() => addTrack('drum')} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-md transition duration-200">
                  <PlusIcon /> <span>ドラムを追加</span>
              </button>
          </div>
        </div>

        {/* Detail View */}
        <div className="h-[45%] flex-shrink-0 border-t-2 border-gray-700 flex flex-col bg-gray-900">
            {selectedTrack ? (
                <DetailView 
                    key={selectedTrack.id} // Re-mount when track changes
                    trackData={selectedTrack}
                    currentStep={currentStep}
                    isPlaying={isPlaying}
                    onUpdatePatternOrNotes={(newData) => updateTrackPatternOrNotes(selectedTrack.id, newData)}
                    bars={sessionData.bars}
                    containerRef={detailContainerRef}
                    playNotePreview={playNotePreview}
                    playDrumPreview={playDrumPreview}
                />
            ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                    編集するトラックを選択してください
                </div>
            )}
        </div>
      </main>

      {isShareModalOpen && (
          <ShareModal 
              url={shareUrl}
              onClose={() => setIsShareModalOpen(false)}
          />
      )}
    </div>
  );
};

export default App;