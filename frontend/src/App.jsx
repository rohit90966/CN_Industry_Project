import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Sidebar from './components/Header';
import InspectionView from './components/InspectionView';
import HistoryView from './components/HistoryView';
import ModelComparisonView from './components/ModelComparisonView';
import FailureAnalysisView from './components/FailureAnalysisView';
import { inspectionApi } from './services/mockApi';

const VIEW_MAP = {
  inspect: InspectionView,
  history: HistoryView,
  models: ModelComparisonView,
  failures: FailureAnalysisView,
};

export default function App() {
  const [activeTab, setActiveTab] = useState('inspect');
  const [selectedCategory, setSelectedCategory] = useState('fan_blade');
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    inspectionApi.getHealth().then(health => setSystemHealth(health));
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const keyMap = { F1: 'inspect', F2: 'history', F3: 'models', F4: 'failures' };
      if (keyMap[e.key]) {
        e.preventDefault();
        setActiveTab(keyMap[e.key]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const ActiveView = VIEW_MAP[activeTab];

  return (
    <div style={{
      display: 'flex',
      minHeight: '100dvh',
      background: 'var(--surface-0)',
    }}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        systemHealth={systemHealth}
      />

      <main style={{
        flex: 1,
        marginLeft: 'var(--sidebar-width)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100dvh',
      }}>
        {/* Top bar */}
        <header style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 var(--space-6)',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
          height: 48,
          flexShrink: 0,
        }}>
          <div style={{
            fontSize: 12,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
          }}>
            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>DefectIQ Vision Suite</span>
            <span style={{ color: 'var(--border-default)' }}>/</span>
            <span style={{ color: 'var(--text-2)', textTransform: 'capitalize' }}>
              {selectedCategory.replace('_', ' ')}
            </span>
            <span style={{ color: 'var(--border-default)' }}>/</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 500, textTransform: 'uppercase' }}>
              Station 04 (Line A)
            </span>
          </div>

          <div style={{
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}>
            <span style={{ color: 'var(--text-3)' }}>
              Dual Model Inference: <strong style={{ color: 'var(--text-1)' }}>38.2ms</strong>
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 9px',
              borderRadius: 'var(--radius-pill)',
              background: 'var(--pass-muted)',
              color: 'var(--pass)',
              border: '1px solid var(--pass-border)',
              fontSize: 11,
              fontWeight: 600,
            }}>
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--pass)',
              }} />
              GPU Accelerated
            </span>
          </div>
        </header>

        {/* View content */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {ActiveView && (
                <ActiveView selectedCategory={selectedCategory} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Enterprise Footer */}
        <footer style={{
          padding: 'var(--space-3) var(--space-6)',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--surface-1)',
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>DefectIQ Machine Vision Platform v2.4</span>
            <span>•</span>
            <span>ResNet-50 Binary + CNN Autoencoder Heatmap Fusion</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span>Target Optical Resolution: 224x224 RGB</span>
            <span>•</span>
            <span style={{ color: 'var(--pass)', fontWeight: 600 }}>All Systems Nominal</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
