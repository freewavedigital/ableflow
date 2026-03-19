import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/query-client";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "./lib/PageNotFound";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import UserNotRegisteredError from "@/components/UserNotRegisteredError";
import { BranchProvider } from "@/hooks/useBranch";

// Layout
import AppLayout from "@/components/layout/AppLayout";

// Pages
import Dashboard from "@/pages/Dashboard";
import Enquiries from "@/pages/Enquiries";
import EnquiryDetail from "@/pages/EnquiryDetail";
import Jobs from "@/pages/Jobs";
import JobDetail from "@/pages/JobDetail";
import CreateJob from "@/pages/CreateJob";
import Schedule from "@/pages/Schedule";
import Clients from "@/pages/Clients";
import ClientDetail from "@/pages/ClientDetail";
import Quotes from "@/pages/Quotes";
import Invoices from "@/pages/Invoices";
import Tasks from "@/pages/Tasks";
import MyJobs from "@/pages/MyJobs";
import TechJobDetail from "@/pages/TechJobDetail";
import JobTemplates from "@/pages/JobTemplates";

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-muted border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === "user_not_registered") {
      return <UserNotRegisteredError />;
    } else if (authError.type === "auth_required") {
      navigateToLogin();
      return null;
    }
  }

  return (
    <BranchProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/Dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/Dashboard" element={<Dashboard />} />
          <Route path="/Enquiries" element={<Enquiries />} />
          <Route path="/EnquiryDetail" element={<EnquiryDetail />} />
          <Route path="/Jobs" element={<Jobs />} />
          <Route path="/JobDetail" element={<JobDetail />} />
          <Route path="/CreateJob" element={<CreateJob />} />
          <Route path="/Schedule" element={<Schedule />} />
          <Route path="/Clients" element={<Clients />} />
          <Route path="/ClientDetail" element={<ClientDetail />} />
          <Route path="/Quotes" element={<Quotes />} />
          <Route path="/Invoices" element={<Invoices />} />
          <Route path="/Tasks" element={<Tasks />} />
          <Route path="/MyJobs" element={<MyJobs />} />
          <Route path="/TechJobDetail" element={<TechJobDetail />} />
          <Route path="/JobTemplates" element={<JobTemplates />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </BranchProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;