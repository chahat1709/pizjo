import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminConsole from "./pages/AdminConsoleV2";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/"} component={AdminConsole} />
      <Route path={"/orders"} component={AdminConsole} />
      <Route path={"/sales"} component={AdminConsole} />
      <Route path={"/inventory"} component={AdminConsole} />
      <Route path={"/menu"} component={AdminConsole} />
      <Route path={"/offers"} component={AdminConsole} />
      <Route path={"/invoices"} component={AdminConsole} />
      <Route path={"/invoice/:id"} component={AdminConsole} />
      <Route path={"/team"} component={AdminConsole} />
      <Route path={"/social"} component={AdminConsole} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
