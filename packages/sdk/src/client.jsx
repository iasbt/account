import React, { useState, useEffect } from 'react';

/**
 * Hook to load a micro-app dynamically.
 * In a real implementation, this would use SystemJS or Module Federation.
 * For this POC, we simulate the loading state.
 */
export function useMicroApp(appName) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [appConfig, setAppConfig] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Simulate fetching app config from main system registry
    fetch(`/api/apps/${appName}/config`) // This endpoint needs to be implemented in Runtime
      .then(res => {
        if (!res.ok) throw new Error(`Failed to load config for ${appName}`);
        return res.json();
      })
      .then(config => {
        setAppConfig(config);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err);
        setLoading(false);
      });
  }, [appName]);

  return { loading, error, appConfig };
}

/**
 * Component to render a micro-app container.
 */
export function MicroAppLoader({ name, fallback, errorComponent }) {
  const { loading, error, appConfig } = useMicroApp(name);

  if (loading) return fallback || <div>Loading {name}...</div>;
  if (error) return errorComponent || <div>Error loading {name}: {error.message}</div>;

  return (
    <div id={`micro-app-${name}`} className="micro-app-container">
      <h3>{appConfig?.label || name}</h3>
      <div className="micro-app-content">
        {/* In a real scenario, we would mount the remote component here */}
        <iframe 
          src={appConfig?.frontendUrl || `/apps/${name}/index.html`} 
          style={{ width: '100%', height: '500px', border: 'none' }}
          title={name}
        />
      </div>
    </div>
  );
}
