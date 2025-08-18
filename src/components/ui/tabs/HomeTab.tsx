"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Plus, Star, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "~/components/ui/Button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { MiniApp } from "~/lib/types";
import { useMiniApp } from "@neynar/react";
import toast from "react-hot-toast";

export function HomeTab() {
  const { context } = useMiniApp();
  const [appData, setAppData] = useState({
    name: "",
    description: "",
    iconUrl: "",
    splashUrl: "",
    homeUrl: "",
  });
  const [metadata, setMetadata] = useState<any>(null);
  const [registeredApps, setRegisteredApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const metadataContent = JSON.parse(e.target?.result as string);
          setMetadata(metadataContent);

          // Auto-fill form fields from metadata
          if (metadataContent.frame) {
            setAppData({
              name: metadataContent.frame.name || "",
              description: metadataContent.frame.description || "",
              iconUrl: metadataContent.frame.iconUrl || "",
              splashUrl: metadataContent.frame.splashImageUrl || "",
              homeUrl: metadataContent.frame.homeUrl || "",
            });
          }

          toast.success("Metadata file loaded successfully!");
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

  const fetchRegisteredApps = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/apps?ownerFid=${context?.user?.fid || 0}`
      );
      const data = await response.json();
      setRegisteredApps(data.apps || []);
    } catch (_error) {
      console.error("Error fetching apps:", _error);
    } finally {
      setLoading(false);
    }
  }, [context?.user?.fid]);

  const handleSubmit = async () => {
    if (!appData.name || !appData.description || !appData.homeUrl) {
      toast.error(
        "Please fill in all required fields or upload a manifest file"
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/apps", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...appData,
          metadata,
          ownerFid: context?.user?.fid || 0,
        }),
      });

      const data = await response.json();
      if (data.success) {
        toast.success("App registered successfully!");
        setAppData({
          name: "",
          description: "",
          iconUrl: "",
          splashUrl: "",
          homeUrl: "",
        });
        setMetadata(null);
        fetchRegisteredApps();
      } else {
        toast.error(data.error || "Failed to register app");
      }
    } catch (_error) {
      console.error("Error registering app:", _error);
      toast.error("Failed to register app");
    } finally {
      setSubmitting(false);
    }
  };

  const copyFeedbackLink = async (appId: string) => {
    const feedbackUrl = `${window.location.origin}/feedback/${appId}`;
    try {
      await navigator.clipboard.writeText(feedbackUrl);
      setCopiedAppId(appId);
      toast.success("Feedback link copied to clipboard!");
      setTimeout(() => setCopiedAppId(null), 2000);
    } catch (_error) {
      toast.error("Failed to copy link");
    }
  };

  // Fetch apps on component mount
  useEffect(() => {
    fetchRegisteredApps();
  }, [fetchRegisteredApps]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">MiniScout</h1>
        <p className="text-gray-600">
          Register your mini app and collect feedback from users
        </p>
      </div>

      {/* App Registration Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6">Register Your Mini App</h2>

        {/* File Upload */}
        <div className="mb-6">
          <Label className="block text-sm font-medium mb-2">
            Upload Manifest Files (Recommended)
          </Label>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
              isDragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            {isDragActive ? (
              <p className="text-blue-600">Drop the metadata file here...</p>
            ) : (
              <div>
                <p className="text-gray-600">
                  Drag & drop a JSON manifest file here, or click to select
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  This will auto-fill all the form fields from your manifest
                </p>
              </div>
            )}
          </div>
          {metadata && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Manifest file loaded successfully
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="name" className="block text-sm font-medium mb-2">
              App Name {!metadata && "*"}
            </Label>
            <Input
              id="name"
              value={appData.name}
              onChange={(e) => setAppData({ ...appData, name: e.target.value })}
              placeholder="Enter your app name"
            />
          </div>

          <div>
            <Label htmlFor="homeUrl" className="block text-sm font-medium mb-2">
              Home URL {!metadata && "*"}
            </Label>
            <Input
              id="homeUrl"
              value={appData.homeUrl}
              onChange={(e) =>
                setAppData({ ...appData, homeUrl: e.target.value })
              }
              placeholder="https://your-app.com"
            />
          </div>

          <div className="md:col-span-2">
            <Label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description {!metadata && "*"}
            </Label>
            <textarea
              id="description"
              value={appData.description}
              onChange={(e) =>
                setAppData({ ...appData, description: e.target.value })
              }
              placeholder="Describe your mini app..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="iconUrl" className="block text-sm font-medium mb-2">
              Icon URL
            </Label>
            <Input
              id="iconUrl"
              value={appData.iconUrl}
              onChange={(e) =>
                setAppData({ ...appData, iconUrl: e.target.value })
              }
              placeholder="https://your-app.com/icon.png"
            />
          </div>

          <div>
            <Label
              htmlFor="splashUrl"
              className="block text-sm font-medium mb-2"
            >
              Splash Image URL
            </Label>
            <Input
              id="splashUrl"
              value={appData.splashUrl}
              onChange={(e) =>
                setAppData({ ...appData, splashUrl: e.target.value })
              }
              placeholder="https://your-app.com/splash.png"
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Registering...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Register App</span>
            </div>
          )}
        </Button>
      </div>

      {/* Registered Apps */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold mb-6">Your Registered Apps</h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        ) : registeredApps.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">
              No apps registered yet. Register your first app above!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {registeredApps.map((app) => (
              <div
                key={app.appId}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={app.iconUrl || "/icon.png"}
                      alt={app.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/icon.png";
                      }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {app.name}
                      </h3>
                      <p className="text-sm text-gray-600">{app.description}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-sm font-medium">
                            {app.averageRating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({app.totalRatings} ratings)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => copyFeedbackLink(app.appId)}
                      className="px-3 py-1.5 text-xs border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      {copiedAppId === app.appId ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="ml-1">
                        {copiedAppId === app.appId ? "Copied!" : "Copy Link"}
                      </span>
                    </Button>

                    <Button
                      onClick={() =>
                        window.open(`/feedback/${app.appId}`, "_blank")
                      }
                      className="px-3 py-1.5 text-xs border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="ml-1">View</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
