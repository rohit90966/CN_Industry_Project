import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const VERDICT_CONFIG = {
  PASS: {
    icon: CheckCircle,
    label: 'Passed',
    color: 'var(--pass)',
    bg: 'var(--pass-muted)',
    border: 'var(--pass-border)',
    badgeClass: 'badge-pass',
  },
  FAIL: {
    icon: XCircle,
    label: 'Defect Detected',
    color: 'var(--fail)',
    bg: 'var(--fail-muted)',
    border: 'var(--fail-border)',
    badgeClass: 'badge-fail',
  },
  REVIEW: {
    icon: AlertCircle,
    label: 'Manual Review',
    color: 'var(--review)',
    bg: 'var(--review-muted)',
    border: 'var(--review-border)',
    badgeClass: 'badge-review',
  },
};

export default function VerdictBanner({ verdict, confidence, defectRegion }) {
  if (!verdict) return null;

  const config = VERDICT_CONFIG[verdict] || VERDICT_CONFIG.REVIEW;
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-4)',
        padding: 'var(--space-4) var(--space-5)',
        borderRadius: 'var(--radius-md)',
        background: config.bg,
        border: `1px solid ${config.border}`,
      }}
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.1 }}
      >
        <Icon size={24} color={config.color} strokeWidth={2} />
      </motion.div>

      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <span className={`badge ${config.badgeClass}`}>
            {verdict}
          </span>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: config.color,
          }}>
            {config.label}
          </span>
        </div>
        {(confidence != null || defectRegion) && (
          <div style={{
            marginTop: 'var(--space-1)',
            fontSize: 12,
            color: 'var(--text-2)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            gap: 'var(--space-4)',
          }}>
            {confidence != null && (
              <span>Confidence: {(confidence * 100).toFixed(1)}%</span>
            )}
            {defectRegion && (
              <span>Region: {defectRegion}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
