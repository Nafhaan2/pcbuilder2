// src/App.jsx - Simplified main component
import { ErrorBoundary } from 'react-error-boundary';
import { PCBuilderProvider } from './context/PCBuilderContext';
import BuilderInterface from './components/BuilderInterface';
import ErrorFallback from './components/ErrorFallback';
import LoadingSpinner from './components/LoadingSpinner';
import { usePCBuilderData } from './hooks/usePCBuilderData';
import './styles/cards.css';

export default function App() {
  const { isLoading, error } = usePCBuilderData();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorFallback error={error} />;

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <PCBuilderProvider>
        <div className="pc-builder-app">
          <BuilderInterface />
        </div>
      </PCBuilderProvider>
    </ErrorBoundary>
  );
}