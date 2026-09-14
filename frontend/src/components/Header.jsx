import React from 'react';
import { motion } from 'motion/react';
import {
  ScanLine,
  History,
  GitCompare,
  AlertTriangle,
  Activity,
  ChevronDown,
  Zap,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'inspect', label: 'Inspection', icon: ScanLine, shortcut: 'F1' },
  { id: 'history', label: 'History', icon: History, shortcut: 'F2' },
  { id: 'models', label: 'Model Comparison', icon: GitCompare, shortcut: 'F3' },
  { id: 'failures', label: 'Failure Analysis', icon: AlertTriangle, shortcut: 'F4' },
];

const CATEGORIES = [
  { value: 'fan_blade', label: 'Fan Blade' },
  { value: 'motor_housing', label: 'Motor Housing' },
  { value: 'metal_nut', label: 'Metal Nut' },
  { value: 'screw', label: 'Screw' },
  { value: 'tile', label: 'Tile' },
  { value: 'carpet', label: 'Carpet' },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  selectedCategory,
  setSelectedCategory,
  systemHealth,
}) {
  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100dvh',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--surface-1)',
      borderRight: '1px solid var(--border-subtle)',
    }}>
      {/* Brand */}
      <div style={{
        padding: 'var(--space-5) var(--space-5)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-3)',
      }}>
        <div style={{
          width: 34,
          height: 34,
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, var(--accent-primary), #4338ca)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
        }}>
          <Zap size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <div>
          <div style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-0)',
            lineHeight: 1.2,
          }}>
            DefectIQ
          </div>
          <div style={{
            fontSize: 10,
            color: 'var(--text-3)',
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            fontWeight: 500,
          }}>
            Surface Defect AOI
          </div>
        </div>
      </div>

      {/* Category Selector */}
      <div style={{ padding: '0 var(--space-4) var(--space-4)' }}>
        <div style={{
          position: 'relative',
        }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 32px 8px 12px',
              fontSize: 12,
              fontWeight: 500,
              background: 'var(--surface-1)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-1)',
              cursor: 'pointer',
              appearance: 'none',
              boxShadow: 'var(--shadow-xs)',
            }}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: '0 var(--space-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
        <div style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--text-3)',
          padding: 'var(--space-2) var(--space-3)',
          fontFamily: 'var(--font-mono)',
        }}>
          Inspection Station
        </div>
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              whileHover={{ x: 2 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
                padding: '9px var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 13,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--accent-primary)' : 'var(--text-2)',
                background: isActive ? 'var(--accent-primary-muted)' : 'transparent',
                width: '100%',
                textAlign: 'left',
                position: 'relative',
                transition: 'background 150ms, color 150ms',
              }}
              onMouseEnter={e => {
                if (!isActive) e.currentTarget.style.background = 'var(--surface-2)';
              }}
              onMouseLeave={e => {
                if (!isActive) e.currentTarget.style.background = 'transparent';
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 3,
                    height: 18,
                    borderRadius: 'var(--radius-pill)',
                    background: 'var(--accent-primary)',
                  }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
              <span style={{ flex: 1 }}>{item.label}</span>
              <span style={{
                fontSize: 10,
                color: 'var(--text-3)',
                fontFamily: 'var(--font-mono)',
                opacity: 0.7,
              }}>
                {item.shortcut}
              </span>
            </motion.button>
          );
        })}
      </nav>

      {/* System Health Footer */}
      <div style={{
        padding: 'var(--space-4)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-2)',
          padding: '10px var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--surface-2)',
          border: '1px solid var(--border-subtle)',
          fontSize: 12,
        }}>
          <Activity size={14} style={{
            color: systemHealth?.status === 'OPERATIONAL' || systemHealth?.status === 'healthy' ? 'var(--pass)' : 'var(--review)',
          }} />
          <div style={{ flex: 1 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--text-0)',
            }}>
              {systemHealth?.status === 'OPERATIONAL' || systemHealth?.status === 'healthy' ? 'Engine Online' : 'Connecting...'}
            </div>
            <div style={{
              fontSize: 10,
              color: 'var(--text-3)',
              fontFamily: 'var(--font-mono)',
            }}>
              CUDA RTX 4090 • 38ms
            </div>
          </div>
          <div style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: systemHealth?.status === 'OPERATIONAL' || systemHealth?.status === 'healthy' ? 'var(--pass)' : 'var(--review)',
            boxShadow: '0 0 6px rgba(22, 163, 74, 0.4)',
          }} />
        </div>
      </div>
    </aside>
  );
}
