import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, Cpu, ArrowRight, TrendingUp, BarChart3, Layers } from 'lucide-react';
import { inspectionApi } from '../services/mockApi';

function MetricRow({ label, value, subValue, color }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 'var(--space-3) 0',
    }}>
      <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{label}</span>
      <div style={{ textAlign: 'right' }}>
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          color: color || 'var(--text-0)',
        }}>
          {value}
        </span>
        {subValue && (
          <div style={{
            fontSize: 10,
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
          }}>
            {subValue}
          </div>
        )}
      </div>
    </div>
  );
}

function ModelCard({ title, subtitle, icon: Icon, iconBg, iconColor, metrics, accentColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="surface-card"
      style={{ padding: 'var(--space-5)' }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
        marginBottom: 'var(--space-4)',
        paddingBottom: 'var(--space-4)',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-md)',
          background: iconBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Icon size={18} color={iconColor} />
        </div>
        <div>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            color: 'var(--text-0)',
          }}>
            {title}
          </div>
          <div style={{
            fontSize: 11,
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
          }}>
            {subtitle}
          </div>
        </div>
      </div>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
      }}>
        {metrics.map((m, i) => (
          <React.Fragment key={m.label}>
            <MetricRow {...m} color={m.highlight ? accentColor : undefined} />
            {i < metrics.length - 1 && (
              <div style={{
                height: 1,
                background: 'rgba(63, 63, 70, 0.25)',
              }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </motion.div>
  );
}

export default function ModelComparisonView() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await inspectionApi.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div className="skeleton" style={{ height: 32, width: 240 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
          <div className="skeleton" style={{ height: 400 }} />
          <div className="skeleton" style={{ height: 400 }} />
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
          Model Comparison
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 'var(--space-1)' }}>
          Performance metrics for both models running independently on each inspection image.
        </div>
      </div>

      {/* Architecture Overview */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="surface-card"
        style={{
          padding: 'var(--space-5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-6)',
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Layers size={18} color="var(--text-2)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>Input Image</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>224x224 RGB</div>
          </div>
        </div>

        <ArrowRight size={16} color="var(--text-3)" />

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-classifier-muted)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent-classifier)',
          }}>
            <Brain size={12} />
            Classification
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--accent-anomaly-muted)',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--accent-anomaly)',
          }}>
            <Cpu size={12} />
            Anomaly Detection
          </div>
        </div>

        <ArrowRight size={16} color="var(--text-3)" />

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-3)',
          fontSize: 13,
          fontWeight: 600,
          color: 'var(--text-0)',
        }}>
          <BarChart3 size={14} />
          Final Verdict
        </div>
      </motion.div>

      {/* Model Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--space-5)',
      }}>
        <ModelCard
          title="Classification Model"
          subtitle="ResNet-50 / Binary Classifier"
          icon={Brain}
          iconBg="var(--accent-classifier-muted)"
          iconColor="var(--accent-classifier)"
          accentColor="var(--accent-classifier)"
          metrics={[
            { label: 'Architecture', value: 'ResNet-50' },
            { label: 'Task', value: 'Binary (OK/DEFECT)' },
            { label: 'Accuracy', value: `${stats?.classifier_accuracy || 94.2}%`, highlight: true },
            { label: 'Precision', value: `${stats?.classifier_precision || 92.8}%` },
            { label: 'Recall', value: `${stats?.classifier_recall || 95.1}%` },
            { label: 'F1 Score', value: `${stats?.classifier_f1 || 93.9}%` },
            { label: 'Avg Latency', value: `${stats?.classifier_latency || 45}ms`, subValue: 'GPU inference' },
            { label: 'Input Size', value: '224 x 224' },
            { label: 'Training Data', value: 'MVTec AD', subValue: 'Transfer learned' },
          ]}
        />

        <ModelCard
          title="Anomaly Detector"
          subtitle="Autoencoder / Reconstruction"
          icon={Cpu}
          iconBg="var(--accent-anomaly-muted)"
          iconColor="var(--accent-anomaly)"
          accentColor="var(--accent-anomaly)"
          metrics={[
            { label: 'Architecture', value: 'Conv AE' },
            { label: 'Task', value: 'Anomaly Localization' },
            { label: 'AUROC', value: `${stats?.anomaly_auroc || 96.3}%`, highlight: true },
            { label: 'Pixel AUROC', value: `${stats?.anomaly_pixel_auroc || 91.7}%` },
            { label: 'Threshold', value: `${stats?.anomaly_threshold || 0.042}` },
            { label: 'False Positive Rate', value: `${stats?.anomaly_fpr || 3.8}%` },
            { label: 'Avg Latency', value: `${stats?.anomaly_latency || 62}ms`, subValue: 'GPU inference' },
            { label: 'Input Size', value: '256 x 256' },
            { label: 'Output', value: 'Heatmap', subValue: 'Reconstruction error' },
          ]}
        />
      </div>

      {/* Agreement info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <TrendingUp size={16} color="var(--pass)" />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>
            Model Agreement Rate: {stats?.agreement_rate || 91.4}%
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
            When models disagree, the verdict is set to REVIEW for manual inspection.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
