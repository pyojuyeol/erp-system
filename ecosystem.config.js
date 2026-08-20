module.exports = {
  apps: [
    {
      name: 'erp-backend',
      cwd: './backend',
      script: 'dist/src/main.js',
      instances: 'max',
      exec_mode: 'cluster',
      env_production: {
        NODE_ENV: 'production',
      },
      max_memory_restart: '500M',
    },
  ],
};
