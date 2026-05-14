import { AppRouter } from './router';
import { Spinner } from './components/common/Spinner';
import { useAuth } from './hooks/useAuth';

export default function App() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Spinner className="h-10 w-10 text-primary-600" />
      </div>
    );
  }

  return <AppRouter />;
}
