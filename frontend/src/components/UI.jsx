import { C } from '@utils/constants';

export const FInput = ({ label, value, onChange, placeholder, type = 'text', as = 'input' }) => {
  const inputStyle = {
    width: '100%',
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: '8px',
    padding: '9px 13px',
    color: C.t1,
    fontSize: '14px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: as === 'textarea' ? 'vertical' : undefined,
    minHeight: as === 'textarea' ? '72px' : undefined
  };

  return (
    <div style={{ marginBottom: '14px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            color: C.t2,
            fontSize: '11px',
            fontWeight: '700',
            marginBottom: '5px',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}
        >
          {label}
        </label>
      )}

      {as === 'textarea' ? (
        <textarea
          style={inputStyle}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          style={inputStyle}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
};

export const Btn = ({ children, onClick, v = 'def', sm = false, style, disabled }) => {
  const baseStyle = {
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: '8px',
    fontWeight: '700',
    fontFamily: 'inherit',
    transition: 'opacity 0.15s',
    opacity: disabled ? 0.45 : 1,
    fontSize: sm ? '12px' : '13px',
    padding: sm ? '5px 12px' : '9px 18px'
  };

  const variants = {
    def: { background: C.surface, color: C.t1, border: `1px solid ${C.border}` },
    accent: { background: C.accent, color: C.accentFg },
    danger: { background: 'transparent', color: C.danger, border: '1px solid #3d1a1a' },
    ghost: { background: 'transparent', color: C.t2 }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variants[v], ...style }}
    >
      {children}
    </button>
  );
};
