import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { Dashboard } from "./routes/Dashboard";
import { Login } from "./routes/Login";
import { Register } from "./routes/Register";
import { Verify } from "./routes/Verify";
import { OAuthCallback } from "./routes/OAuthCallback";
import { Connections } from "./routes/Connections";
import { Layout } from "./components/layout/Layout";
import { RequireAuth } from "./components/layout/RequireAuth";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import "./style/Layout.css";
import "./style/Header.css";
import "./style/Auth.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <RequireAuth><Dashboard /></RequireAuth> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
      { path: "/verify", element: <Verify /> },
      { path: "/oauth/callback", element: <OAuthCallback /> },
      { path: "/connections", element: <RequireAuth><Connections /></RequireAuth> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);