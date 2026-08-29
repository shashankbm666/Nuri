import React, { createContext, useContext, useState, useEffect } from "react";
import { Auth0Provider as RealAuth0Provider, useAuth0 } from "@auth0/auth0-react";

/**
 * Auth0 Configuration & Custom Provider
 * 
 * Reads VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID from environment.
 * If credentials are not yet configured in .env, provides a graceful local simulation
 * so development/testing is not blocked, while immediately adopting real Auth0 once credentials are added.
 */

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;

const isAuth0Configured = 
  domain && 
  clientId && 
  !domain.includes("sample") && 
  !clientId.includes("placeholder");

const CustomAuthContext = createContext(null);

// Wrapper for when real Auth0 is active
function RealAuthBridge({ children }) {
  const auth0 = useAuth0();
  return (
    <CustomAuthContext.Provider value={{
      isAuthenticated: auth0.isAuthenticated,
      isLoading: auth0.isLoading,
      user: auth0.user,
      loginWithRedirect: auth0.loginWithRedirect,
      logout: (options) => auth0.logout({ logoutParams: { returnTo: window.location.origin }, ...options }),
      error: auth0.error,
      isRealAuth0: true
    }}>
      {children}
    </CustomAuthContext.Provider>
  );
}

// Fallback provider for local testing when .env holds placeholder credentials
function MockAuthFallbackProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("nuri_mock_auth") === "true";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("nuri_mock_user");
    return saved ? JSON.parse(saved) : null;
  });

  const loginWithRedirect = async (opts) => {
    setIsLoading(true);
    setTimeout(() => {
      const mockUser = {
        name: "Eleanor Vance",
        email: "eleanor.vance@example.com",
        picture: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        sub: "auth0|64f128e9421mock"
      };
      localStorage.setItem("nuri_mock_auth", "true");
      localStorage.setItem("nuri_mock_user", JSON.stringify(mockUser));
      setUser(mockUser);
      setIsAuthenticated(true);
      setIsLoading(false);
      window.location.hash = "#/patient/dashboard";
    }, 300);
  };

  const logout = () => {
    localStorage.removeItem("nuri_mock_auth");
    localStorage.removeItem("nuri_mock_user");
    setIsAuthenticated(false);
    setUser(null);
    window.location.hash = "#/";
  };

  return (
    <CustomAuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      loginWithRedirect,
      logout,
      error: null,
      isRealAuth0: false
    }}>
      {children}
    </CustomAuthContext.Provider>
  );
}

export function AuthProvider({ children }) {
  if (isAuth0Configured) {
    return (
      <RealAuth0Provider
        domain={domain}
        clientId={clientId}
        authorizationParams={{
          redirect_uri: window.location.origin
        }}
      >
        <RealAuthBridge>
          {children}
        </RealAuthBridge>
      </RealAuth0Provider>
    );
  }

  return (
    <MockAuthFallbackProvider>
      {children}
    </MockAuthFallbackProvider>
  );
}

export function useAuth() {
  const context = useContext(CustomAuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
