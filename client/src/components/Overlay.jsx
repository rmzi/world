import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import Work from '../pages/Work';
import Self from '../pages/Self';
import Connect from '../pages/Connect';
import { useState } from 'react';

// Track UI interactions
const trackInteraction = (action) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', action, {
            event_category: 'engagement',
        });
    }
};

export default function Overlay() {
    const {
        activePage, setActivePage,
        sceneState, setSceneState,
        hasEntered, enter,
        audioLevel, signalActive, toggleSignal,
        randomizeParams, scatter,
        enterHarp, exitHarp,
    } = useStore();

    const [isExpanded, setIsExpanded] = useState(false);

    const premiumEasing = [0.23, 1, 0.32, 1];

    const handleNav = (page) => {
        setActivePage(page);
        if (page === 'self') {
            setSceneState('self-cloud');
        } else {
            setSceneState('offscreen');
        }
    };

    const handleBack = () => {
        if (sceneState === 'harp') {
            // Return from harp to Work page
            exitHarp();
        } else {
            // Return to home menu
            setActivePage(null);
            setSceneState('home');
        }
    };

    const [showPrompt, setShowPrompt] = useState(false);

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

            {/* Home Menu — front-and-center after entering */}
            <AnimatePresence>
                {hasEntered && activePage === null && sceneState !== 'sphere' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: premiumEasing }}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '1.2rem',
                            pointerEvents: 'auto',
                            zIndex: 10,
                        }}
                    >
                        {['Self', 'Work', 'Connect'].map((item, i) => (
                            <motion.h2
                                key={item}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + i * 0.1, duration: 0.5, ease: premiumEasing }}
                                whileHover={{ scale: 1.05, color: '#ff4081' }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    fontSize: '1.8rem',
                                    cursor: 'pointer',
                                    margin: 0,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.15em',
                                    color: '#1a1a1a',
                                    fontWeight: '400',
                                }}
                                onClick={() => handleNav(item.toLowerCase())}
                            >
                                {item}
                            </motion.h2>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Harp Controls — floating dock when in harp mode */}
            <AnimatePresence>
                {hasEntered && activePage === 'harp' && (
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
                                onClick={(e) => { e.stopPropagation(); handleBack(); }}
                                style={{
                                    fontSize: '0.6rem',
                                    padding: '7px 16px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    background: 'rgba(0,0,0,0.06)',
                                    color: '#1a1a1a',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    flexShrink: 0
                                }}
                            >
                                &larr; Back
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
                                            Signal
                                        </motion.button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content Pages */}
            <AnimatePresence>
                {hasEntered && activePage && activePage !== 'harp' && (
                    <motion.div
                        key={activePage}
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
