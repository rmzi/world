import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { works, projects, press, shows, releases } from '../data';
import { useStore } from '../store';

// Track mix/embed opens
const trackMixOpen = (mixTitle) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'mix_open', {
            event_category: 'engagement',
            event_label: mixTitle,
        });
    }
};

const trackOutboundClick = (url, label) => {
    if (typeof window.gtag === 'function') {
        window.gtag('event', 'outbound', {
            event_category: 'engagement',
            event_label: label,
            transport_type: 'beacon',
        });
    }
};

const sectionLabelStyle = {
    fontSize: '0.65rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    opacity: 0.4,
    color: '#1a1a1a',
    padding: '20px 20px 4px',
    margin: 0,
};

const linkItemStyle = {
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
    textDecoration: 'none',
};

export default function Work() {
    const [expandedId, setExpandedId] = useState(null);
    const { setEmbedOpen, enterHarp } = useStore();

    const toggleItem = (id, title) => {
        const isOpening = expandedId !== id;
        setExpandedId(isOpening ? id : null);
        if (isOpening) {
            trackMixOpen(title);
        }
    };

    // Notify store when embed is open/closed (to mute drone)
    useEffect(() => {
        setEmbedOpen(expandedId !== null);
        return () => setEmbedOpen(false); // Cleanup when leaving page
    }, [expandedId, setEmbedOpen]);

    let itemIndex = 0;

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
                {/* Projects Section */}
                <p style={sectionLabelStyle}>Projects</p>
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{
                            borderBottom: '1px solid rgba(0,0,0,0.08)',
                        }}
                    >
                        <motion.a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => trackOutboundClick(project.url, project.title)}
                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                            style={linkItemStyle}
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
                                    {project.title}
                                </h3>
                                <span style={{
                                    fontSize: '0.75rem',
                                    opacity: 0.5,
                                }}>
                                    {project.subtitle}
                                </span>
                            </div>
                            <span style={{
                                fontSize: '0.85rem',
                                opacity: 0.4,
                                marginLeft: '12px',
                                flexShrink: 0,
                            }}>
                                &#x2197;
                            </span>
                        </motion.a>
                    </motion.div>
                ))}

                {/* Harp — interactive sphere */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: projects.length * 0.05 }}
                    style={{
                        borderBottom: '1px solid rgba(0,0,0,0.08)',
                    }}
                >
                    <motion.button
                        onClick={() => enterHarp()}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                        style={linkItemStyle}
                    >
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                                margin: 0,
                                fontSize: '1rem',
                                fontWeight: '500',
                            }}>
                                Harp
                            </h3>
                            <span style={{
                                fontSize: '0.75rem',
                                opacity: 0.5,
                            }}>
                                Interactive audiovisual instrument
                            </span>
                        </div>
                        <span style={{
                            fontSize: '0.85rem',
                            opacity: 0.4,
                            marginLeft: '12px',
                            flexShrink: 0,
                        }}>
                            &#x2192;
                        </span>
                    </motion.button>
                </motion.div>

                {/* Mixes Section */}
                <p style={{ ...sectionLabelStyle, paddingTop: '28px' }}>Mixes</p>
                {works.map((work, index) => (
                    <motion.div
                        key={work.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (projects.length + 1 + index) * 0.05 }}
                        style={{
                            borderBottom: index < works.length - 1
                                ? '1px solid rgba(0,0,0,0.08)'
                                : 'none',
                        }}
                    >
                        {work.youtubeId ? (
                            <>
                                {/* Accordion Header */}
                                <motion.button
                                    onClick={() => toggleItem(work.id, work.title)}
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
                                        &#x25BC;
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
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </>
                        ) : (
                            /* Link-only mix (no YouTube embed) */
                            <motion.a
                                href={work.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackOutboundClick(work.url, work.title)}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                                style={linkItemStyle}
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
                                        {work.subtitle}{work.date ? ` · ${work.date}` : ''}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    opacity: 0.4,
                                    marginLeft: '12px',
                                    flexShrink: 0,
                                }}>
                                    &#x2197;
                                </span>
                            </motion.a>
                        )}
                    </motion.div>
                ))}

                {/* Shows Section */}
                {(shows.upcoming.length > 0 || shows.past.length > 0) && (
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                        {shows.upcoming.length > 0 && (
                            <>
                                <p style={{ ...sectionLabelStyle, paddingTop: '28px' }}>Upcoming Shows</p>
                                {shows.upcoming.map((show, index) => (
                                    <motion.div
                                        key={show.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (projects.length + 1 + works.length + index) * 0.05 }}
                                        style={{
                                            borderBottom: '1px solid rgba(0,0,0,0.08)',
                                        }}
                                    >
                                        <motion.a
                                            href={show.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => trackOutboundClick(show.url, show.title)}
                                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                                            style={linkItemStyle}
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
                                                    {show.title}
                                                </h3>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    opacity: 0.5,
                                                }}>
                                                    {show.venue}{show.date ? ` · ${show.date}` : ''}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                opacity: 0.4,
                                                marginLeft: '12px',
                                                flexShrink: 0,
                                            }}>
                                                &#x2197;
                                            </span>
                                        </motion.a>
                                    </motion.div>
                                ))}
                            </>
                        )}
                        {shows.past.length > 0 && (
                            <>
                                <p style={{ ...sectionLabelStyle, paddingTop: shows.upcoming.length > 0 ? '12px' : '28px' }}>Past Shows</p>
                                {shows.past.map((show, index) => (
                                    <motion.div
                                        key={show.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: (projects.length + 1 + works.length + shows.upcoming.length + index) * 0.05 }}
                                        style={{
                                            borderBottom: index < shows.past.length - 1
                                                ? '1px solid rgba(0,0,0,0.08)'
                                                : 'none',
                                        }}
                                    >
                                        <motion.a
                                            href={show.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={() => trackOutboundClick(show.url, show.title)}
                                            whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                                            style={linkItemStyle}
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
                                                    {show.title}
                                                </h3>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    opacity: 0.5,
                                                }}>
                                                    {show.venue}{show.date ? ` · ${show.date}` : ''}
                                                </span>
                                            </div>
                                            <span style={{
                                                fontSize: '0.85rem',
                                                opacity: 0.4,
                                                marginLeft: '12px',
                                                flexShrink: 0,
                                            }}>
                                                &#x2197;
                                            </span>
                                        </motion.a>
                                    </motion.div>
                                ))}
                            </>
                        )}
                    </div>
                )}

                {/* Releases Section */}
                {releases.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                        <p style={{ ...sectionLabelStyle, paddingTop: '28px' }}>Releases</p>
                        {releases.map((release, index) => (
                            <motion.div
                                key={release.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    borderBottom: index < releases.length - 1
                                        ? '1px solid rgba(0,0,0,0.08)'
                                        : 'none',
                                }}
                            >
                                <motion.a
                                    href={release.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => trackOutboundClick(release.url, release.title)}
                                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                                    style={linkItemStyle}
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
                                            {release.title}
                                        </h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            opacity: 0.5,
                                        }}>
                                            {release.artist}{release.date ? ` · ${release.date}` : ''}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '0.85rem',
                                        opacity: 0.4,
                                        marginLeft: '12px',
                                        flexShrink: 0,
                                    }}>
                                        &#x2197;
                                    </span>
                                </motion.a>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Press Section */}
                <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                    <p style={{ ...sectionLabelStyle, paddingTop: '28px' }}>Press</p>
                    {press.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: (projects.length + 1 + works.length + index) * 0.05 }}
                            style={{
                                borderBottom: index < press.length - 1
                                    ? '1px solid rgba(0,0,0,0.08)'
                                    : 'none',
                            }}
                        >
                            <motion.a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => trackOutboundClick(item.url, item.title)}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                                style={linkItemStyle}
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
                                        {item.title}
                                    </h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        opacity: 0.5,
                                    }}>
                                        {item.source}{item.date ? ` · ${item.date}` : ''}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '0.85rem',
                                    opacity: 0.4,
                                    marginLeft: '12px',
                                    flexShrink: 0,
                                }}>
                                    &#x2197;
                                </span>
                            </motion.a>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
