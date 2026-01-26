import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import Work from '../pages/Work';
import { useState } from 'react';

export default function Overlay() {
    const { isPaused, togglePause, setPaused, setSceneState, activePage, setActivePage } = useStore();
    const [connectOpen, setConnectOpen] = useState(false);

    const handleNav = (page) => {
        setPaused(false); // Unpause to trigger animations (e.g. offscreen)
        setActivePage(page);

        if (page === 'work') {
            setSceneState('offscreen');
        } else if (page === 'self') {
            setSceneState('self-cloud');
        } else if (page === 'connect') {
            setConnectOpen(true);
            setPaused(true); // Keep paused for modal? Or unpause to loop BG? User said "connect will just open a modal".
            // Let's keep scene as sphere for connect, but just overlay the modal.
            setSceneState('sphere');
        }
    };

    const handleBack = () => {
        setActivePage(null);
        setSceneState('sphere');
        setPaused(false);
    };

    return (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>

            {/* Dimming Overlay when Paused */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(5px)', pointerEvents: 'auto', zIndex: 5 }}
                    >
                        {/* Hero Text Navigation */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: '2rem'
                        }}>
                            {['Work', 'Self', 'Connect'].map((item) => (
                                <motion.h1
                                    key={item}
                                    whileHover={{ scale: 1.1, color: '#ff4081' }}
                                    style={{ fontSize: '4rem', cursor: 'pointer', margin: 0, textTransform: 'uppercase', letterSpacing: '0.2em' }}
                                    onClick={() => handleNav(item.toLowerCase())}
                                >
                                    {item}
                                </motion.h1>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Left Pause Button */}
            <div style={{ position: 'absolute', bottom: '40px', left: '40px', pointerEvents: 'auto', zIndex: 20 }}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    onClick={togglePause}
                    style={{
                        fontSize: '1rem',
                        padding: '10px 20px',
                        borderRadius: '30px',
                        border: '1px solid white',
                        background: isPaused ? 'white' : 'transparent',
                        color: isPaused ? 'black' : 'white',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                    }}
                >
                    {isPaused ? 'Resume' : 'Pause'}
                </motion.button>
            </div>

            {/* Content Pages */}
            <AnimatePresence>
                {activePage === 'work' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ position: 'absolute', inset: 0, zIndex: 10 }}
                    >
                        {/* Back Button */}
                        <button onClick={handleBack} style={{ position: 'absolute', top: 40, left: 40, zIndex: 20, pointerEvents: 'auto' }}>
                            &larr; Back
                        </button>
                        <Work />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Connect Modal */}
            <AnimatePresence>
                {connectOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 50,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'auto'
                        }}
                    >
                        <div className="glass" style={{ padding: '3rem', borderRadius: '20px', maxWidth: '500px', width: '90%' }}>
                            <h2 style={{ marginTop: 0 }}>Connect</h2>
                            <input type="email" placeholder="Email" style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }} />
                            <input type="text" placeholder="Subject" style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }} />
                            <textarea placeholder="Message" rows={5} style={{ display: 'block', width: '100%', padding: '10px', marginBottom: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <button onClick={() => { setConnectOpen(false); setActivePage(null); setSceneState('sphere'); }}>Close</button>
                                <button style={{ background: 'white', color: 'black', padding: '10px 20px', borderRadius: '5px' }}>Send</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
