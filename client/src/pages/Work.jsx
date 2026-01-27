import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { works } from '../data';
import { useStore } from '../store';

export default function Work() {
    const [expandedId, setExpandedId] = useState(null);
    const { setEmbedOpen } = useStore();

    const toggleItem = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Notify store when embed is open/closed (to mute drone)
    useEffect(() => {
        setEmbedOpen(expandedId !== null);
        return () => setEmbedOpen(false); // Cleanup when leaving page
    }, [expandedId, setEmbedOpen]);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 10,
            pointerEvents: 'auto',
            padding: '80px 16px 100px',
            overflowX: 'hidden',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            boxSizing: 'border-box',
        }}>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass"
                style={{
                    width: '100%',
                    maxWidth: '700px',
                    borderRadius: '16px',
                    padding: '8px',
                    margin: '0 auto',
                }}
            >
            {works.map((work, index) => (
                <motion.div
                    key={work.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            borderBottom: index < works.length - 1 
                                ? '1px solid rgba(0,0,0,0.08)' 
                                : 'none',
                        }}
                    >
                        {/* Accordion Header */}
                        <motion.button
                            onClick={() => toggleItem(work.id)}
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                    style={{
                                width: '100%',
                                padding: '16px 20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'transparent',
                                border: 'none',
                                color: '#1a1a1a',
                        cursor: 'pointer',
                                textAlign: 'left',
                                borderRadius: '8px',
                    }}
                >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h3 style={{ 
                                    margin: 0, 
                                    fontSize: '1rem',
                                    fontWeight: '500',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }}>
                        {work.title}
                                </h3>
                                <span style={{ 
                                    fontSize: '0.75rem', 
                                    opacity: 0.5,
                                }}>
                        {work.date}
                                </span>
                            </div>
                            
                            <motion.span
                                animate={{ rotate: expandedId === work.id ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ 
                                    fontSize: '1.2rem',
                                    opacity: 0.5,
                                    marginLeft: '12px',
                                    flexShrink: 0,
                                }}
                            >
                                ▼
                            </motion.span>
                        </motion.button>

                        {/* Accordion Content */}
                        <AnimatePresence>
                    {expandedId === work.id && (
                        <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                                    style={{ overflow: 'hidden' }}
                        >
                                    <div style={{ padding: '0 20px 20px' }}>
                                        <p style={{ 
                                            fontSize: '0.85rem', 
                                            opacity: 0.6, 
                                            margin: '0 0 16px',
                                            lineHeight: 1.5
                                        }}>
                                            {work.subtitle}
                                        </p>
                                        
                                        {work.youtubeId && (
                                            <div style={{
                                                position: 'relative',
                                                paddingBottom: '56.25%',
                                                height: 0,
                                                overflow: 'hidden',
                                                borderRadius: '8px',
                                                background: 'rgba(0,0,0,0.3)',
                                            }}>
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${work.youtubeId}`}
                                                    title={work.title}
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
                                                    allowFullScreen
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        height: '100%',
                                                        border: 'none',
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                        </motion.div>
                    )}
                        </AnimatePresence>
                </motion.div>
            ))}
            </motion.div>
        </div>
    );
}
