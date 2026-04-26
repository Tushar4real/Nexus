const SUBJECT_COLORS = [
  { value: '#6366f1', cssVar: 'var(--subject-1)' },
  { value: '#06b6d4', cssVar: 'var(--subject-2)' },
  { value: '#10b981', cssVar: 'var(--subject-3)' },
  { value: '#f59e0b', cssVar: 'var(--subject-4)' },
  { value: '#ec4899', cssVar: 'var(--subject-5)' },
  { value: '#8b5cf6', cssVar: 'var(--subject-6)' }
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
