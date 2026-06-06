import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, ShieldCheck, X, Eye, EyeOff } from 'lucide-react';

/**
 * Simple hash function for PIN (not cryptographically secure, but sufficient for localStorage).
 */
async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + '_hall_of_importance_vault_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const VAULT_PIN_KEY = 'hoi_vault_pin_hash';

/**
 * VaultGate: PIN setup and PIN entry modal for the vault feature.
 *
 * Props:
 * - isSetup: true if no PIN has been set yet (first time)
 * - onUnlock: callback when PIN is correct (or newly set)
 * - onClose: callback to close the modal
 */
export default function VaultGate({ isSetup, onUnlock, onClose }) {
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [phase, setPhase] = useState(isSetup ? 'create' : 'enter'); // 'create' | 'confirm' | 'enter'
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [unlocking, setUnlocking] = useState(false);

  const inputRefs = useRef([]);
  const confirmRefs = useRef([]);

  // Focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      if (phase === 'create' || phase === 'enter') {
        inputRefs.current[0]?.focus();
      } else if (phase === 'confirm') {
        confirmRefs.current[0]?.focus();
      }
    }, 100);
  }, [phase]);

  const handlePinChange = (index, value, isConfirm = false) => {
    if (!/^\d*$/.test(value)) return; // Only digits

    const digit = value.slice(-1); // Take last digit
    const setter = isConfirm ? setConfirmPin : setPin;
    const refs = isConfirm ? confirmRefs : inputRefs;

    setter((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Auto-advance to next input
    if (digit && index < 3) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e, isConfirm = false) => {
    const refs = isConfirm ? confirmRefs : inputRefs;
    const setter = isConfirm ? setConfirmPin : setPin;

    if (e.key === 'Backspace') {
      const currentPin = isConfirm ? confirmPin : pin;
      if (!currentPin[index] && index > 0) {
        refs.current[index - 1]?.focus();
        setter((prev) => {
          const next = [...prev];
          next[index - 1] = '';
          return next;
        });
      }
    }
  };

  const handlePaste = (e, isConfirm = false) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const digits = pasted.split('');
      if (isConfirm) {
        setConfirmPin(digits);
        confirmRefs.current[3]?.focus();
      } else {
        setPin(digits);
        inputRefs.current[3]?.focus();
      }
    }
  };

  const handleSubmitCreate = async () => {
    const pinStr = pin.join('');
    if (pinStr.length < 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }
    setError('');
    setPhase('confirm');
  };

  const handleSubmitConfirm = async () => {
    const pinStr = pin.join('');
    const confirmStr = confirmPin.join('');

    if (confirmStr.length < 4) {
      setError('Please confirm your PIN');
      return;
    }

    if (pinStr !== confirmStr) {
      setError('PINs do not match. Try again.');
      setConfirmPin(['', '', '', '']);
      confirmRefs.current[0]?.focus();
      return;
    }

    // Hash and store
    const hash = await hashPin(pinStr);
    localStorage.setItem(VAULT_PIN_KEY, hash);
    setUnlocking(true);
    setTimeout(() => {
      onUnlock();
    }, 600);
  };

  const handleSubmitEnter = async () => {
    const pinStr = pin.join('');
    if (pinStr.length < 4) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    const storedHash = localStorage.getItem(VAULT_PIN_KEY);
    const enteredHash = await hashPin(pinStr);

    if (enteredHash === storedHash) {
      setError('');
      setUnlocking(true);
      setTimeout(() => {
        onUnlock();
      }, 600);
    } else {
      setError('Incorrect PIN. Try again.');
      setPin(['', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (phase === 'create') handleSubmitCreate();
    else if (phase === 'confirm') handleSubmitConfirm();
    else handleSubmitEnter();
  };

  const getTitle = () => {
    if (phase === 'create') return 'Create Vault PIN';
    if (phase === 'confirm') return 'Confirm PIN';
    return 'Unlock Vault';
  };

  const getSubtitle = () => {
    if (phase === 'create') return 'Set a 4-digit PIN to protect your vault notes';
    if (phase === 'confirm') return 'Re-enter your PIN to confirm';
    return 'Enter your 4-digit PIN to access the vault';
  };

  const renderPinInputs = (values, refs, isConfirm = false) => (
    <div className="vault-pin__inputs">
      {values.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (refs.current[i] = el)}
          type={showPin ? 'text' : 'password'}
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handlePinChange(i, e.target.value, isConfirm)}
          onKeyDown={(e) => handleKeyDown(i, e, isConfirm)}
          onPaste={(e) => handlePaste(e, isConfirm)}
          className="vault-pin__digit"
          autoComplete="off"
          id={`vault-pin-${isConfirm ? 'confirm' : 'input'}-${i}`}
        />
      ))}
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal vault-modal ${unlocking ? 'vault-modal--unlocking' : ''}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '400px' }}
      >
        <div className="modal__header">
          <h2 className="modal__title">{getTitle()}</h2>
          <button className="modal__close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form className="modal__body vault-gate__body" onSubmit={handleSubmit}>
          {/* Lock icon animation */}
          <div className={`vault-gate__icon ${unlocking ? 'vault-gate__icon--unlocked' : ''}`}>
            {unlocking ? (
              <ShieldCheck size={48} className="vault-gate__shield" />
            ) : (
              <Lock size={48} />
            )}
          </div>

          <p className="vault-gate__subtitle">{getSubtitle()}</p>

          {/* PIN inputs */}
          {(phase === 'create' || phase === 'enter') && renderPinInputs(pin, inputRefs, false)}
          {phase === 'confirm' && renderPinInputs(confirmPin, confirmRefs, true)}

          {/* Show/hide toggle */}
          <button
            type="button"
            className="vault-gate__toggle-vis"
            onClick={() => setShowPin(!showPin)}
          >
            {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPin ? 'Hide PIN' : 'Show PIN'}
          </button>

          {/* Error message */}
          {error && <div className="vault-gate__error">{error}</div>}

          {/* Submit button */}
          <button type="submit" className="btn btn--primary vault-gate__submit">
            {phase === 'create'
              ? 'Continue'
              : phase === 'confirm'
              ? 'Set PIN & Unlock'
              : 'Unlock Vault'}
          </button>

          {phase === 'confirm' && (
            <button
              type="button"
              className="btn btn--ghost vault-gate__back"
              onClick={() => {
                setPhase('create');
                setConfirmPin(['', '', '', '']);
                setError('');
              }}
            >
              ← Back
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

// Utility: check if a vault PIN has been set
export function hasVaultPin() {
  return !!localStorage.getItem(VAULT_PIN_KEY);
}

// Utility: reset vault PIN (for settings)
export function resetVaultPin() {
  localStorage.removeItem(VAULT_PIN_KEY);
}
