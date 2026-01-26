import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_URL = 'http://localhost:3000/bio';

export default function Self() {
    const [bio, setBio] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(API_URL)
            .then(res => {
                // Bio is returned as an array [bio] based on my server implementation
                setBio(res.data[0]);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to fetch bio", err);
                setLoading(false);
            });
    }, []);

    if (loading) return null;

    return (
        <div style={{
            position: 'absolute',
            bottom: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '80%',
            maxWidth: '600px',
            zIndex: 10,
            pointerEvents: 'auto',
            textAlign: 'center'
        }}>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass"
                style={{
                    padding: '2rem',
                    borderRadius: '16px',
                }}
            >
                <p style={{ fontSize: '1.2rem', lineHeight: 1.6, margin: 0 }}>
                    {bio?.text || "No bio available."}
                </p>
            </motion.div>
        </div>
    );
}
