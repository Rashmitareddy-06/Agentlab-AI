import React from 'react';

export function MetricCard({ title, value, subtitle, icon: Icon, color = 'cyan', badge }) {
  const colorMap = {
    cyan: 'var(--accent-cyan)',
    indigo: 'var(--accent-indigo)',
    purple: 'var(--accent-purple)',
    emerald: 'var(--color-pass)',
    rose: 'var(--color-fail)',
    amber: 'var(--color-warn)'
  };

  const chosenColor = colorMap[color] || colorMap.cyan;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {Icon && (
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '6px',
            background: `rgba(255,255,255,0.04)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: chosenColor,
            border: `1px solid rgba(255,255,255,0.06)`
          }}>
            <Icon size={18} />
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', letterSpacing: '-0.03em' }}>
          {value}
        </span>
        {badge}
      </div>

      {subtitle && (
        <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          {subtitle}
        </span>
      )}
    </div>
  );
}
