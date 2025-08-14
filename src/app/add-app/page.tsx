"use client";

import { useState, useCallback } from "react";
import {
  Upload,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Navigation } from "~/components/ui/Navigation";
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
        } catch (error) {
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
    } catch (error) {
      console.error("Error checking domain:", error);
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
      toast.error("Please connect your Farcaster account");
      return;
    }

    if (
      !appData.name ||
      !appData.description ||
      !appData.homeUrl ||
      !appData.miniappUrl
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (domainExists) {
      toast.error("An app with this domain already exists");
      return;
    }

    // Verify ownership by checking if the user can access the miniapp URL
    setLoading(true);
    try {
      const verifyResponse = await fetch("/api/apps/verify-ownership", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          miniappUrl: appData.miniappUrl,
          ownerFid: context.user.fid,
        }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyData.verified) {
        toast.error(
          "Unable to verify app ownership. Please ensure you're the owner of this mini app."
        );
        setLoading(false);
        return;
      }

      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appData,
          ownerFid: context.user.fid,
          metadata,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("App registered successfully!");
        window.location.href = "/my-apps";
      } else {
        if (data.error?.includes("already registered")) {
          toast.error(
            "This mini app URL is already registered. Please use a different URL."
          );
        } else {
          toast.error(data.error || "Failed to register app");
        }
      }
    } catch (error) {
      console.error("Error registering app:", error);
      toast.error("Failed to register app");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.1),transparent_50%)]"></div>

      <div className="relative z-10">
        <Navigation title="Add Mini App" />

        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-6">
            <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Register New App
            </h1>
            <p className="text-gray-300 text-lg font-medium">
              Share your amazing mini app with the Farcaster community
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            {/* File Upload */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/20">
              <h2 className="text-xl font-black text-white mb-4">
                Upload Manifest File (Recommended)
              </h2>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                {isDragActive ? (
                  <p className="text-blue-600 font-medium">
                    Drop the manifest file here...
                  </p>
                ) : (
                  <div>
                    <p className="text-gray-600 font-medium mb-2">
                      Drag & drop your manifest file here
                    </p>
                    <p className="text-gray-500 text-sm">or click to browse</p>
                  </div>
                )}
              </div>
              {metadata && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">
                      Manifest loaded successfully!
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* App Details Form */}
            <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-purple-500/20 space-y-6">
              <h2 className="text-xl font-black text-white">App Details</h2>

              <div className="space-y-4">
                <div>
                  <Label
                    htmlFor="name"
                    className="text-sm font-medium text-purple-300"
                  >
                    App Name *
                  </Label>
                  <Input
                    id="name"
                    value={appData.name}
                    onChange={(e) =>
                      setAppData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter your app name"
                    className="mt-1 border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 bg-black/40 text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="description"
                    className="text-sm font-medium text-purple-300"
                  >
                    Description *
                  </Label>
                  <textarea
                    id="description"
                    value={appData.description}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe your app..."
                    rows={3}
                    className="mt-1 w-full px-4 py-3 border border-purple-500/30 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-black/40 text-white placeholder-gray-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="homeUrl"
                    className="text-sm font-medium text-purple-300"
                  >
                    Home URL *
                  </Label>
                  <div className="relative">
                    <Input
                      id="homeUrl"
                      value={appData.homeUrl}
                      onChange={(e) => handleHomeUrlChange(e.target.value)}
                      placeholder="https://your-app.com"
                      className="mt-1 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 pr-12"
                    />
                    {checkingDomain && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      </div>
                    )}
                    {domainExists !== null && !checkingDomain && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        {domainExists ? (
                          <XCircle className="w-5 h-5 text-red-500" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                    )}
                  </div>
                  {domainExists && (
                    <p className="mt-1 text-sm text-red-600">
                      An app with this domain already exists
                    </p>
                  )}
                  {domainExists === false && (
                    <p className="mt-1 text-sm text-green-600">
                      Domain is available
                    </p>
                  )}
                </div>

                <div>
                  <Label
                    htmlFor="iconUrl"
                    className="text-sm font-medium text-purple-300"
                  >
                    Icon URL
                  </Label>
                  <Input
                    id="iconUrl"
                    value={appData.iconUrl}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        iconUrl: e.target.value,
                      }))
                    }
                    placeholder="https://your-app.com/icon.png"
                    className="mt-1 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="splashUrl"
                    className="text-sm font-medium text-purple-300"
                  >
                    Splash Image URL
                  </Label>
                  <Input
                    id="splashUrl"
                    value={appData.splashUrl}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        splashUrl: e.target.value,
                      }))
                    }
                    placeholder="https://your-app.com/splash.png"
                    className="mt-1 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="miniappUrl"
                    className="text-sm font-medium text-purple-300"
                  >
                    Mini App URL *
                  </Label>
                  <Input
                    id="miniappUrl"
                    value={appData.miniappUrl}
                    onChange={(e) =>
                      setAppData((prev) => ({
                        ...prev,
                        miniappUrl: e.target.value,
                      }))
                    }
                    placeholder="https://your-app.com"
                    className="mt-1 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-purple-300">
                    This URL will be used to verify that you own this mini app
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button
                onClick={() => window.history.back()}
                className="flex-1 bg-black/40 hover:bg-black/60 text-purple-300 rounded-2xl py-3 font-bold border border-purple-500/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || domainExists === true}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-2xl py-3 font-bold shadow-2xl border border-purple-400/30 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  <span>Register App</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
