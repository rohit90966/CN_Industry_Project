import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Loader2, Image as ImageIcon, RotateCcw, CheckCircle2, AlertOctagon, Sparkles } from 'lucide-react';
import VerdictBanner from './VerdictBanner';
import DualModelScorecard from './DualModelScorecard';
import ImageCompareSlider from './ImageCompareSlider';
import { inspectionApi, SAMPLE_COMPONENTS } from '../services/mockApi';

const STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  RESULT: 'result',
  ERROR: 'error',
};

function SkeletonCard({ height = 120 }) {
  return (
    <div className="skeleton" style={{ height, width: '100%', borderRadius: 'var(--radius-md)' }} />
  );
}

export default function InspectionView({ selectedCategory }) {
  const [state, setState] = useState(STATES.IDLE);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [activeSampleId, setActiveSampleId] = useState(null);

  const runInspection = useCallback(async (target) => {
    setState(STATES.LOADING);
    setError(null);
    try {
      if (target && target.originalUrl) {
        setPreviewSrc(target.originalUrl);
        setActiveSampleId(target.id);
      }
      const response = await inspectionApi.predict(target || 'mock_upload.jpg', selectedCategory);
      setResult(response);
      setState(STATES.RESULT);
    } catch (err) {
      setError(err.message || 'Inspection failed');
      setState(STATES.ERROR);
    }
  }, [selectedCategory]);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewSrc(ev.target.result);
    reader.readAsDataURL(file);
    runInspection(file);
  }, [runInspection]);

  const handleDemoInspect = useCallback(() => {
    setPreviewSrc(null);
    runInspection(null);
  }, [runInspection]);

  const handleReset = useCallback(() => {
    setState(STATES.IDLE);
    setResult(null);
    setError(null);
    setPreviewSrc(null);
    setActiveSampleId(null);
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.4fr',
      gap: 'var(--space-6)',
      padding: 'var(--space-6)',
      minHeight: 'calc(100dvh - 48px)',
      alignContent: 'start',
    }}>
      {/* Left Panel - Upload & Preview */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-0)',
        }}>
          Inspection
        </div>

        {/* Upload Zone */}
        <label
          htmlFor="file-upload"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
            padding: 'var(--space-8)',
            borderRadius: 'var(--radius-md)',
            border: '2px dashed var(--border-default)',
            background: 'var(--surface-2)',
            cursor: 'pointer',
            transition: 'border-color 200ms, background 200ms',
            minHeight: 200,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--accent-primary)';
            e.currentTarget.style.background = 'var(--accent-primary-muted)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border-default)';
            e.currentTarget.style.background = 'var(--surface-2)';
          }}
        >
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Upload size={20} color="var(--text-2)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
              Drop image or click to upload
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 'var(--space-1)' }}>
              PNG, JPG up to 10MB
            </div>
          </div>
        </label>

        {/* Quick Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <motion.button
            onClick={handleDemoInspect}
            disabled={state === STATES.LOADING}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '10px var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 'var(--space-2)',
              opacity: state === STATES.LOADING ? 0.6 : 1,
            }}
          >
            {state === STATES.LOADING ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Loader2 size={14} />
              </motion.div>
            ) : (
              <ImageIcon size={14} />
            )}
            {state === STATES.LOADING ? 'Analyzing...' : 'Run Demo'}
          </motion.button>

          {state === STATES.RESULT && (
            <motion.button
              onClick={handleReset}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--surface-3)',
                color: 'var(--text-2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={14} />
            </motion.button>
          )}
        </div>

        {/* Preview Image */}
        <AnimatePresence mode="wait">
          {(previewSrc || result?.original_image_url) && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="surface-card"
              style={{ overflow: 'hidden' }}
            >
              <img
                src={previewSrc || result?.original_image_url}
                alt="Component preview"
                style={{
                  width: '100%',
                  aspectRatio: '1',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Factory Camera Presets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)'
          }}>
            <Sparkles size={12} color="var(--accent-primary)" />
            Calibration & Benchmark Presets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {SAMPLE_COMPONENTS.map((sample) => {
              const isSelected = activeSampleId === sample.id;
              const verdict = sample.simulatedResult.verdict;
              const badgeClass = verdict === 'PASS' ? 'badge-pass' : verdict === 'FAIL' ? 'badge-fail' : 'badge-review';
              return (
                <motion.button
                  key={sample.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => runInspection(sample)}
                  disabled={state === STATES.LOADING}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: isSelected ? 'var(--surface-3)' : 'var(--surface-2)',
                    border: isSelected ? '1px solid var(--border-hover)' : '1px solid var(--border-subtle)',
                    cursor: state === STATES.LOADING ? 'not-allowed' : 'pointer',
                    textAlign: 'left',
                    transition: 'all 150ms',
                    width: '100%',
                  }}
                >
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 'var(--radius-xs)',
                    overflow: 'hidden',
                    background: 'var(--surface-1)',
                    flexShrink: 0,
                    border: '1px solid var(--border-subtle)'
                  }}>
                    <img src={sample.originalUrl} alt={sample.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: isSelected ? 'var(--text-0)' : 'var(--text-1)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {sample.name}
                    </div>
                    <div style={{
                      fontSize: 10,
                      color: 'var(--text-3)',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {sample.category} • Score: {sample.simulatedResult.anomaly_score}
                    </div>
                  </div>
                  <span className={`badge ${badgeClass}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                    {verdict}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Panel - Results */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div style={{
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.02em',
          color: 'var(--text-0)',
        }}>
          Results
        </div>

        <AnimatePresence mode="wait">
          {state === STATES.IDLE && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="surface-card"
              style={{
                padding: 'var(--space-10)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--space-3)',
                minHeight: 300,
              }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <ImageIcon size={24} color="var(--text-3)" />
              </div>
              <div style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-1)',
              }}>
                No inspection results yet
              </div>
              <div style={{
                fontSize: 12,
                color: 'var(--text-3)',
                textAlign: 'center',
                maxWidth: 280,
                lineHeight: 1.6,
              }}>
                Upload a component image or run a demo inspection to see the dual-model analysis.
              </div>
            </motion.div>
          )}

          {state === STATES.LOADING && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              <SkeletonCard height={72} />
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 'var(--space-4)' }}>
                <SkeletonCard height={200} />
                <SkeletonCard height={200} />
              </div>
              <SkeletonCard height={300} />
            </motion.div>
          )}

          {state === STATES.ERROR && (
            <motion.div
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="surface-card"
              style={{
                padding: 'var(--space-6)',
                borderColor: 'var(--fail-border)',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--fail)', marginBottom: 'var(--space-2)' }}>
                Inspection Failed
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)' }}>{error}</div>
            </motion.div>
          )}

          {state === STATES.RESULT && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-4)',
              }}
            >
              <VerdictBanner
                verdict={result.verdict}
                confidence={result.confidence}
                defectRegion={result.defect_region}
              />

              <DualModelScorecard
                classifierResult={{
                  label: result.label,
                  confidence: result.confidence,
                  inference_time: result.inference_time_ms,
                }}
                anomalyResult={{
                  anomaly_score: result.anomaly_score,
                  defect_region: result.defect_region,
                }}
              />

              {result.original_image_url && result.overlay_image_url && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ImageCompareSlider
                    originalSrc={result.original_image_url}
                    overlaySrc={result.overlay_image_url}
                  />
                </motion.div>
              )}

              {/* Metadata strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-2)',
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--text-3)',
                }}
              >
                <span>Category: {selectedCategory}</span>
                <span>Timestamp: {new Date(result.timestamp || Date.now()).toLocaleTimeString()}</span>
                {result.inference_time_ms && <span>Latency: {result.inference_time_ms}ms</span>}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
