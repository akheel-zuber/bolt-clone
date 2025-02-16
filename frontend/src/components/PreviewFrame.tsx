import { useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';

export function PreviewFrame() {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function startWebContainer() {
      try {
        const container = await WebContainer.boot();
        setWebcontainer(container);

        // Writing package.json
        await container.fs.writeFile('/package.json', JSON.stringify({
          name: "vite-project",
          version: "1.0.0",
          scripts: {
            dev: "vite"
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
            "vite": "^4.0.0"
          }
        }, null, 2));

        // Writing index.html
        await container.fs.writeFile('/index.html', `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Preview</title>
          </head>
          <body>
            <div id="root"></div>
            <script type="module" src="/src/main.tsx"></script>
          </body>
          </html>
        `);

        // Writing main.tsx
        await container.fs.mkdir('/src');
        await container.fs.writeFile('/src/main.tsx', `
          import React from 'react';
          import ReactDOM from 'react-dom/client';

          function App() {
            return <h1>Hello from WebContainer!</h1>;
          }

          ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
        `);

        // Installing dependencies
        const installProcess = await container.spawn('npm', ['install']);
        installProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[NPM Install]', data);
          }
        }));
        await installProcess.exit;

        // Starting Vite server
        const viteProcess = await container.spawn('npm', ['run', 'dev']);
        viteProcess.output.pipeTo(new WritableStream({
          write(data) {
            console.log('[Vite]', data);
            const match = data.match(/http:\/\/localhost:\d+/);
            if (match) {
              setUrl(match[0]);
              setIsLoading(false);
            }
          }
        }));
      } catch (err) {
        console.error('WebContainer Error:', err);
        setError('Failed to start WebContainer');
        setIsLoading(false);
      }
    }

    startWebContainer();
  }, []);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return url ? <iframe src={url} title="Preview" style={{ width: '100%', height: '500px', border: 'none' }} /> : <p>Failed to load preview</p>;
}
