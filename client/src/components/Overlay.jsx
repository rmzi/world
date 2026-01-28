import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import Work from '../pages/Work';
import Self from '../pages/Self';
import Connect from '../pages/Connect';
import { useState, useEffect } from 'react';
import { navigateToGallery, useRoomRoute } from '../rooms/RoomRouter';

// Track UI interactions
const trackInteraction = (action) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', action, {
            event_category: 'engagement',
        });
    }
};

export default function Overlay() {
    const { isPaused, togglePause, setPaused, setSceneState, activePage, setActivePage, randomizeParams, scatter, hasEntered, enter, audioLevel, signalActive, toggleSignal, showGallery, setShowGallery, currentRoom } = useStore();
    const { route } = useRoomRoute();
    const [isExpanded, setIsExpanded] = useState(false);
    const [idleHint, setIdleHint] = useState(null); // 'drag to play', 'explore'
    const [lastInteraction, setLastInteraction] = useState(Date.now());
    const [interactionCount, setInteractionCount] = useState(0);

    const premiumEasing = [0.23, 1, 0.32, 1];

    const handleNav = (page) => {
        setPaused(false);
        setActivePage(page);
        setIsExpanded(false);

        if (page === 'work') {
            setSceneState('offscreen');
        } else if (page === 'self') {
            setSceneState('self-cloud');
        } else if (page === 'connect') {
            setSceneState('offscreen');
        }
    };

    const handleBack = () => {
        setActivePage(null);
        setSceneState('sphere');
        setPaused(false);
    };

    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e) => {
        const { clientWidth, clientHeight } = e.currentTarget;
        const x = (e.clientX / clientWidth - 0.5) * 2;
        const y = (e.clientY / clientHeight - 0.5) * 2;
        setMousePos({ x, y });
    };

    const [showPrompt, setShowPrompt] = useState(false);

    // Idle timer for "enter" prompt
    useEffect(() => {
        if (!hasEntered) {
            const timer = setTimeout(() => setShowPrompt(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [hasEntered]);

    // Track interactions and reset idle timer
    useEffect(() => {
        const resetIdle = () => {
            setLastInteraction(Date.now());
            setIdleHint(null);
            setInteractionCount(c => c + 1);
        };
        
        const events = ['pointerdown', 'pointermove', 'keydown', 'scroll'];
        events.forEach(e => window.addEventListener(e, resetIdle, { passive: true }));
        return () => events.forEach(e => window.removeEventListener(e, resetIdle));
    }, []);

    // Show simple idle hint after 4s (but only once per session)
    useEffect(() => {
        if (!hasEntered || activePage || interactionCount > 3) return;
        
        const timer = setTimeout(() => {
            if (!idleHint) {
                setIdleHint('drag to play');
            }
        }, 4000);
        
        return () => clearTimeout(timer);
    }, [hasEntered, activePage, interactionCount]);

    // Handle gallery toggle
    const handleGalleryToggle = () => {
        if (showGallery) {
            setShowGallery(false);
        } else {
            setShowGallery(true);
            trackInteraction('gallery_open');
        }
    };

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
            {/* Gallery Menu Button (top-left) */}
            <AnimatePresence>
                {hasEntered && !activePage && !showGallery && (
                    <motion.button
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 0.7, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        whileHover={{ opacity: 1, scale: 1.05 }}
                        transition={{ duration: 0.4 }}
                        onClick={handleGalleryToggle}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '20px',
                            zIndex: 100,
                            pointerEvents: 'auto',
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            border: 'none',
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Room Gallery"
                    >
                        <span style={{ lineHeight: 1 }}>&#9776;</span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Gallery Close Button (when gallery is open) */}
            <AnimatePresence>
                {hasEntered && showGallery && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.9, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ opacity: 1, scale: 1.1 }}
                        transition={{ duration: 0.3 }}
                        onClick={() => setShowGallery(false)}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            right: '20px',
                            zIndex: 200,
                            pointerEvents: 'auto',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            fontSize: '1.4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        title="Close Gallery"
                    >
                        &times;
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Idle Hint - simple text that fades in/out once */}
            <AnimatePresence>
                {idleHint && hasEntered && !activePage && !isPaused && (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.5 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5 }}
                        style={{
                            position: 'fixed',
                            bottom: '25%',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            fontSize: '0.7rem',
                            fontWeight: '300',
                            letterSpacing: '0.2em',
                            color: 'rgba(0,0,0,0.5)',
                                        textTransform: 'lowercase',
                            pointerEvents: 'none',
                            zIndex: 5,
                                    }}
                                >
                        {idleHint}
                                </motion.p>
                )}
            </AnimatePresence>

            {/* 2. Dimming Overlay when Paused */}
            <AnimatePresence>
                {isPaused && hasEntered && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: premiumEasing }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(8px)', pointerEvents: 'auto', zIndex: 10 }}
                    >
                        {!activePage && (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '100%',
                                gap: '1.2rem'
                            }}>
                                {['Self', 'Work', 'Connect'].map((item, i) => (
                                    <motion.h2
                                        key={item}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.08, duration: 0.3 }}
                                        whileHover={{ scale: 1.05, color: '#ff4081' }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{ fontSize: '1.8rem', cursor: 'pointer', margin: 0, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#1a1a1a', fontWeight: '400' }}
                                        onClick={() => handleNav(item.toLowerCase())}
                                    >
                                        {item}
                                    </motion.h2>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3. UI Floating Dock */}
            <AnimatePresence>
                {hasEntered && !activePage && (
                    <motion.div
                        initial={{ opacity: 0, y: 30, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 30, x: '-50%' }}
                        transition={{ duration: 0.8, delay: 0.5, ease: premiumEasing }}
                        style={{
                            position: 'fixed',
                            bottom: '30px',
                            left: '50%',
                            zIndex: 100,
                            pointerEvents: 'none',
                            display: 'flex',
                            justifyContent: 'center',
                            width: '100%',
                            maxWidth: '90vw'
                        }}
                    >
                        <motion.div
                            className="glass"
                            layout
                            animate={{
                                // Green (low) → Yellow (mid) → Red (hot)
                                backgroundColor: `rgba(${Math.floor(80 + audioLevel * 175)}, ${Math.floor(180 - audioLevel * 130)}, ${Math.floor(80 - audioLevel * 60)}, ${0.75 + audioLevel * 0.2})`,
                                boxShadow: `0 4px ${10 + audioLevel * 20}px rgba(${Math.floor(audioLevel * 200)}, ${Math.floor(150 - audioLevel * 100)}, 0, ${0.1 + audioLevel * 0.3})`
                            }}
                            transition={{ duration: 0.03 }}
                            style={{
                                padding: '5px',
                                borderRadius: '30px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                pointerEvents: 'auto',
                            }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => { e.stopPropagation(); togglePause(); }}
                                style={{
                                    fontSize: '0.6rem',
                                    padding: '7px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: isPaused ? '#1a1a1a' : 'rgba(0,0,0,0.06)',
                                    color: isPaused ? 'white' : '#1a1a1a',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                {isPaused ? 'Resume' : 'Explore'}
                            </motion.button>

                            <motion.button
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.1)' }}
                                style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isExpanded ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
                                    color: '#1a1a1a',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    border: 'none'
                                }}
                            >
                                <motion.span animate={{ rotate: isExpanded ? 45 : 0 }}>+</motion.span>
                            </motion.button>

                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.5, ease: premiumEasing }}
                                        style={{ display: 'flex', gap: '5px', alignItems: 'center', overflow: 'hidden' }}
                                    >
                                        <motion.button
                                            whileHover={{ scale: 1.05, background: 'rgba(0,0,0,0.1)' }}
                                            onClick={(e) => { e.stopPropagation(); scatter(); trackInteraction('scatter'); }}
                                            style={{
                                                fontSize: '0.55rem',
                                                padding: '7px 12px',
                                                borderRadius: '20px',
                                                color: '#1a1a1a',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                                cursor: 'pointer',
                                                background: 'rgba(0,0,0,0.03)',
                                                border: 'none'
                                            }}
                                        >
                                            Scatter
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05, background: 'rgba(0,0,0,0.1)' }}
                                            onClick={(e) => { e.stopPropagation(); randomizeParams(); trackInteraction('shuffle'); }}
                                            style={{
                                                fontSize: '0.55rem',
                                                padding: '7px 12px',
                                                borderRadius: '20px',
                                                color: '#1a1a1a',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                                cursor: 'pointer',
                                                background: 'rgba(0,0,0,0.03)',
                                                border: 'none'
                                            }}
                                        >
                                            Shuffle
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={(e) => { e.stopPropagation(); toggleSignal(); trackInteraction('signal_toggle'); }}
                                            animate={{
                                                background: signalActive 
                                                    ? ['rgba(255,100,100,0.8)', 'rgba(255,50,50,0.9)', 'rgba(255,100,100,0.8)']
                                                    : 'rgba(0,0,0,0.03)',
                                                boxShadow: signalActive 
                                                    ? '0 0 8px rgba(255,50,50,0.5)'
                                                    : '0 0 0px rgba(0,0,0,0)'
                                            }}
                                            transition={{ 
                                                background: { duration: 1, repeat: signalActive ? Infinity : 0 },
                                                boxShadow: { duration: 0.3 }
                                            }}
                                            style={{
                                                fontSize: '0.55rem',
                                                padding: '7px 12px',
                                                borderRadius: '20px',
                                                border: 'none',
                                                color: signalActive ? 'white' : '#1a1a1a',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                cursor: 'pointer',
                                                whiteSpace: 'nowrap'
                                            }}
                                        >
                                            📡 Signal
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Content Pages */}
            <AnimatePresence>
                {(activePage === 'work' || activePage === 'self' || activePage === 'connect') && hasEntered && (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.6, ease: premiumEasing }}
                        style={{ position: 'absolute', inset: 0, zIndex: 50 }}
                    >
                        <button onClick={handleBack} style={{ position: 'absolute', top: 40, left: 40, zIndex: 60, pointerEvents: 'auto', color: '#1a1a1a', fontSize: '1.2rem' }}>
                            &larr; Back
                        </button>
                        {activePage === 'work' && <Work />}
                        {activePage === 'self' && <Self />}
                        {activePage === 'connect' && <Connect />}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
