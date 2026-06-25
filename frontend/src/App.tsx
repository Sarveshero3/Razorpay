import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { MyReimbursements } from "./pages/emp/MyReimbursements";
import { TeamReimbursements } from "./pages/rm/TeamReimbursements";
import { PendingApprovals } from "./pages/ape/PendingApprovals";
import { CfoDashboard } from "./pages/cfo/CfoDashboard";

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "EMP":
      return <Navigate to="/my-reimbursements" replace />;
    case "RM":
      return <Navigate to="/team-reimbursements" replace />;
    case "APE":
      return <Navigate to="/pending-approvals" replace />;
    case "CFO":
      return <Navigate to="/final-approvals" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const DirectoryRouter: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === "CFO") {
    return <CfoDashboard />;
  }
  if (user?.role === "APE") {
    return <PendingApprovals />;
  }
  return <Navigate to="/" replace />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Authenticated Routes wrapped in Layout */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    
                    {/* EMP Routes */}
                    <Route
                      path="/my-reimbursements"
                      element={
                        <ProtectedRoute allowedRoles={["EMP"]}>
                          <MyReimbursements />
                        </ProtectedRoute>
                      }
                    />

                    {/* RM Routes */}
                    <Route
                      path="/team-reimbursements"
                      element={
                        <ProtectedRoute allowedRoles={["RM"]}>
                          <TeamReimbursements />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/my-team"
                      element={
                        <ProtectedRoute allowedRoles={["RM"]}>
                          <TeamReimbursements />
                        </ProtectedRoute>
                      }
                    />

                    {/* APE Routes */}
                    <Route
                      path="/pending-approvals"
                      element={
                        <ProtectedRoute allowedRoles={["APE"]}>
                          <PendingApprovals />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/directory"
                      element={
                        <ProtectedRoute allowedRoles={["APE", "CFO"]}>
                          <DirectoryRouter />
                        </ProtectedRoute>
                      }
                    />

                    {/* CFO Routes */}
                    <Route
                      path="/final-approvals"
                      element={
                        <ProtectedRoute allowedRoles={["CFO"]}>
                          <CfoDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/org-structure"
                      element={
                        <ProtectedRoute allowedRoles={["CFO"]}>
                          <CfoDashboard />
                        </ProtectedRoute>
                      }
                    />

                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
