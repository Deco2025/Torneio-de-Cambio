
import React from 'react';

interface ScoreInputProps {
  value: number | string | null;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const ScoreInput: React.FC<ScoreInputProps> = ({ value, onChange, disabled }) => {
  return (
    <input
      type="number"
      min="0"
      className="w-12 h-10 text-center font-bold text-lg border border-slate-300 rounded-md focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 disabled:bg-slate-100 disabled:text-slate-400 text-black bg-white placeholder-slate-400"
      value={value === null ? '' : value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="-"
      disabled={disabled}
    />
  );
};

export default ScoreInput;
