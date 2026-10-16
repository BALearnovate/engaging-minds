import React from 'react';
import { useTranslation } from '../i18n/useTranslation';
import learnovateLogo from '../assets/logo-learnovate.png';
import tcdLogo from '../assets/logo-tcd.png';
import tampereLogo from '../assets/logo-tampere.png';
import vejleLogo from '../assets/logo-vejle.png';
import gavleLogo from '../assets/logo-gavle.png';

interface ProjectPartnerBarProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ProjectPartnerBar: React.FC<ProjectPartnerBarProps> = ({ className, style }) => {
  const { t } = useTranslation();

  const partners = [
    { name: t('partnerBar.learnovate', 'Learnovate'), logo: learnovateLogo },
    { name: t('partnerBar.tcd', 'Trinity College Dublin'), logo: tcdLogo },
    { name: t('partnerBar.tampere', 'Tampere University'), logo: tampereLogo },
    { name: t('partnerBar.vejle', 'Campus Vejle'), logo: vejleLogo },
    { name: t('partnerBar.gavle', 'University of Gävle'), logo: gavleLogo },
  ];

  return (
    <div style={{ ...styles.container, ...style }} className={className}>
      <div style={styles.textSection}>
        <div style={styles.textLine}>{t('partnerBar.partnersInfo', 'Partners: Ireland · Finland · Denmark · Sweden.')}</div>
        <div style={styles.textLine}>{t('partnerBar.projectPeriod', 'Project period: 2025–2027')}</div>
      </div>

      <div style={styles.logosRow}>
        {partners.map((partner) => (
          <img
            key={partner.name}
            src={partner.logo}
            alt={partner.name}
            title={partner.name}
            style={styles.logoImg}
          />
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    backgroundColor: '#e6f4f1',
    padding: '0.85rem 1.5rem',
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    boxSizing: 'border-box',
    width: '100%',
  },
  textSection: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#64748b',
    lineHeight: '1.35',
  },
  textLine: {
    margin: 0,
  },
  logosRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  logoImg: {
    maxHeight: '42px',
    maxWidth: '130px',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain',
  },
};

