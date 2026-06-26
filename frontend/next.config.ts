import type { NextConfig } from "next";
import os from "os";

// 서버 구동 시 로컬 기기의 모든 IPv4 주소를 동적으로 가져오는 함수
function getLocalIps(): string[] {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      // IPv4이면서 로컬 루프백(127.0.0.1)이 아닌 실제 네트워크 IP만 추출
      if (iface.family === "IPv4" && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const isStaticExport = process.env.NEXT_OUTPUT_EXPORT === "true";

const nextConfig: NextConfig = {
  basePath,
  ...(isStaticExport ? { output: "export" as const } : {}),
  async rewrites() {
    if (isStaticExport) return [];
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      {
        source: "/ws/:path*",
        destination: `${backendUrl}/ws/:path*`,
      },
    ];
  },
  // 기존 고정 IP 대신 현재 PC에 할당된 모든 네트워크 IP를 동적으로 허용
  allowedDevOrigins: ['localhost', '127.0.0.1', ...getLocalIps()],
};

export default nextConfig;
