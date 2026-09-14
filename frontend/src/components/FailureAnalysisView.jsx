import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, TrendingDown, Eye, ChevronDown, Maximize2, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';
import { inspectionApi, FAILURE_CASES } from '../services/mockApi';

function FailureCaseCard({ caseItem }) {
  return (
    <div className="surface-card" style={{ padding: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
        <div>
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {caseItem.case_id} • {caseItem.component}
          </span>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', marginTop: 2 }}>
            {caseItem.title}
          </div>
        </div>
        <span className={`badge ${caseItem.fused_verdict.includes('PASS') ? 'badge-fail' : 'badge-review'}`}>
          {caseItem.fused_verdict}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', padding: '4px 8px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
            Raw Component
          </div>
          <img src={caseItem.image_url} alt="Raw" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: 'var(--surface-0)' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', padding: '4px 8px', background: 'var(--surface-2)', borderBottom: '1px solid var(--border-subtle)' }}>
            Reconstruction Heatmap
          </div>
          <img src={caseItem.heatmap_url} alt="Heatmap" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block' }} />
        </div>
      </div>

      <div style={{ background: 'var(--surface-2)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: 11, lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--fail)', display: 'block', marginBottom: 2 }}>Root Cause Analysis:</strong>
        <span style={{ color: 'var(--text-2)' }}>{caseItem.what_went_wrong}</span>
      </div>

      <div style={{ background: 'var(--accent-primary-muted)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-primary-border)', fontSize: 11, lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--accent-primary)', display: 'block', marginBottom: 2 }}>Inspector Corrective Action:</strong>
        <span style={{ color: 'var(--text-1)' }}>{caseItem.inspector_recommendation}</span>
      </div>
    </div>
  );
}

function DefectCard({ item, index }) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.4), duration: 0.35 }}
      className="surface-card"
      style={{
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail */}
      <div style={{
        position: 'relative',
        aspectRatio: '1',
        overflow: 'hidden',
        background: 'var(--surface-3)',
      }}>
        {item.overlay_image_url ? (
          <img
            src={item.overlay_image_url}
            alt={`Defect in ${item.category}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: hovered ? 'scale(1.05)' : 'scale(1)',
              transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Eye size={24} color="var(--text-3)" />
          </div>
        )}

        {/* Hover overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 200ms',
        }}>
          <Maximize2 size={20} color="white" />
        </div>

        {/* Verdict badge */}
        <div style={{
          position: 'absolute',
          top: 8,
          right: 8,
        }}>
          <span className={`badge ${item.verdict === 'FAIL' ? 'badge-fail' : 'badge-review'}`}>
            {item.verdict}
          </span>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: 'var(--space-3)' }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-0)',
          textTransform: 'capitalize',
          marginBottom: 'var(--space-1)',
        }}>
          {item.category?.replace('_', ' ')}
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)',
        }}>
          <span>Score: {item.anomaly_score?.toFixed(3)}</span>
          <span>{(item.confidence * 100).toFixed(0)}%</span>
        </div>

        {item.defect_region && (
          <div style={{
            marginTop: 'var(--space-2)',
            fontSize: 10,
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
            padding: '3px 6px',
            background: 'var(--surface-3)',
            borderRadius: 'var(--radius-xs)',
            display: 'inline-block',
          }}>
            {item.defect_region}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function FailureAnalysisView() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const data = await inspectionApi.getHistory();
        const items = Array.isArray(data) ? data : (data?.items || []);
        setHistory(items);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const historyList = useMemo(() => Array.isArray(history) ? history : (history?.items || []), [history]);

  const failures = useMemo(() => {
    const items = historyList.filter(h => h.verdict === 'FAIL' || h.verdict === 'REVIEW');
    if (categoryFilter !== 'all') {
      return items.filter(h => h.category === categoryFilter);
    }
    return items;
  }, [historyList, categoryFilter]);

  const categories = useMemo(() => {
    const cats = [...new Set(historyList.filter(h => h.verdict === 'FAIL' || h.verdict === 'REVIEW').map(h => h.category))];
    return cats;
  }, [historyList]);

  const failCount = historyList.filter(h => h.verdict === 'FAIL').length;
  const reviewCount = historyList.filter(h => h.verdict === 'REVIEW').length;

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="skeleton" style={{ height: 32, width: 240 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64 }} />
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)' }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 260 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: 'var(--space-6)',
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--space-5)',
    }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
          Failure Analysis
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 'var(--space-1)' }}>
          Detailed view of defect detections and anomalies flagged for review.
        </div>
      </div>

      {/* Summary strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 'var(--space-3)',
      }}>
        <div className="surface-card" style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <AlertTriangle size={16} color="var(--fail)" />
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--fail)',
            }}>
              {failCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Defects</div>
          </div>
        </div>

        <div className="surface-card" style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <Eye size={16} color="var(--review)" />
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--review)',
            }}>
              {reviewCount}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>In Review</div>
          </div>
        </div>

        <div className="surface-card" style={{
          padding: 'var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <TrendingDown size={16} color="var(--text-2)" />
          <div>
            <div style={{
              fontSize: 18,
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              color: 'var(--text-0)',
            }}>
              {categories.length}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>Categories Affected</div>
          </div>
        </div>
      </div>

      {/* Failure Modes Deep Dive */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <ShieldAlert size={16} color="var(--fail)" />
            Failure Mode Engineering Case Studies
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
            Root-cause analysis for Small Defect Missed & Specular Reflection Variation failure modes.
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 'var(--space-4)' }}>
          {FAILURE_CASES.map((item) => (
            <FailureCaseCard key={item.case_id} caseItem={item} />
          ))}
        </div>
      </div>

      <div style={{
        height: 1,
        background: 'var(--border-subtle)',
        margin: 'var(--space-2) 0'
      }} />

      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)' }}>
          Historical Defect Log
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
          Individual flagged parts with anomaly heatmaps from live production runs.
        </div>
      </div>

      {/* Category filter */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Filter:</span>
        <div style={{ position: 'relative' }}>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              height: 32,
              fontSize: 12,
              minWidth: 140,
              appearance: 'none',
              paddingRight: 28,
              cursor: 'pointer',
            }}
          >
            <option value="all">All categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c?.replace('_', ' ')}</option>
            ))}
          </select>
          <ChevronDown size={13} style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-3)',
            pointerEvents: 'none',
          }} />
        </div>

        <span style={{
          fontSize: 12,
          color: 'var(--text-3)',
          fontFamily: 'var(--font-mono)',
          marginLeft: 'auto',
        }}>
          {failures.length} result{failures.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Defect gallery */}
      {failures.length === 0 ? (
        <div className="surface-card" style={{
          padding: 'var(--space-10)',
          textAlign: 'center',
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius-lg)',
            background: 'var(--surface-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto var(--space-3)',
          }}>
            <AlertTriangle size={20} color="var(--text-3)" />
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
            No failures found
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 'var(--space-2)' }}>
            All inspections have passed. Adjust filters if needed.
          </div>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}>
          {failures.map((item, i) => (
            <DefectCard key={item.id || i} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
