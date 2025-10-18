import React from 'react';
import styles from './AIOrb.module.css';

export interface AIOrbProps {
    className?: string;
    size?: number | string; // e.g., 200 or '200px'
    color?: string; // base color, CSS color value
}

export function AIOrb({ className = '', size = 200, color = 'hsl(217, 100%, 50%)' }: AIOrbProps) {
    const inlineStyle: React.CSSProperties = {
        // CSS variable-based customization for easy embedding
        // Accept both number (px) and string sizes
        ['--container-size' as any]: typeof size === 'number' ? `${size}px` : size,
        ['--ai-orb-base-color' as any]: color,
    };

    return (
        <div className={`${styles.aiOrb} ${className}`} style={inlineStyle} aria-hidden={true}>
            <div className={styles.orbsContainer}></div>
            <div className={styles.orbsContainer}>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
            </div>
            <div className={styles.orbsContainer}>
                <div className={styles.orbs}></div>
                <div className={styles.orbs}></div>
                <div className={styles.orbs}></div>
                <div className={styles.orbs}></div>
            </div>
            <div className={styles.orbsContainer}>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
                <div className={`${styles.orbs} ${styles.orbsLarge}`}></div>
            </div>
        </div>
    );
}


