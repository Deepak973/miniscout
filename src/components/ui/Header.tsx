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
    <div className="bg-white shadow-sm border-b border-[#81b622]/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Back button, Menu, and Logo */}
          <div className="flex items-center space-x-4">
            {showBackButton && (
              <button
                onClick={handleBackClick}
                className="p-2 text-[#3d550c] hover:text-[#59981a] hover:bg-[#ecf87f]/20 rounded-md"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}

            {showMenuButton && (
              <button
                onClick={handleMenuClick}
                className="p-2 rounded-md text-[#3d550c] hover:text-[#59981a] hover:bg-[#ecf87f]/20"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center space-x-3">
              <img
                src="/logo.png"
                alt="MiniScout"
                className="w-8 h-8 rounded"
              />
              <h1 className="text-xl font-semibold text-[#3d550c]">{title}</h1>
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
                    className="flex items-center space-x-2 px-3 py-2 bg-[#ecf87f]/20 text-[#3d550c] rounded-md hover:bg-[#ecf87f]/30 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    <span className="text-sm font-medium hidden sm:inline">
                      {address?.slice(0, 6)}...{address?.slice(-4)}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {walletDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-[#ecf87f]/30 z-50">
                      <div className="py-1">
                        <div className="px-4 py-2 text-sm text-[#3d550c] border-b border-[#ecf87f]/20">
                          <div className="font-medium">Connected Wallet</div>
                          <div className="text-[#59981a] text-xs mt-1">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            disconnect();
                            setWalletDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-[#3d550c] hover:bg-[#ecf87f]/20 transition-colors"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {showAddButton && (
                  <button
                    onClick={handleAddClick}
                    className="p-2.5 bg-[#59981a] text-white rounded-md hover:bg-[#81b622] transition-colors"
                    title="Add New App"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="p-2 bg-[#59981a] text-white rounded-md hover:bg-[#81b622] flex items-center justify-center"
              >
                <Wallet className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close wallet dropdown */}
      {walletDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setWalletDropdownOpen(false)}
        />
      )}
    </div>
  );
}
