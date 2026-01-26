import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

// API URL - in prod use env
const API_URL = 'http://localhost:3000/works';

export default function Work() {
    const [works, setWorks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        axios.get(API_URL)
            .then(res => {
                setWorks(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch works", err);
                setLoading(false);
            });
    }, []);

    if (loading) return <div className="p-10 text-center">Loading...</div>;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            padding: '80px 40px',
            overflowY: 'auto',
            zIndex: 10,
            pointerEvents: 'auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
        }}>
            {works.map((work, index) => (
                <motion.div
                    key={work.id}
                    layoutId={`card-${work.id}`}
                    onClick={() => setExpandedId(expandedId === work.id ? null : work.id)}
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass"
                    style={{
                        padding: '2rem',
                        borderRadius: '16px',
                        cursor: 'pointer',
                        height: expandedId === work.id ? 'auto' : '200px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: expandedId === work.id ? 'flex-start' : 'center'
                    }}
                >
                    <motion.h2 layoutId={`title-${work.id}`} style={{ fontSize: '1.5rem', margin: 0 }}>
                        {work.title}
                    </motion.h2>
                    <motion.p layoutId={`date-${work.id}`} style={{ opacity: 0.6, fontSize: '0.9rem' }}>
                        {work.date}
                    </motion.p>

                    {expandedId === work.id && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ marginTop: '1rem' }}
                        >
                            <h3 style={{ fontWeight: 400 }}>{work.subtitle}</h3>
                            <p style={{ lineHeight: 1.6 }}>{work.content}</p>
                            {work.image && <img src={work.image} alt={work.title} style={{ width: '100%', borderRadius: '8px', marginTop: '1rem' }} />}
                        </motion.div>
                    )}
                </motion.div>
            ))}
        </div>
    );
}
