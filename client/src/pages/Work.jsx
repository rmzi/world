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

const Favicon = ({ url }) => {
    if (!url) return null;
    try {
        const domain = new URL(url).hostname;
        return (
            <img
                src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                alt=""
                style={{
                    width: 16,
                    height: 16,
                    marginRight: 12,
                    flexShrink: 0,
                    borderRadius: 2,
                    opacity: 0.6,
                }}
            />
        );
    } catch {
        return null;
    }
};

const linkItemStyle = {
    width: '100%',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    background: 'transparent',
    border: 'none',
    color: '#1a1a1a',
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: '8px',
    textDecoration: 'none',
    gap: '12px',
};

const LinkItem = ({ url, title, subtitle, onClick }) => (
    <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
        style={linkItemStyle}
    >
        <Favicon url={url} />
        <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
                margin: 0,
                fontSize: '1rem',
                fontWeight: '500',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
            }}>
                {title}
            </h3>
            <span style={{
                fontSize: '0.75rem',
                opacity: 0.5,
            }}>
                {subtitle}
            </span>
        </div>
        <span style={{
            fontSize: '0.85rem',
            opacity: 0.4,
            flexShrink: 0,
        }}>
            &#x2197;
        </span>
    </motion.a>
);

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
                        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                    >
                        <LinkItem
                            url={project.url}
                            title={project.title}
                            subtitle={project.subtitle}
                            onClick={() => trackOutboundClick(project.url, project.title)}
                        />
                    </motion.div>
                ))}

                {/* Harp — interactive sphere */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: projects.length * 0.05 }}
                    style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
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
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#1a1a1a',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        borderRadius: '8px',
                                        gap: '12px',
                                    }}
                                >
                                    <Favicon url={`https://www.youtube.com/watch?v=${work.youtubeId}`} />
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

                                    <motion.span
                                        animate={{ rotate: expandedId === work.id ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                        style={{
                                            fontSize: '1.2rem',
                                            opacity: 0.5,
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
                            <LinkItem
                                url={work.url}
                                title={work.title}
                                subtitle={`${work.subtitle}${work.date ? ` · ${work.date}` : ''}`}
                                onClick={() => trackOutboundClick(work.url, work.title)}
                            />
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
                                        style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}
                                    >
                                        <LinkItem
                                            url={show.url}
                                            title={show.title}
                                            subtitle={`${show.venue}${show.date ? ` · ${show.date}` : ''}`}
                                            onClick={() => trackOutboundClick(show.url, show.title)}
                                        />
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
                                        style={{
                                            borderBottom: index < shows.past.length - 1
                                                ? '1px solid rgba(0,0,0,0.08)'
                                                : 'none',
                                        }}
                                    >
                                        <LinkItem
                                            url={show.url}
                                            title={show.title}
                                            subtitle={`${show.venue}${show.date ? ` · ${show.date}` : ''}`}
                                            onClick={() => trackOutboundClick(show.url, show.title)}
                                        />
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
                                <LinkItem
                                    url={release.url}
                                    title={release.title}
                                    subtitle={`${release.artist}${release.date ? ` · ${release.date}` : ''}`}
                                    onClick={() => trackOutboundClick(release.url, release.title)}
                                />
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
                            style={{
                                borderBottom: index < press.length - 1
                                    ? '1px solid rgba(0,0,0,0.08)'
                                    : 'none',
                            }}
                        >
                            <LinkItem
                                url={item.url}
                                title={item.title}
                                subtitle={`${item.source}${item.date ? ` · ${item.date}` : ''}`}
                                onClick={() => trackOutboundClick(item.url, item.title)}
                            />
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
