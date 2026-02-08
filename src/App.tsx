import { AppProvider } from "@/context/AppContext";
import Index from "@/pages/Index";

export default function App() {
  return (
    <AppProvider>
      <Index />
    </AppProvider>
  );
}
