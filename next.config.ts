import type { NextConfig } from "next";

const isGithubPages = process.env.DEPLOY_TARGET === "github-pages";
const githubPagesBasePath = "/brp-demo";

const nextConfig: NextConfig = {
  output: isGithubPages ? "export" : "standalone",
  ...(isGithubPages
    ? {
        basePath: githubPagesBasePath,
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {}),
  env: {
    NEXT_PUBLIC_BASE_PATH: isGithubPages ? githubPagesBasePath : "",
  },
};

export default nextConfig;
