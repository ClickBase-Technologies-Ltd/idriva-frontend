import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //  async redirects() {
  //   return [
  //     {
  //       source: '/setup-password',
  //       has: [
  //         {
  //           type: 'cookie',
  //           key: 'user_session', // or whatever session cookie you use
  //         },
  //       ],
  //       destination: '/dashboard',
  //       permanent: false,
  //     },
  //   ];
  // },
};

export default nextConfig;
