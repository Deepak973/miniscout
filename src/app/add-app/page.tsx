"use client";

import { useState, useCallback } from "react";
import { Upload, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { useMiniApp } from "@neynar/react";
import { useDropzone } from "react-dropzone";
import toast from "react-hot-toast";

interface AppData {
  name: string;
  description: string;
  iconUrl: string;
  splashUrl: string;
  homeUrl: string;
  miniappUrl: string;
}

export default function AddAppPage() {
  const { context } = useMiniApp();
  const [appData, setAppData] = useState<AppData>({
    name: "",
    description: "",
    iconUrl: "",
    splashUrl: "",
    homeUrl: "",
    miniappUrl: "",
  });
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [domainExists, setDomainExists] = useState<boolean | null>(null);
  const [checkingDomain, setCheckingDomain] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const metadataContent = JSON.parse(e.target?.result as string);
          setMetadata(metadataContent);

          if (metadataContent.frame) {
            setAppData({
              name: metadataContent.frame.name || "",
              description: metadataContent.frame.description || "",
              iconUrl: metadataContent.frame.iconUrl || "",
              splashUrl: metadataContent.frame.splashImageUrl || "",
              homeUrl: metadataContent.frame.homeUrl || "",
              miniappUrl: "", // This will be filled manually by user
            });
          }

          toast.success("Manifest file loaded successfully!");
        } catch (_error) {
          toast.error("Invalid JSON file");
        }
      };
      reader.readAsText(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/json": [".json"],
    },
    multiple: false,
  });

  const checkDomainExists = async (homeUrl: string) => {
    if (!homeUrl) return;

    setCheckingDomain(true);
    try {
      const domain = new URL(homeUrl).hostname;
      const response = await fetch(`/api/apps?domain=${domain}`);
      const data = await response.json();
      setDomainExists(data.apps && data.apps.length > 0);
    } catch (_error) {
      console.error("Error checking domain:", _error);
      setDomainExists(null);
    } finally {
      setCheckingDomain(false);
    }
  };

  const handleHomeUrlChange = (value: string) => {
    setAppData((prev) => ({ ...prev, homeUrl: value }));
    if (value) {
      checkDomainExists(value);
    } else {
      setDomainExists(null);
    }
  };

  const handleSubmit = async () => {
    if (!context?.user?.fid) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (
      !appData.name ||
      !appData.description ||
      !appData.iconUrl ||
      !appData.homeUrl ||
      !appData.miniappUrl
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appData,
          ownerFid: context.user.fid,
        }),
      });

      if (response.ok) {
        toast.success("Mini app registered successfully!");
        window.location.href = "/my-apps";
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to register mini app");
      }
    } catch (_error) {
      toast.error("Failed to register mini app");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#B6B09F]/10 via-black to-[#EAE4D5]/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(242,242,242,0.1),transparent_50%)]"></div>

      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-[#F2F2F2]/20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-[#F2F2F2]/10 hover:bg-[#F2F2F2]/20 transition-all duration-300 border border-[#F2F2F2]/30"
            >
              <ArrowLeft className="w-5 h-5 text-[#F2F2F2]" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#F2F2F2] to-[#EAE4D5] rounded-full blur opacity-30 animate-pulse"></div>
                <img
                  src="/logo.png"
                  alt="MiniScout"
                  className="w-8 h-8 rounded-full object-cover relative z-10"
                />
              </div>
              <h1 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
                Add Mini App
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6 relative z-10">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-[#F2F2F2] roboto-mono-400">
                Register Your Mini App
              </h1>
              <p className="text-[#B6B09F] text-sm roboto-mono-400">
                Upload your manifest and fill in the details
              </p>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-[#F2F2F2]/30">
          <h2 className="text-lg font-bold text-[#F2F2F2] mb-4 roboto-mono-400">
            Upload Manifest File
          </h2>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragActive
                ? "border-[#F2F2F2] bg-[#F2F2F2]/10"
                : "border-[#B6B09F] hover:border-[#F2F2F2] hover:bg-[#F2F2F2]/5"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-12 h-12 text-[#B6B09F] mx-auto mb-4" />
            <p className="text-[#F2F2F2] font-medium roboto-mono-400">
              {isDragActive
                ? "Drop the manifest file here"
                : "Drag & drop your manifest.json file here"}
            </p>
            <p className="text-[#B6B09F] text-sm mt-2 roboto-mono-400">
              or click to browse files
            </p>
          </div>
          {metadata && (
            <div className="mt-4 p-4 bg-[#F2F2F2]/10 rounded-lg border border-[#F2F2F2]/20">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-[#F2F2F2]" />
                <span className="text-[#F2F2F2] font-medium roboto-mono-400">
                  Manifest loaded successfully
                </span>
              </div>
            </div>
          )}
        </div>

        {/* App Details Form */}
        <div className="bg-black/50 backdrop-blur-xl rounded-xl p-6 border border-[#F2F2F2]/30 space-y-6">
          <h2 className="text-lg font-bold text-[#F2F2F2] roboto-mono-400">
            App Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="name" className="text-[#F2F2F2] roboto-mono-400">
                App Name *
              </Label>
              <Input
                id="name"
                type="text"
                value={appData.name}
                onChange={(e) =>
                  setAppData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="mt-2 bg-black/50 border-[#F2F2F2]/30 text-[#F2F2F2] placeholder-[#B6B09F] focus:border-[#F2F2F2] roboto-mono-400"
                placeholder="Enter app name"
              />
            </div>

            <div>
              <Label
                htmlFor="description"
                className="text-[#F2F2F2] roboto-mono-400"
              >
                Description *
              </Label>
              <Input
                id="description"
                type="text"
                value={appData.description}
                onChange={(e) =>
                  setAppData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                className="mt-2 bg-black/50 border-[#F2F2F2]/30 text-[#F2F2F2] placeholder-[#B6B09F] focus:border-[#F2F2F2] roboto-mono-400"
                placeholder="Enter app description"
              />
            </div>

            <div>
              <Label
                htmlFor="iconUrl"
                className="text-[#F2F2F2] roboto-mono-400"
              >
                Icon URL *
              </Label>
              <Input
                id="iconUrl"
                type="url"
                value={appData.iconUrl}
                onChange={(e) =>
                  setAppData((prev) => ({ ...prev, iconUrl: e.target.value }))
                }
                className="mt-2 bg-black/50 border-[#F2F2F2]/30 text-[#F2F2F2] placeholder-[#B6B09F] focus:border-[#F2F2F2] roboto-mono-400"
                placeholder="https://example.com/icon.png"
              />
            </div>

            <div>
              <Label
                htmlFor="splashUrl"
                className="text-[#F2F2F2] roboto-mono-400"
              >
                Splash Image URL
              </Label>
              <Input
                id="splashUrl"
                type="url"
                value={appData.splashUrl}
                onChange={(e) =>
                  setAppData((prev) => ({ ...prev, splashUrl: e.target.value }))
                }
                className="mt-2 bg-black/50 border-[#F2F2F2]/30 text-[#F2F2F2] placeholder-[#B6B09F] focus:border-[#F2F2F2] roboto-mono-400"
                placeholder="https://example.com/splash.png"
              />
            </div>

            <div>
              <Label
                htmlFor="homeUrl"
                className="text-[#F2F2F2] roboto-mono-400"
              >
                Home URL *
              </Label>
              <Input
                id="homeUrl"
                type="url"
                value={appData.homeUrl}
                onChange={(e) => handleHomeUrlChange(e.target.value)}
                className="mt-2 bg-black/50 border-[#F2F2F2]/30 text-[#F2F2F2] placeholder-[#B6B09F] focus:border-[#F2F2F2] roboto-mono-400"
                placeholder="https://example.com"
              />
              {checkingDomain && (
                <p className="text-[#B6B09F] text-sm mt-2 roboto-mono-400">
                  Checking domain availability...
                </p>
              )}
              {domainExists !== null && !checkingDomain && (
                <div className="flex items-center space-x-2 mt-2">
                  {domainExists ? (
                    <>
                      <XCircle className="w-4 h-4 text-[#B6B09F]" />
                      <span className="text-[#B6B09F] text-sm roboto-mono-400">
                        Apps from this domain already exist
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-[#F2F2F2]" />
                      <span className="text-[#F2F2F2] text-sm roboto-mono-400">
                        Domain available
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label
                htmlFor="miniappUrl"
                className="text-[#F2F2F2] roboto-mono-400"
              >
                Mini App URL *
              </Label>
              <Input
                id="miniappUrl"
                type="url"
                value={appData.miniappUrl}
                onChange={(e) =>
                  setAppData((prev) => ({
                    ...prev,
                    miniappUrl: e.target.value,
                  }))
                }
                className="mt-2 bg-black/50 border-[#F2F2F2]/30 text-[#F2F2F2] placeholder-[#B6B09F] focus:border-[#F2F2F2] roboto-mono-400"
                placeholder="https://example.com/miniapp"
              />
              <p className="text-[#B6B09F] text-xs mt-2 roboto-mono-400">
                This is the URL where users will access your mini app
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={handleSubmit}
            disabled={loading || !context?.user?.fid}
            className="bg-[#F2F2F2] hover:bg-[#F2F2F2]/80 disabled:bg-[#B6B09F] disabled:cursor-not-allowed rounded-lg px-8 py-3 text-black font-medium shadow-lg shadow-[#F2F2F2]/25 transition-all duration-300 roboto-mono-400"
          >
            {loading ? "Registering..." : "Register Mini App"}
          </Button>
        </div>

        {!context?.user?.fid && (
          <div className="text-center">
            <p className="text-[#B6B09F] text-sm roboto-mono-400">
              Please connect your wallet to register a mini app
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
