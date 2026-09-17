import React from 'react';

export const EuFooter: React.FC = () => {
  return (
    <footer style={styles.footerContainer}>
      {/* Left: EU Flag + Co-funded Text */}
      <div style={styles.logoSection}>
        <svg width="68" height="46" viewBox="0 0 68 46" style={styles.flagSvg}>
          <rect width="68" height="46" fill="#003399" stroke="#ffffff" strokeWidth="1.8" />
          <g fill="#ffcc00" transform="translate(34, 23)">
            {[...Array(12)].map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180);
              const r = 13;
              const x = r * Math.cos(angle);
              const y = r * Math.sin(angle);
              return (
                <path
                  key={i}
                  transform={`translate(${x}, ${y}) scale(0.68)`}
                  d="M 0,-4 L 1.2,-1.2 L 4,-1 L 1.8,1 L 2.5,3.8 L 0,2.2 L -2.5,3.8 L -1.8,1 L -4,-1 L -1.2,-1.2 Z"
                />
              );
            })}
          </g>
        </svg>

        <div style={styles.cofundedText}>
          <span>Co-funded by</span>
          <span>the European Union</span>
        </div>
      </div>

      {/* Right: EU Disclaimer Text */}
      <div style={styles.disclaimerText}>
        Funded by the European Union. Views and opinions expressed are however those of the author(s) only
        and do not necessarily reflect those of the European Union or the European Education and Culture
        Executive Agency (EACEA). Neither the European Union nor EACEA can be held responsible for them.
      </div>
    </footer>
  );
};

const styles: Record<string, React.CSSProperties> = {
  footerContainer: {
    width: '100%',
    backgroundColor: '#008e3d',
    color: '#ffffff',
    padding: '0.65rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '2rem',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    flexWrap: 'wrap',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    flexShrink: 0,
  },
  flagSvg: {
    borderRadius: '2px',
    flexShrink: 0,
  },
  cofundedText: {
    display: 'flex',
    flexDirection: 'column',
    fontWeight: '700',
    fontSize: '0.92rem',
    lineHeight: '1.2',
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  disclaimerText: {
    fontSize: '0.73rem',
    lineHeight: '1.38',
    color: '#ffffff',
    maxWidth: '680px',
    textAlign: 'left',
    opacity: 0.95,
  },
};
