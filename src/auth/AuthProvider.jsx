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
  Boolean(domain && clientId && !domain.includes("sample") && !clientId.includes("placeholder"));

const CustomAuthContext = createContext(null);

// Wrapper for when real Auth0 is active
function RealAuthBridge({ children }) {
  const auth0 = useAuth0();
  
  // Clean up any stale mock session keys when real Auth0 is active
  useEffect(() => {
    if (auth0.isAuthenticated) {
      localStorage.removeItem("nuri_mock_auth");
      localStorage.removeItem("nuri_mock_user");
    }
  }, [auth0.isAuthenticated]);

  return (
    <CustomAuthContext.Provider value={{
      isAuthenticated: auth0.isAuthenticated,
      isLoading: auth0.isLoading,
      user: auth0.user, // Real Auth0 user object directly from SDK
      loginWithRedirect: auth0.loginWithRedirect,
      logout: (options) => auth0.logout({ logoutParams: { returnTo: window.location.origin }, ...options }),
      error: auth0.error,
      isRealAuth0: true
    }}>
      {children}
    </CustomAuthContext.Provider>
  );
}

// Fallback provider only for local offline sandbox testing when env credentials are intentionally absent
function MockAuthFallbackProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("nuri_mock_auth") === "true";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("nuri_mock_user");
    return saved ? JSON.parse(saved) : null;
  });

  const loginWithRedirect = async () => {
    setIsLoading(true);
    setTimeout(() => {
      // Dynamic fallback without any hardcoded/stale mock emails
      const mockUser = {
        name: "Verified Patient",
        email: "",
        picture: null,
        sub: `auth0|local_${Math.floor(100000 + Math.random() * 900000)}`
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
