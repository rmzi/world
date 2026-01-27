import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import Work from '../pages/Work';
import Self from '../pages/Self';
import Connect from '../pages/Connect';
import { useState, useEffect } from 'react';

export default function Overlay() {
    const { isPaused, togglePause, setPaused, setSceneState, activePage, setActivePage, randomizeParams, scatter, hasEntered, enter, audioLevel, signalActive, toggleSignal } = useStore();
    const [isExpanded, setIsExpanded] = useState(false);
    const [showTouchHint, setShowTouchHint] = useState(false);

    const premiumEasing = [0.23, 1, 0.32, 1];

    const handleNav = (page) => {
        setPaused(false);
        setActivePage(page);
        setIsExpanded(false);
        setShowTouchHint(false);

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

    // Show touch hint after entering, with delay
    useEffect(() => {
        if (hasEntered && !activePage && !isPaused) {
            const timer = setTimeout(() => setShowTouchHint(true), 4000);
            return () => clearTimeout(timer);
        } else {
            setShowTouchHint(false);
        }
    }, [hasEntered, activePage, isPaused]);

    // Hide touch hint on any interaction
    useEffect(() => {
        const hideHint = () => setShowTouchHint(false);
        window.addEventListener('pointerdown', hideHint);
        return () => window.removeEventListener('pointerdown', hideHint);
    }, []);

    return (
        <div
            onMouseMove={handleMouseMove}
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
            {/* 1. Splash Screen */}
            <AnimatePresence>
                {!hasEntered && (
                    <motion.div
                        initial={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1.5, ease: 'easeInOut' }}
                        onClick={enter}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: '#fafafa',
                            color: '#1a1a1a',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                            pointerEvents: 'auto',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', gap: '0.2em' }}>
                            {"rmzi".split("").map((letter, i) => (
                                <motion.h1
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{
                                        opacity: 1,
                                        y: [0, -2, 2, 0],
                                        x: [0, 1, -1, 0]
                                    }}
                                    transition={{
                                        opacity: { duration: 0.5, delay: i * 0.08 },
                                        y: { repeat: Infinity, duration: 2 + Math.random(), ease: "easeInOut" },
                                        x: { repeat: Infinity, duration: 1.5 + Math.random(), ease: "easeInOut" }
                                    }}
                                    style={{ fontSize: '4rem', fontWeight: '300', letterSpacing: '0.1em', textTransform: 'lowercase', margin: 0 }}
                                >
                                    {letter}
                                </motion.h1>
                            ))}
                        </div>

                        <AnimatePresence>
                            {showPrompt && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: [0, 0.5, 0] }}
                                    transition={{
                                        duration: 3,
                                        repeat: Infinity,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        position: 'absolute',
                                        bottom: '40%',
                                        fontSize: '0.8rem',
                                        fontWeight: '300',
                                        letterSpacing: '0.3em',
                                        textTransform: 'lowercase',
                                    }}
                                >
                                    enter
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Touch Hint - subtle pulsing ring */}
            <AnimatePresence>
                {showTouchHint && hasEntered && !activePage && !isPaused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        style={{
                            position: 'fixed',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            pointerEvents: 'none',
                            zIndex: 5,
                        }}
                    >
                        {/* Pulsing rings */}
                        <motion.div
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0, 0.3],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                            style={{
                                width: '180px',
                                height: '180px',
                                borderRadius: '50%',
                                border: '1px solid rgba(0,0,0,0.15)',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                        <motion.div
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.2, 0, 0.2],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                                delay: 0.5,
                            }}
                            style={{
                                width: '220px',
                                height: '220px',
                                borderRadius: '50%',
                                border: '1px solid rgba(0,0,0,0.1)',
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                        {/* Subtle text hint */}
                        <motion.p
                            animate={{ opacity: [0.3, 0.5, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                bottom: '-60px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: '0.7rem',
                                fontWeight: '300',
                                letterSpacing: '0.2em',
                                color: 'rgba(0,0,0,0.4)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            touch to play
                        </motion.p>
                    </motion.div>
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
                                {['Work', 'Self', 'Connect'].map((item, i) => (
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
                                boxShadow: `0 4px ${15 + audioLevel * 25}px rgba(${Math.floor(audioLevel * 200)}, ${Math.floor(150 - audioLevel * 100)}, 0, ${0.15 + audioLevel * 0.35})`
                            }}
                            transition={{ duration: 0.03 }}
                            style={{
                                padding: '8px',
                                borderRadius: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                pointerEvents: 'auto',
                            }}
                        >
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={(e) => { e.stopPropagation(); togglePause(); }}
                                style={{
                                    fontSize: '0.7rem',
                                    padding: '10px 24px',
                                    borderRadius: '30px',
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
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => { e.stopPropagation(); toggleSignal(); }}
                                animate={{
                                    background: signalActive 
                                        ? ['rgba(255,100,100,0.8)', 'rgba(255,50,50,0.9)', 'rgba(255,100,100,0.8)']
                                        : 'rgba(0,0,0,0.06)',
                                    boxShadow: signalActive 
                                        ? '0 0 12px rgba(255,50,50,0.5)'
                                        : '0 0 0px rgba(0,0,0,0)'
                                }}
                                transition={{ 
                                    background: { duration: 1, repeat: signalActive ? Infinity : 0 },
                                    boxShadow: { duration: 0.3 }
                                }}
                                style={{
                                    fontSize: '0.7rem',
                                    padding: '10px 16px',
                                    borderRadius: '30px',
                                    border: 'none',
                                    color: signalActive ? 'white' : '#1a1a1a',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                📡 {signalActive ? 'On' : 'Signal'}
                            </motion.button>

                            <motion.button
                                onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                                whileHover={{ scale: 1.1, background: 'rgba(0,0,0,0.1)' }}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: isExpanded ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.03)',
                                    color: '#1a1a1a',
                                    fontSize: '1.2rem',
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
                                        style={{ display: 'flex', gap: '8px', alignItems: 'center', overflow: 'hidden' }}
                                    >
                                        <div style={{ height: '20px', width: '1px', background: 'rgba(0,0,0,0.1)', margin: '0 6px' }} />

                                        <motion.button
                                            whileHover={{ scale: 1.05, background: 'rgba(0,0,0,0.1)' }}
                                            onClick={(e) => { e.stopPropagation(); scatter(); }}
                                            style={{
                                                fontSize: '0.6rem',
                                                padding: '10px 16px',
                                                borderRadius: '30px',
                                                color: '#1a1a1a',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                                cursor: 'pointer',
                                                background: 'rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            Scatter
                                        </motion.button>

                                        <motion.button
                                            whileHover={{ scale: 1.05, background: 'rgba(0,0,0,0.1)' }}
                                            onClick={(e) => { e.stopPropagation(); randomizeParams(); }}
                                            style={{
                                                fontSize: '0.6rem',
                                                padding: '10px 16px',
                                                borderRadius: '30px',
                                                color: '#1a1a1a',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                whiteSpace: 'nowrap',
                                                cursor: 'pointer',
                                                background: 'rgba(0,0,0,0.03)'
                                            }}
                                        >
                                            Shuffle
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
