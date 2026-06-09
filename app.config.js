module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...config.extra,
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
    nasaApiKey: process.env.NASA_API_KEY,
  },
});
