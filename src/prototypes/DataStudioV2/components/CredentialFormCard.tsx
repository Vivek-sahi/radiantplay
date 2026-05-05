import React, { useState } from 'react';
import { c, sp, ff, fs, fw } from '../styles';
import { TextInput } from '../../../components/TextInput';
import { Button } from '../../../components/Button';

interface CredentialFormCardProps {
  onSubmit: () => void;
}

const CredentialFormCard: React.FC<CredentialFormCardProps> = ({ onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [accountId, setAccountId]   = useState('');
  const [username, setUsername]     = useState('');
  const [password, setPassword]     = useState('');
  const [warehouse, setWarehouse]   = useState('');
  const [database, setDatabase]     = useState('');

  const handleConnect = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit();
    }, 2000);
  };

  return (
    <div style={{
      marginTop: sp.C,
      padding: sp.D,
      backgroundColor: c['background-subtle'],
      border: `1px solid ${c['border-default']}`,
      borderRadius: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: sp.C,
    }}>

      {/* Auth method row */}
      <div>
        <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>
          Auth method
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: `6px ${sp.C}px`,
          backgroundColor: c['background-base'],
          border: `1px solid ${c['border-default']}`,
          borderRadius: 6,
          fontSize: fs.sm,
          color: c['content-primary'],
          fontFamily: ff.primary,
          cursor: 'default',
        }}>
          <span>Username / Password</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke={c['content-secondary']} strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </div>
      </div>

      <FieldRow label="Account identifier">
        <TextInput
          value={accountId}
          onChange={e => setAccountId(e.target.value)}
          placeholder="xy12345.us-east-1"
          disabled={loading}
        />
      </FieldRow>

      <FieldRow label="Username">
        <TextInput
          value={username}
          onChange={e => setUsername(e.target.value)}
          placeholder="your_username"
          disabled={loading}
        />
      </FieldRow>

      <FieldRow label="Password">
        <TextInput
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={loading}
        />
      </FieldRow>

      <FieldRow label="Warehouse">
        <TextInput
          value={warehouse}
          onChange={e => setWarehouse(e.target.value)}
          placeholder="COMPUTE_WH"
          disabled={loading}
        />
      </FieldRow>

      <FieldRow label="Database" optional>
        <TextInput
          value={database}
          onChange={e => setDatabase(e.target.value)}
          placeholder="Optional"
          disabled={loading}
        />
      </FieldRow>

      <Button
        variant="primary"
        size="medium"
        fullWidth
        onClick={handleConnect}
        loading={loading}
        disabled={loading}
      >
        {loading ? 'Connecting…' : 'Connect to Snowflake'}
      </Button>
    </div>
  );
};

const FieldRow: React.FC<{ label: string; optional?: boolean; children: React.ReactNode }> = ({ label, optional, children }) => (
  <div>
    <div style={{ fontSize: fs.xs, fontWeight: fw.medium, color: c['content-secondary'], marginBottom: 4 }}>
      {label}
      {optional && <span style={{ fontWeight: fw.regular, color: c['content-tertiary'], marginLeft: 4 }}>· optional</span>}
    </div>
    {children}
  </div>
);

export default CredentialFormCard;
