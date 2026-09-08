import React from 'react';

export default function TypeFilter({ selectedType, onSelectType }) {
  return (
    <section className="filter-group">
      <button
        type="button"
        className={`filter-btn ${selectedType === 'all' ? 'active' : ''}`}
        onClick={() => onSelectType('all')}
      >
        전체
      </button>
      <button
        type="button"
        className={`filter-btn ${selectedType === 'in' ? 'active' : ''}`}
        onClick={() => onSelectType('in')}
      >
        입금
      </button>
      <button
        type="button"
        className={`filter-btn ${selectedType === 'out' ? 'active' : ''}`}
        onClick={() => onSelectType('out')}
      >
        출금
      </button>
    </section>
  );
}