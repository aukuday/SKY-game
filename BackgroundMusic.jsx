import React, { useEffect, useRef } from 'react';
import song from './tower-bloxx-title-theme-flash.mp3';

const BackgroundMusic = ({ gameState, view }) => {
  const audioRef = useRef(null);
  const cleanupInteractionListeners = useRef(() => {});

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Music should only play during the 'playing' state.
    const isGameplay = gameState === 'playing';

    if (isGameplay) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn("Audio autoplay prevented. Waiting for user interaction to start music.");
          
          const playOnFirstInteraction = () => {
            audio.play().catch(err => console.error("Could not play audio after interaction:", err));
            cleanupInteractionListeners.current();
          };
          
          document.addEventListener('click', playOnFirstInteraction);
          document.addEventListener('keydown', playOnFirstInteraction);
          document.addEventListener('touchstart', playOnFirstInteraction);

          cleanupInteractionListeners.current = () => {
            document.removeEventListener('click', playOnFirstInteraction);
            document.removeEventListener('keydown', playOnFirstInteraction);
            document.removeEventListener('touchstart', playOnFirstInteraction);
            cleanupInteractionListeners.current = () => {};
          };
        });
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }
    
    return () => {
      cleanupInteractionListeners.current();
    };
  }, [gameState, view]);

  return (
    <audio
      ref={audioRef}
      src={song}
      loop
      style={{ display: 'none' }}
    />
  );
};

export default BackgroundMusic;