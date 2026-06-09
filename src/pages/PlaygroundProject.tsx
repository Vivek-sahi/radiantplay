import React, { Suspense, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { systemColors, referenceColors } from '../tokens/colors';
import { getProject } from '../prototypes/registry';
import { Icon } from '../components/icons';

class PrototypeErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error;
      return (
        <div style={{ padding: 32, fontFamily: 'monospace', fontSize: 13 }}>
          <div style={{ color: '#dc2626', fontWeight: 700, marginBottom: 8 }}>Prototype render error</div>
          <div style={{ color: '#1d232f', marginBottom: 16 }}>{err.message}</div>
          <pre style={{ background: '#f6f8fa', padding: 16, borderRadius: 8, overflow: 'auto', fontSize: 11, color: '#374151' }}>{err.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

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

  return (
    <div style={styles.container}>
      {/* Project Content */}
      <div style={styles.projectContainer}>
        <PrototypeErrorBoundary>
          <Suspense fallback={<LoadingState />}>
            <ProjectComponent />
          </Suspense>
        </PrototypeErrorBoundary>
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
    fontFamily: '"Plain", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },

  // Project Container
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
    backgroundColor: systemColors.light['background-sunken'],
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: `3px solid ${systemColors.light['background-subtle']}`,
    borderTopColor: systemColors.light['content-brand'],
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '14px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
  },

  // Not Found
  notFound: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: systemColors.light['background-sunken'],
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
    backgroundColor: referenceColors.red['10'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: systemColors.light['content-failure'],
    margin: '0 auto 24px',
  },
  notFoundTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: systemColors.light['content-primary'],
    marginBottom: '12px',
  },
  notFoundDescription: {
    fontSize: '15px',
    fontWeight: 400,
    color: systemColors.light['content-tertiary'],
    lineHeight: '24px',
    marginBottom: '24px',
  },
  notFoundButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 20px',
    backgroundColor: systemColors.light['content-brand'],
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    color: systemColors.light['background-base'],
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
