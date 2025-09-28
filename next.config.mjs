/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin dev requests for internal assets when developing via external origins
  allowedDevOrigins: [
    'f7a7055a1f6f4a818faca4987cda3fcb-6081125f-181b-49cc-83ab-21c31a.fly.dev',
    '*.fly.dev',
    'f7a7055a1f6f4a818faca4987cda3fcb-6081125f-181b-49cc-83ab-21c31a.projects.builder.codes',
    '*.projects.builder.codes',
    'projects.builder.codes',
    'builder.io',
    '*.builder.io'
  ]
};

export default nextConfig;
