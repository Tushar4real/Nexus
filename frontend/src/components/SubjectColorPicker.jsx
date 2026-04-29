const SUBJECT_COLORS = [
  { value: '#bef264', cssVar: 'var(--subject-1)' },
  { value: '#a3e635', cssVar: 'var(--subject-2)' },
  { value: '#84cc16', cssVar: 'var(--subject-3)' },
  { value: '#64748b', cssVar: 'var(--subject-4)' },
  { value: '#475569', cssVar: 'var(--subject-5)' },
  { value: '#334155', cssVar: 'var(--subject-6)' }
];

const SubjectColorPicker = ({ value, onChange }) => (
  <div className="subject-color-picker" role="radiogroup" aria-label="Subject color">
    {SUBJECT_COLORS.map((color) => (
      <button
        key={color.value}
        type="button"
        role="radio"
        aria-checked={value === color.value}
        className={`subject-swatch${value === color.value ? ' selected' : ''}`}
        style={{ background: color.cssVar }}
        onClick={() => onChange(color.value)}
      />
    ))}
  </div>
);

export default SubjectColorPicker;
