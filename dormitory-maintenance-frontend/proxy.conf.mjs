// Dev server proxy, mirrors the /api and /ws routes from nginx.conf.
// BACKEND_URL defaults to a locally running backend; docker-compose.dev.yml
// points it at the backend container.
const target = process.env.BACKEND_URL ?? 'http://localhost:3000';

export default {
  '/api/**': {
    target,
    changeOrigin: true,
    pathRewrite: { '^/api': '/api/v1' },
  },
  // Vite requires a glob to match nested Socket.IO transport requests.
  '/ws/**': {
    target,
    changeOrigin: true,
    ws: true,
  },
};
