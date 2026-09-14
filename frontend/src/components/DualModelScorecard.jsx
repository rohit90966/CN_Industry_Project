import React from 'react';
import { motion } from 'motion/react';
import { Brain, Cpu } from 'lucide-react';

function ConfidenceGauge({ value, color, label }) {
  const percent = Math.round(value * 100);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (value * circumference);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)' }}>
      <div style={{ position: 'relative', width: 88, height: 88 }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke="var(--surface-3)"
            strokeWidth="6"
          />
          <motion.circle
            cx="44" cy="44" r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '44px 44px',
            }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              fontSize: 20,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-0)',
            }}
          >
            {percent}
          </motion.span>
        </div>
      </div>
      <span style={{
        fontSize: 11,
        color: 'var(--text-2)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
    </div>
  );
}

export default function DualModelScorecard({ classifierResult, anomalyResult }) {
  if (!classifierResult && !anomalyResult) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 'var(--space-4)',
      }}
    >
      {/* Classifier Card */}
      {classifierResult && (
        <div className="surface-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-classifier-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Brain size={14} color="var(--accent-classifier)" />
            </div>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-0)',
              }}>
                Classification
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
              }}>
                ResNet-50 Binary
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-3)',
                marginBottom: 'var(--space-1)',
              }}>
                Prediction
              </div>
              <span className={`badge ${classifierResult.label === 'OK' ? 'badge-pass' : 'badge-fail'}`}>
                {classifierResult.label}
              </span>
            </div>
            <ConfidenceGauge
              value={classifierResult.confidence}
              color="var(--accent-classifier)"
              label="confidence"
            />
          </div>

          {classifierResult.inference_time && (
            <div style={{
              marginTop: 'var(--space-3)',
              fontSize: 11,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              display: 'flex',
              justifyContent: 'space-between',
            }}>
              <span>Inference</span>
              <span>{classifierResult.inference_time}ms</span>
            </div>
          )}
        </div>
      )}

      {/* Anomaly Card */}
      {anomalyResult && (
        <div className="surface-card" style={{ padding: 'var(--space-5)' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            marginBottom: 'var(--space-4)',
          }}>
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-anomaly-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Cpu size={14} color="var(--accent-anomaly)" />
            </div>
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-0)',
              }}>
                Anomaly Detection
              </div>
              <div style={{
                fontSize: 10,
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
              }}>
                Autoencoder
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <ConfidenceGauge
              value={Math.min(anomalyResult.anomaly_score * 10, 1)}
              color="var(--accent-anomaly)"
              label="anomaly score"
            />
          </div>

          <div style={{
            marginTop: 'var(--space-3)',
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-2)',
            textAlign: 'center',
          }}>
            Score: {anomalyResult.anomaly_score?.toFixed(4)}
          </div>

          {anomalyResult.defect_region && (
            <div style={{
              marginTop: 'var(--space-2)',
              fontSize: 11,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
              textAlign: 'center',
            }}>
              Region: {anomalyResult.defect_region}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
