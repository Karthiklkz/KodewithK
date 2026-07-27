module = {
  apps: [
    {
      name: 'kodewithk-nextjs',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3000',
      cwd: './',
      env: {
        NODE_ENV: 'production',
        PYTHON_BACKEND_URL: 'http://127.0.0.1:8000',
      },
    },
    {
      name: 'kodewithk-python',
      script: 'main.py',
      interpreter: 'python3',
      cwd: './backend',
      env: {
        PORT: '8000',
      },
    },
  ],
};
