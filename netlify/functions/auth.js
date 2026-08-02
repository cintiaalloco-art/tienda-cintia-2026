exports.handler = async (event) => {
  const clientId = process.env.OAUTH_CLIENT_ID;
  const redirectUri = `https://${event.headers.host}/.netlify/functions/callback`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo`;

  return {
    statusCode: 302,
    headers: { Location: githubAuthUrl },
  };
};
