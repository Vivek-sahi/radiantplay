import React from 'react';
import { useNavigate } from 'react-router-dom';
import { systemColors, referenceColors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { getAllProjects, ProjectMeta } from '../prototypes/registry';
import { getCurrentVersion } from '../data/versionHistory';
import { Icon } from '../components/icons';

/**
 * PlaygroundGallery
 * 
 * Displays a grid of all playground projects for designers to browse and open.
 * Each project is shown as a card with its name, description, and author.
 */
export const PlaygroundGallery: React.FC = () => {
  const navigate = useNavigate();
  const allProjects = getAllProjects();
  const myProjects = [...allProjects.filter(p => !p.section || p.section === 'mine')].reverse();
  const sampleProjects = [...allProjects.filter(p => p.section === 'sample')].reverse();

  const handleOpenProject = (projectId: string) => {
    navigate(`/playground/${projectId}`);
  };

  const handleBackToHome = () => {
    navigate('/home');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button style={styles.logoBtn} onClick={handleBackToHome}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          <div style={styles.logoMark}>R</div>
          <span style={styles.logoTitle}>Radiant Play</span>
          <span style={styles.logoVersion}>{getCurrentVersion()}</span>
        </button>
        <div style={styles.headerTitle}>
          <h1 style={styles.title}>Playground</h1>
          <p style={styles.subtitle}>Your prototypes and experiments</p>
        </div>
        <div style={styles.headerActions}>
          {[
            { label: 'Getting started', href: '/home' },
            { label: 'How it works', href: '/how-it-works.html' },
            { label: 'Design system', href: '/radiant' },
            { label: 'Claude setup & skills', href: '/cursor-to-claude-setup.html' },
          ].map(({ label, href }) => (
            <a
              key={href}
              href={href}
              style={styles.navLink}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#D6E8FF';
                e.currentTarget.style.borderColor = '#2770EF';
                e.currentTarget.style.color = '#2770EF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#EBF2FF';
                e.currentTarget.style.borderColor = '#C3D9FF';
                e.currentTarget.style.color = systemColors.light['content-primary'];
              }}
            >{label}</a>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main style={styles.main}>
        {myProjects.length > 0 && (
          <>
            <h2 style={styles.sectionHeader}>My prototypes</h2>
            <div style={styles.grid}>
              {myProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleOpenProject(project.id)}
                />
              ))}
            </div>
          </>
        )}

        {sampleProjects.length > 0 && (
          <>
            <h2 style={{ ...styles.sectionHeader, ...(myProjects.length > 0 ? { marginTop: `${spacing.H}px` } : {}) }}>Sample prototypes</h2>
            <div style={styles.grid}>
              {sampleProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleOpenProject(project.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
};


/**
 * Project Card Component
 */
interface ProjectCardProps {
  project: ProjectMeta;
  onClick: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onClick }) => {
  return (
    <button
      style={styles.card}
      onClick={onClick}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.borderColor = referenceColors.brand['40'];
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.06)';
        e.currentTarget.style.borderColor = systemColors.light['background-subtle'];
      }}
    >
      {/* Thumbnail */}
      <div style={styles.cardThumbnail}>
        {project.thumbnail ? (
          <img src={project.thumbnail} alt={project.name} style={styles.cardImage} />
        ) : (
          <div style={styles.cardPlaceholder}>
            <Icon name="folder" size="l" />
          </div>
        )}
      </div>

      {/* Content */}
      <div style={styles.cardContent}>
        <h3 style={styles.cardTitle}>{project.name}</h3>
        {project.description && (
          <p style={styles.cardDescription}>{project.description}</p>
        )}
        <div style={styles.cardMeta}>
          {project.author && (
            <span style={styles.cardAuthor}>{project.author}</span>
          )}
          {project.lastModified && (
            <span style={styles.cardDate}>
              {new Date(project.lastModified).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          )}
        </div>
      </div>

      {/* Component Count Pills */}
      {(project.dsComponents != null || project.customComponents != null) && (
        <div style={styles.cardPills}>
          {project.dsComponents != null && project.dsComponents > 0 && (
            <span style={styles.cardPill}>
              <Icon name="grid-view" size="xs" />
              {project.dsComponents} DS
            </span>
          )}
          {project.customComponents != null && project.customComponents > 0 && (
            <span style={{ ...styles.cardPill, ...styles.cardPillCustom }}>
              <Icon name="plus" size="xs" />
              {project.customComponents} Custom
            </span>
          )}
        </div>
      )}

    </button>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Logo home button
  logoBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'none',
    border: 'none',
    padding: '4px',
    cursor: 'pointer',
    transition: 'opacity .18s',
    minWidth: '220px',
  },
  logoMark: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #2770EF 0%, #1E5BBB 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '18px',
    fontWeight: 700,
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(39, 112, 239, 0.3)',
    flexShrink: 0,
  },
  logoTitle: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    letterSpacing: '-0.3px',
  },
  logoVersion: {
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '10px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
    backgroundColor: systemColors.light['background-subtle'],
    padding: `${spacing.A}px ${spacing.B}px`,
    borderRadius: '10px',
    letterSpacing: '0.2px',
  },

  // Header
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${spacing.D}px ${spacing.H}px`, // 16px 32px
    backgroundColor: systemColors.light['background-base'],
    borderBottom: `1px solid ${systemColors.light['background-subtle']}`,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: `${spacing.A}px`, // 4px
  },
  subtitle: {
    fontSize: '14px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    margin: 0,
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`, // 16px
    justifyContent: 'flex-end',
    minWidth: '220px',
  },
  navLink: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#2770EF',
    textDecoration: 'none',
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    padding: '5px 14px',
    borderRadius: '100px',
    border: `1px solid #C3D9FF`,
    background: '#EBF2FF',
    transition: 'all 0.15s',
  },

  // Main
  main: {
    padding: `${spacing.H}px`, // 32px
    maxWidth: '1200px',
    margin: '0 auto',
  },

  // Section header
  sectionHeader: {
    fontSize: '14px',
    fontWeight: 600,
    color: systemColors.light['content-secondary'],
    marginBottom: `${spacing.D}px`, // 16px
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },

  // Grid
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: `${spacing.E}px`, // 20px
  },

  // Project Card
  card: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: systemColors.light['background-base'],
    border: `1px solid ${systemColors.light['background-subtle']}`,
    borderRadius: `${spacing.C}px`, // 12px
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 200ms ease',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    textAlign: 'left',
  },
  cardThumbnail: {
    height: '120px',
    backgroundColor: systemColors.light['background-sunken'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: `1px solid ${systemColors.light['background-subtle']}`,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  cardPlaceholder: {
    color: systemColors.light['border-default'],
  },
  cardContent: {
    padding: `${spacing.D}px`, // 16px
    flex: 1,
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: `${spacing.B}px`, // 8px
  },
  cardDescription: {
    fontSize: '13px',
    fontWeight: 400,
    color: systemColors.light['content-secondary'],
    lineHeight: '20px',
    marginBottom: `${spacing.C}px`, // 12px
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.D}px`, // 16px
  },
  cardAuthor: {
    fontSize: '12px',
    fontWeight: 500,
    color: systemColors.light['content-secondary'],
  },
  cardDate: {
    fontSize: '12px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
  },
  cardPills: {
    display: 'flex',
    alignItems: 'center',
    gap: `${spacing.B}px`,
    padding: `0 ${spacing.E}px ${spacing.D}px`,
    flexWrap: 'wrap',
  },
  cardPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${spacing.A}px`,
    fontSize: '12px',
    fontWeight: 500,
    color: systemColors.light['content-brand'],
    background: referenceColors.blue['10'],
    padding: `3px ${spacing.B}px`,
    borderRadius: `${spacing.A}px`,
    border: `1px solid ${systemColors.light['background-information']}`,
  },
  cardPillCustom: {
    color: '#8B5CF6',
    background: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },

};

export default PlaygroundGallery;
