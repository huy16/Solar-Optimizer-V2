import React, { useState, useEffect } from 'react';
import SolarOptimizer from './SolarOptimizer';
import ErrorBoundary from './ErrorBoundary';
import LoginPage from './presentation/features/auth/LoginPage';
import { supabase } from './infra/supabaseClient';
import { Loader2 } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Detect user role from email
  const getUserRole = (user) => {
    if (!user?.email) return 'engineer';
    return user.email.toLowerCase().includes('sale') ? 'sales' : 'engineer';
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#0f172a]">
        <Loader2 className="animate-spin text-blue-500" size={40} />
      </div>
    );
  }

  if (!session) {
    return <LoginPage onLoginSuccess={(user) => setSession({ user })} />;
  }

  const userRole = getUserRole(session.user);

  return (
    <div className="w-full min-h-screen bg-slate-50">
      <ErrorBoundary>
        <SolarOptimizer user={session.user} userRole={userRole} onSignOut={async () => {
          await supabase.auth.signOut();
          setSession(null);
        }} />
      </ErrorBoundary>
    </div>
  );
}

export default App;
