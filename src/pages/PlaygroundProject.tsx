import React, { Suspense, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sysVar } from '../tokens/colors';
import { getProject } from '../prototypes/registry';
import { isLightOnly } from '../prototypes/registry-theme';
import { Icon } from '../components/icons';
import { LightOnly } from '../context/ThemeContext';
import { RadiantLook } from '../context/RadiantLookContext';

/**
 * PlaygroundProject
 * 
 * Full-page wrapper for individual playground projects.
 * Provides a completely distraction-free environment.
 * Press Escape to navigate back to the Playground gallery.
 */
export const PlaygroundProject: React.FC = () => {
  const { projectName } = useParams<{ projectName: string }>();
  const navigate = useNavigate();

  const project = projectName ? getProject(projectName) : undefined;

  // Handle escape key to go back
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      navigate('/playground');
    }
  }, [navigate]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const handleBack = () => {
    navigate('/playground');
  };

  // Project not found
  if (!project) {
    return (
      <div style={styles.notFound}>
        <div style={styles.notFoundContent}>
          <div style={styles.notFoundIcon}>
            <Icon name="cross-circle" size="l" />
          </div>
          <h1 style={styles.notFoundTitle}>Project not found</h1>
          <p style={styles.notFoundDescription}>
            The project "{projectName}" does not exist or has not been registered.
          </p>
          <button style={styles.notFoundButton} onClick={handleBack}>
            <Icon name="arrow-left" size="m" />
            Back to Playground
          </button>
        </div>
      </div>
    );
  }

  const ProjectComponent = project.component;
  // look: 'radiant-3' opts the prototype into the Radiant 3.0 Figma sizes (RadiantLookContext.tsx)
  const content = project.look === 'radiant-3' ? <RadiantLook><ProjectComponent /></RadiantLook> : <ProjectComponent />;

  return (
    <div style={styles.container}>
      {/* Project Content */}
      <div style={styles.projectContainer}>
        <Suspense fallback={<LoadingState />}>
          {isLightOnly(project) ? (
            <LightOnly style={styles.lightOnly}>
              {content}
            </LightOnly>
          ) : (
            content
          )}
        </Suspense>
      </div>
    </div>
  );
};

/**
 * Loading State Component
 */
const LoadingState: React.FC = () => {
  return (
    <div style={styles.loading}>
      <div style={styles.loadingSpinner} />
      <p style={styles.loadingText}>Loading project...</p>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    position: 'relative',
    fontFamily: 'var(--font-family-primary)',
  },

  // Project Container
  lightOnly: {
    minHeight: '100%',
    background: sysVar('background-base'),
    color: sysVar('content-primary'),
  },
  projectContainer: {
    minHeight: '100vh',
  },

  // Loading
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: sysVar('background-sunken'),
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${sysVar('background-subtle')}`,
    borderTopColor: sysVar('content-brand'),
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 400,
    color: sysVar('content-tertiary'),
  },

  // Not Found
  notFound: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: sysVar('background-sunken'),
    padding: '32px',
  },
  notFoundContent: {
    textAlign: 'center',
    maxWidth: '400px',
  },
  notFoundIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    backgroundColor: sysVar('background-failure'),
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: sysVar('content-failure'),
    margin: '0 auto 24px',
  },
  notFoundTitle: {
    fontSize: '24px',
    fontWeight: 'var(--font-weight-emphasis)',
    color: sysVar('content-primary'),
    marginBottom: '12px',
  },
  notFoundDescription: {
    fontSize: '15px',
    fontWeight: 400,
    color: sysVar('content-tertiary'),
    lineHeight: '24px',
    marginBottom: '24px',
  },
  notFoundButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: sysVar('background-brand'),
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: sysVar('content-alternate'),
    transition: 'all 150ms ease',
  },
};

// Add keyframe animation for spinner
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default PlaygroundProject;
