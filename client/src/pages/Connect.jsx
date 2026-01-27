import { useState } from 'react';
import { motion } from 'framer-motion';

const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    marginBottom: '12px',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: '8px',
    color: '#1a1a1a',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s ease, background 0.2s ease',
    boxSizing: 'border-box',
};

const inputFocusStyle = {
    borderColor: 'rgba(0,0,0,0.2)',
    background: 'rgba(0,0,0,0.05)',
};

export default function Connect() {
    const [name, setName] = useState('');
    const [message, setMessage] = useState('');
    const [focusedField, setFocusedField] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const subject = encodeURIComponent(`Hello from ${name || 'a visitor'}`);
        const body = encodeURIComponent(message);
        
        window.location.href = `mailto:hello@rmzi.world?subject=${subject}&body=${body}`;
    };

    const getInputStyle = (field) => ({
        ...inputStyle,
        ...(focusedField === field ? inputFocusStyle : {}),
    });

    return (
        <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90%',
            maxWidth: '400px',
            zIndex: 10,
            pointerEvents: 'auto',
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
                <h2 style={{ 
                    margin: '0 0 1.5rem', 
                    fontSize: '1.3rem',
                    fontWeight: '400',
                    textAlign: 'center',
                }}>
                    Get in touch
                </h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        style={getInputStyle('name')}
                        required
                    />
                    
                    <textarea
                        placeholder="Message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onFocus={() => setFocusedField('message')}
                        onBlur={() => setFocusedField(null)}
                        rows={4}
                        style={{
                            ...getInputStyle('message'),
                            resize: 'none',
                            fontFamily: 'inherit',
                        }}
                        required
                    />

                    <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02, background: '#333' }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            width: '100%',
                            padding: '14px',
                            marginTop: '8px',
                            background: '#1a1a1a',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '0.95rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            transition: 'background 0.2s ease',
                        }}
                    >
                        Send Message
                    </motion.button>
                </form>

                <p style={{
                    marginTop: '1.5rem',
                    marginBottom: 0,
                    fontSize: '0.8rem',
                    opacity: 0.5,
                    textAlign: 'center',
                }}>
                    or email directly at{' '}
                    <a 
                        href="mailto:hello@rmzi.world" 
                        style={{ color: '#1a1a1a', textDecoration: 'underline' }}
                    >
                        hello@rmzi.world
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
