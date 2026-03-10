import React from 'react';
import SolarOptimizer from './SolarOptimizer';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <div className="w-full min-h-screen bg-slate-50">
      <ErrorBoundary>
        <SolarOptimizer />
      </ErrorBoundary>
    </div>
  );
}

export default App;
