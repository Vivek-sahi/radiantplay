import React, { useState } from 'react';
import { c, sp, fs, fw, ff, ts } from '../styles';
import { Button } from '../../../components/Button';
import { TextInput } from '../../../components/TextInput';
import { Checkbox } from '../../../components/Checkbox';

interface SharedUser {
  id: string;
  name: string;
  initials: string;
  color: string;
  permission: 'Can view' | 'Can edit' | 'Can manage';
}

const CheckboxField: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  children?: React.ReactNode;
}> = ({ checked, onChange, label, children }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
    <Checkbox checked={checked} onChange={onChange} label={label} />
    {children}
  </div>
);

const ShareModal: React.FC<{ onClose: () => void; onShared?: () => void }> = ({ onClose, onShared }) => {
  const [inputValue, setInputValue] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);
  const [sendNotification, setSendNotification] = useState(true);
  const [addMessage, setAddMessage] = useState(false);
  const [discoverable, setDiscoverable] = useState(true);
  const [copied, setCopied] = useState(false);
  const [openPermission, setOpenPermission] = useState<string | null>(null);

  const AVATAR_COLORS = [c['content-brand'], c['content-success'], c['content-warning'], '#A855F7', c['content-failure'], '#14B8A6'];

  const addUser = () => {
    const name = inputValue.trim();
    if (!name) return;
    const initials = name.split(/[.\s@]/).filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('');
    setSharedUsers(prev => [...prev, {
      id: `u-${Date.now()}`,
      name,
      initials: initials || name[0].toUpperCase(),
      color: AVATAR_COLORS[prev.length % AVATAR_COLORS.length],
      permission: 'Can view',
    }]);
    setInputValue('');
  };

  const removeUser = (id: string) => setSharedUsers(prev => prev.filter(u => u.id !== id));

  const setPermission = (id: string, permission: SharedUser['permission']) => {
    setSharedUsers(prev => prev.map(u => u.id === id ? { ...u, permission } : u));
    setOpenPermission(null);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, backgroundColor: c['background-overlay'], zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ backgroundColor: c['background-base'], borderRadius: 12, width: 680, maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: `${sp.D}px ${sp.F}px`, borderBottom: `1px solid ${c['border-divider']}` }}>
          <h2 style={{ margin: 0, ...ts.sectionLabel, color: c['content-primary'] }}>Share</h2>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: `${sp.D}px ${sp.F}px` }}>

          {/* Input row */}
          <label style={{ fontSize: fs.sm, fontWeight: fw.medium, color: c['content-primary'], display: 'flex', alignItems: 'center', gap: sp.A, marginBottom: sp.B }}>
            Enter user name or group name
            <span style={{ width: 16, height: 16, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: fs.xs, color: c['content-secondary'], cursor: 'default' }}>i</span>
          </label>
          <div style={{ display: 'flex', gap: sp.B, marginBottom: sp.C }}>
            <div style={{ flex: 1 }}>
              <TextInput
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addUser()}
                placeholder="User name or group name"
              />
            </div>
            <Button variant="secondary" size="small" onClick={addUser}>+</Button>
          </div>

          {/* Checkboxes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.F, marginBottom: sp.D }}>
            <CheckboxField checked={sendNotification} onChange={setSendNotification} label="Send notification" />
            <CheckboxField checked={addMessage} onChange={setAddMessage} label="Add message (optional)" />
            <div style={{ display: 'flex', alignItems: 'center', gap: sp.A }}>
              <CheckboxField checked={false} onChange={() => {}} label="Embedded link format" />
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: c['content-secondary'], cursor: 'default', marginLeft: sp.A }}>i</span>
            </div>
          </div>

          {/* Shared users list */}
          {sharedUsers.length > 0 && (
            <div style={{ marginBottom: sp.D }}>
              <p style={{ ...ts.contentLabelSubhead, color: c['content-primary'], margin: `0 0 ${sp.C}px` }}>Shared with:</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: sp.B }}>
                {sharedUsers.map(user => (
                  <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: sp.C }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', backgroundColor: user.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: fs.xs, fontWeight: fw.semibold, color: '#fff' }}>{user.initials}</span>
                    </div>
                    <span style={{ flex: 1, fontSize: fs.sm, color: c['content-primary'] }}>{user.name}</span>

                    {/* Permission dropdown */}
                    <div style={{ position: 'relative' }}>
                      <Button variant="tertiary" size="small" onClick={() => setOpenPermission(openPermission === user.id ? null : user.id)}>
                        {user.permission} ▾
                      </Button>
                      {openPermission === user.id && (
                        <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: sp.A, backgroundColor: c['background-base'], border: `1px solid ${c['border-default']}`, borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 10, overflow: 'hidden', minWidth: 130 }}>
                          {(['Can view', 'Can edit', 'Can manage'] as const).map(perm => (
                            <div
                              key={perm}
                              onClick={() => setPermission(user.id, perm)}
                              style={{ padding: `${sp.B}px ${sp.C}px`, fontSize: fs.sm, cursor: 'pointer', color: user.permission === perm ? c['content-brand'] : c['content-primary'], backgroundColor: user.permission === perm ? c['background-information'] : c['background-base'], display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                              onMouseEnter={e => { if (user.permission !== perm) e.currentTarget.style.backgroundColor = c['background-subtle']; }}
                              onMouseLeave={e => { if (user.permission !== perm) e.currentTarget.style.backgroundColor = c['background-base']; }}
                            >
                              {perm}
                              {user.permission === perm && <span style={{ fontSize: fs.xs }}>✓</span>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button variant="tertiary" size="small" onClick={() => removeUser(user.id)}>×</Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ borderTop: `1px solid ${c['border-divider']}`, margin: `${sp.C}px 0` }} />

          {/* Discoverable */}
          <div style={{ marginBottom: sp.C }}>
            <CheckboxField checked={discoverable} onChange={setDiscoverable} label="Make this data model discoverable">
              <span style={{ width: 14, height: 14, borderRadius: '50%', border: `1px solid ${c['border-default']}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: c['content-secondary'], cursor: 'default', marginLeft: sp.A }}>i</span>
            </CheckboxField>
          </div>

          {/* Copy link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: sp.C, backgroundColor: c['background-subtle'], borderRadius: 6, padding: `${sp.B}px ${sp.C}px` }}>
            <span style={{ fontSize: fs.xs, color: c['content-secondary'], flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: ff.mono }}>
              https://thoughtspot.com/app/model/campaign-performance
            </span>
            <Button variant="secondary" size="small" onClick={handleCopy} style={{ flexShrink: 0 }}>
              {copied ? '✓ Copied' : 'Copy link'}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: `${sp.C}px ${sp.F}px`, borderTop: `1px solid ${c['border-divider']}`, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: sp.B }}>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              onShared?.();
              onClose();
            }}
          >Share</Button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
