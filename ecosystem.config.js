module.exports = {
  apps: [
    {
      name: 'pancho-api',
      script: 'index.js',
      cwd: './pancho-api',
      env: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'pancho-chatbot',
      script: 'index.js',
      cwd: './pancho-chatbot',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
