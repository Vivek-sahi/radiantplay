import React, { useState } from 'react';
import { Button, Card, Horizontal, Icon, TextInput, Typography, Vertical } from '@/components';
import { spacing } from '@tokens/spacing';
import styles from '../v6.module.css';

type Step = 'email' | 'code' | 'password';

/**
 * Sign in (PM, 14 Oct): email, a one-time code, then a password. First time: all three steps.
 * Returning: email and password; the code comes back on a new device. No SSO for December.
 */
export const LoginPage: React.FC<{ firstTime: boolean; suggestedEmail: string; onSignedIn: () => void; controls?: React.ReactNode }> = ({
  firstTime,
  suggestedEmail,
  onSignedIn,
  controls,
}) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState(suggestedEmail);
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);

  const submitEmail = () => {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return setError('Enter the email address you were invited with.');
    setError('');
    setStep(firstTime ? 'code' : 'password');
  };
  const submitCode = () => {
    if (!/^\d{6}$/.test(code.trim())) return setError("That code didn't match. It has six digits.");
    setError('');
    setStep('password');
  };
  const submitPassword = () => {
    if (firstTime && !(password.length >= 8 && /\d/.test(password))) return setError('At least 8 characters, with a number.');
    if (!firstTime && password.length === 0) return setError('Enter your password.');
    setError('');
    onSignedIn();
  };
  const onEnter = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fn();
  };

  return (
    <div className={styles.login}>
      {controls}
      <Card className={styles.loginCard}>
        <Vertical gap={spacing.F} className={styles.loginInner}>
          <Horizontal gap={spacing.C} align="center">
            <span className={styles.mark}>
              <Icon name="database" size="m" aria-hidden />
            </span>
            <Typography variant="content-label" color="base" noMargin>
              AgentDB
            </Typography>
          </Horizontal>

          {step === 'email' && (
            <Vertical gap={spacing.D}>
              <Typography variant="page-title" color="base" noMargin>
                Sign in
              </Typography>
              <TextInput
                label="Email"
                value={email}
                autoFocus
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={onEnter(submitEmail)}
                error={!!error}
                errorMessage={error}
              />
              <Button variant="primary" fullWidth onClick={submitEmail}>
                Continue
              </Button>
            </Vertical>
          )}

          {step === 'code' && (
            <Vertical gap={spacing.D}>
              <Typography variant="page-title" color="base" noMargin>
                Check your email
              </Typography>
              <Typography variant="body-normal" color="gray-light" noMargin>
                Code sent to {email.trim()}.
              </Typography>
              <TextInput
                label="Code"
                value={code}
                autoFocus
                placeholder="000000"
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={onEnter(submitCode)}
                error={!!error}
                errorMessage={error}
              />
              <Button variant="primary" fullWidth onClick={submitCode}>
                Continue
              </Button>
              <Horizontal gap={spacing.B} align="center" justify="space-between">
                <Button variant="tertiary" size="small" onClick={() => setResent(true)}>
                  {resent ? 'Code sent again' : 'Send a new code'}
                </Button>
                <Button variant="tertiary" size="small" onClick={() => setStep('email')}>
                  Use a different email
                </Button>
              </Horizontal>
            </Vertical>
          )}

          {step === 'password' && (
            <Vertical gap={spacing.D}>
              <Typography variant="page-title" color="base" noMargin>
                {firstTime ? 'Create a password' : 'Welcome back'}
              </Typography>
              {!firstTime && (
                <Typography variant="body-normal" color="gray-light" noMargin>
                  {email.trim()}
                </Typography>
              )}
              <div className={styles.password}>
                <TextInput
                  label="Password"
                  value={password}
                  autoFocus
                  autoComplete="off"
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={onEnter(submitPassword)}
                  error={!!error}
                  errorMessage={error}
                />
              </div>
              <Button variant="primary" fullWidth onClick={submitPassword}>
                {firstTime ? 'Create password and sign in' : 'Sign in'}
              </Button>
              {!firstTime && (
                <div>
                  <Button variant="tertiary" size="small" onClick={() => setStep('email')}>
                    Forgot your password?
                  </Button>
                </div>
              )}
            </Vertical>
          )}
        </Vertical>
      </Card>
    </div>
  );
};
