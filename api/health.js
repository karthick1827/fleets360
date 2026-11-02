export default function handler(_req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.statusCode = 200;
  res.end(
    JSON.stringify({
      ok: true,
      service: 'fleets360-api',
      markdownStudioUi: '36-live-only',
      gitCommit: process.env.VERCEL_GIT_COMMIT_SHA || null,
      deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null,
    }),
  );
}
