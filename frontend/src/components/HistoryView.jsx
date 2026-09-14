import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ChevronDown, Clock, ArrowUpRight } from 'lucide-react';
import { inspectionApi } from '../services/mockApi';
import InspectionDetailModal from './InspectionDetailModal';

function StatTile({ label, value, color }) {
  return (
    <div className="surface-card" style={{ padding: 'var(--space-4)' }}>
      <div style={{
        fontSize: 11,
        color: 'var(--text-3)',
        marginBottom: 'var(--space-1)',
        fontFamily: 'var(--font-mono)',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 24,
        fontWeight: 700,
        fontFamily: 'var(--font-mono)',
        color: color || 'var(--text-0)',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
    </div>
  );
}

export default function HistoryView() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [histData, statsData] = await Promise.all([
          inspectionApi.getHistory(),
          inspectionApi.getStats(),
        ]);
        const items = Array.isArray(histData) ? histData : (histData?.items || []);
        setHistory(items);
        setStats(statsData);
      } catch (err) {
        console.error('Failed to load history:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    const list = Array.isArray(history) ? history : (history?.items || []);
    return list.filter(item => {
      if (verdictFilter !== 'all' && item.verdict !== verdictFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item.category?.toLowerCase().includes(q) ||
          item.verdict?.toLowerCase().includes(q) ||
          item.label?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [history, verdictFilter, searchQuery]);

  const verdictBadge = (v) => {
    const map = { PASS: 'badge-pass', FAIL: 'badge-fail', REVIEW: 'badge-review' };
    return <span className={`badge ${map[v] || ''}`}>{v}</span>;
  };

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="skeleton" style={{ height: 32, width: 200 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-4)' }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 80 }} />
          ))}
        </div>
        <div className="skeleton" style={{ height: 44 }} />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 48 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>
        Inspection History
      </div>

      {/* Stats Row */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 'var(--space-4)',
          }}
        >
          <StatTile label="Total" value={stats.total_inspections || history.length} />
          <StatTile label="Pass Rate" value={`${stats.pass_rate || 0}%`} color="var(--pass)" />
          <StatTile label="Fail Rate" value={`${stats.fail_rate || 0}%`} color="var(--fail)" />
          <StatTile label="Avg Latency" value={`${stats.avg_inference_ms || 0}ms`} color="var(--accent-classifier)" />
        </motion.div>
      )}

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'center',
      }}>
        <div style={{
          flex: 1,
          position: 'relative',
        }}>
          <Search size={14} style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-3)',
            pointerEvents: 'none',
          }} />
          <input
            type="text"
            placeholder="Search by category, verdict..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 36,
              height: 36,
              fontSize: 12,
            }}
          />
        </div>

        <div style={{ position: 'relative' }}>
          <Filter size={13} style={{
            position: 'absolute',
            left: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-3)',
            pointerEvents: 'none',
          }} />
          <select
            value={verdictFilter}
            onChange={(e) => setVerdictFilter(e.target.value)}
            style={{
              paddingLeft: 30,
              height: 36,
              fontSize: 12,
              minWidth: 120,
              appearance: 'none',
              paddingRight: 28,
              cursor: 'pointer',
            }}
          >
            <option value="all">All verdicts</option>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
            <option value="REVIEW">Review</option>
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
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="surface-card" style={{
          padding: 'var(--space-10)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)', marginBottom: 'var(--space-2)' }}>
            No results found
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {searchQuery || verdictFilter !== 'all'
              ? 'Try adjusting your search or filter criteria.'
              : 'No inspections have been recorded yet. Run an inspection to see results here.'
            }
          </div>
        </div>
      ) : (
        <div className="surface-card" style={{ overflow: 'hidden' }}>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Category</th>
                <th>Verdict</th>
                <th>Confidence</th>
                <th>Anomaly</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item, index) => (
                <motion.tr
                  key={item.id || index}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setSelectedItem(item)}
                >
                  <td>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-2)',
                      color: 'var(--text-2)',
                    }}>
                      <Clock size={12} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: 'var(--text-1)',
                    }}>
                      {item.category?.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{verdictBadge(item.verdict)}</td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--text-1)',
                    }}>
                      {(item.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 12,
                      color: 'var(--text-2)',
                    }}>
                      {item.anomaly_score?.toFixed(4)}
                    </span>
                  </td>
                  <td>
                    <ArrowUpRight size={13} color="var(--text-3)" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      <InspectionDetailModal
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
