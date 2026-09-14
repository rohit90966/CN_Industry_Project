import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, Target, Gauge } from 'lucide-react';

export default function InspectionDetailModal({ item, onClose }) {
  if (!item) return null;

  const verdictClass = {
    PASS: 'badge-pass',
    FAIL: 'badge-fail',
    REVIEW: 'badge-review',
  }[item.verdict] || '';

  return (
    <AnimatePresence>
      {item && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'var(--surface-overlay)',
              backdropFilter: 'blur(4px)',
              zIndex: 50,
            }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 51,
              width: '90%',
              maxWidth: 520,
              maxHeight: '85dvh',
              overflow: 'auto',
              background: 'var(--surface-1)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: 'var(--space-4) var(--space-5)',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <div style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--text-0)',
              }}>
                Inspection Detail
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-3)',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div style={{
              padding: 'var(--space-5)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
            }}>
              {/* Verdict + Category */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span className={`badge ${verdictClass}`} style={{ fontSize: 12 }}>
                  {item.verdict}
                </span>
                <span style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  textTransform: 'capitalize',
                }}>
                  {item.category?.replace('_', ' ')}
                </span>
              </div>

              {/* Image */}
              {item.original_image_url && (
                <div style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-subtle)',
                }}>
                  <img
                    src={item.overlay_image_url || item.original_image_url}
                    alt="Inspection"
                    style={{
                      width: '100%',
                      aspectRatio: '1',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                </div>
              )}

              {/* Metrics grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 'var(--space-3)',
              }}>
                <MetricItem
                  icon={Gauge}
                  label="Confidence"
                  value={`${(item.confidence * 100).toFixed(1)}%`}
                />
                <MetricItem
                  icon={Target}
                  label="Anomaly Score"
                  value={item.anomaly_score?.toFixed(4) || 'N/A'}
                />
                <MetricItem
                  icon={Clock}
                  label="Timestamp"
                  value={new Date(item.timestamp).toLocaleTimeString()}
                />
              </div>

              {/* Extra details */}
              {item.defect_region && (
                <div style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-2)',
                }}>
                  Defect Region: {item.defect_region}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function MetricItem({ icon: Icon, label, value }) {
  return (
    <div style={{
      padding: 'var(--space-3)',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--surface-2)',
      textAlign: 'center',
    }}>
      <Icon size={14} style={{ color: 'var(--text-3)', marginBottom: 'var(--space-1)' }} />
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-0)',
        marginBottom: 2,
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 10,
        color: 'var(--text-3)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        fontFamily: 'var(--font-mono)',
      }}>
        {label}
      </div>
    </div>
  );
}
