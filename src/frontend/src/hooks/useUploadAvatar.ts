import { HttpAgent } from "@icp-sdk/core/agent";
import { useState } from "react";
import { StorageClient } from "../utils/StorageClient";

interface Config {
  backend_canister_id: string;
  storage_gateway_url: string;
  bucket_name: string;
  project_id: string;
  backend_host?: string;
}

let cachedConfig: Config | null = null;

async function getStorageConfig(): Promise<Config> {
  if (cachedConfig) return cachedConfig;
  const backendCanisterId = process.env.CANISTER_ID_BACKEND;
  const envBaseUrl = process.env.BASE_URL || "/";
  const baseUrl = envBaseUrl.endsWith("/") ? envBaseUrl : `${envBaseUrl}/`;

  try {
    const response = await fetch(`${baseUrl}env.json`);
    const json = await response.json();
    cachedConfig = {
      backend_canister_id:
        json.backend_canister_id === "undefined"
          ? (backendCanisterId ?? "")
          : json.backend_canister_id,
      storage_gateway_url: "https://blob.caffeine.ai",
      bucket_name: "default-bucket",
      project_id:
        json.project_id !== "undefined"
          ? json.project_id
          : "0000000-0000-0000-0000-00000000000",
      backend_host:
        json.backend_host === "undefined" ? undefined : json.backend_host,
    };
    return cachedConfig;
  } catch {
    cachedConfig = {
      backend_canister_id: backendCanisterId ?? "",
      storage_gateway_url: "https://blob.caffeine.ai",
      bucket_name: "default-bucket",
      project_id: "0000000-0000-0000-0000-00000000000",
    };
    return cachedConfig;
  }
}

export function useUploadAvatar() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);

  const uploadAvatar = async (file: File): Promise<string> => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const config = await getStorageConfig();

      const agentOptions: { host?: string } = {};
      if (config.backend_host) {
        agentOptions.host = config.backend_host;
      }

      const agent = HttpAgent.createSync(agentOptions);

      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {});
      }

      const storageClient = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );

      const bytes = new Uint8Array(await file.arrayBuffer());
      const { hash } = await storageClient.putFile(bytes, (pct) => {
        setUploadProgress(pct);
      });

      const url = await storageClient.getDirectURL(hash);
      setUploadProgress(100);
      return url;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadAvatar, uploadProgress, isUploading };
}
