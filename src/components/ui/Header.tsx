"use client";

import { useState } from "react";
import { ChevronDown, User, ArrowLeft, Menu, Plus, Wallet } from "lucide-react";
import { useContract } from "~/hooks/useContract";
import { useConnect, useDisconnect } from "wagmi";

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showAddButton?: boolean;
  onAddClick?: () => void;
  showMenuButton?: boolean;
  onMenuClick?: () => void;
}

export default function Header({
  title = "MiniScout",
  showBackButton = false,
  onBackClick,
  showAddButton = false,
  onAddClick,
  showMenuButton = false,
  onMenuClick,
}: HeaderProps) {
  const { isConnected, address } = useContract();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [walletDropdownOpen, setWalletDropdownOpen] = useState(false);

  const handleBackClick = () => {
    if (onBackClick) {
      onBackClick();
    } else {
      window.location.href = "/";
    }
  };

  const handleAddClick = () => {
    if (onAddClick) {
      onAddClick();
    } else {
      window.location.href = "/add-app";
    }
  };

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    }
  };

  return (
    <div className="bg-gradient-to-r from-white/20 to-[#ED775A]/10 shadow-sm border-b border-[#FAD691]/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button, Menu, and Logo */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="p-2 text-[#FAD691] hover:text-[#ED775A] hover:bg-[#FAD691]/20 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {showMenuButton && (
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-md text-[#FAD691] hover:text-[#ED775A] hover:bg-[#FAD691]/20"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-3">
              <h1 className="text-lg font-semibold text-[#FAD691] libertinus-keyboard-regular">
                {title}
              </h1>
            </div>
          </div>

          {/* Right side - Wallet info and actions */}
          <div className="flex items-center space-x-3">
            {isConnected ? (
              <>
                {/* Wallet Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setWalletDropdownOpen(!walletDropdownOpen)}
                    className="flex items-center space-x-2 px-3 py-2 bg-[#FAD691]/20 text-[#FAD691] rounded-md hover:bg-[#FAD691]/30 transition-colors arimo-500"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {walletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-[#0F0E0E] rounded-xl shadow-xl border-2 border-[#FAD691]/30 z-50">
                      <div className="py-2">
                        <div className="px-4 py-3 text-sm text-[#FAD691] border-b border-[#FAD691]/20">
                          <div className="font-medium arimo-600">
                            Connected Wallet
                          </div>
                          <div className="text-[#C9CDCF] text-xs mt-1 arimo-400">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(
                                  address as string
                                );
                              }}
                              className="text-xs text-[#FAD691] hover:text-[#ED775A] hover:bg-[#FAD691]/20 rounded-md px-2 py-1"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            disconnect();
                            setWalletDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-[#FAD691] hover:bg-[#ED775A]/20 transition-colors arimo-500 rounded-lg mx-2"
                        >
                          Disconnect Wallet
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {showAddButton && (
                  <button
                    onClick={handleAddClick}
                    className="p-2.5 bg-[#ED775A] text-white rounded-md hover:bg-[#FAD691] hover:text-[#0F0E0E] transition-colors"
                    title="Add New App"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <div className="relative">
                <button
                  onClick={() => connect({ connector: connectors[0] })}
                  className="flex items-center space-x-2 px-4 py-2 bg-[#ED775A] text-white rounded-md hover:bg-[#FAD691] hover:text-[#0F0E0E] transition-colors arimo-600"
                >
                  <Wallet className="w-4 h-4" />
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* {walletDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#0F0E0E] rounded-xl shadow-xl border-2 border-[#FAD691]/30 z-50">
                    <div className="py-2">
                      <div className="px-4 py-3 text-sm text-[#FAD691] border-b border-[#FAD691]/20">
                        <div className="font-medium arimo-600">
                          Choose Wallet
                        </div>
                        <div className="text-[#C9CDCF] text-xs mt-1 arimo-400">
                          Select your preferred wallet
                        </div>
                      </div>
                      {connectors.map((connector) => (
                        <button
                          key={connector.id}
                          onClick={() => {
                            connect({ connector });
                            setWalletDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-[#FAD691] hover:bg-[#ED775A]/20 transition-colors arimo-500 rounded-lg mx-2"
                        >
                          {connector.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )} */}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close wallet dropdown */}
      {/* {walletDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setWalletDropdownOpen(false)}
        />
      )} */}
    </div>
  );
}
