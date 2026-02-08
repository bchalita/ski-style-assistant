import { useApp } from "@/context/AppContext";
import ChatPanel from "@/components/ChatPanel";
import SearchingScreen from "@/components/SearchingScreen";
import ResultsPage from "@/components/ResultsPage";
import CheckoutPage from "@/components/CheckoutPage";

export default function Index() {
  const { screen } = useApp();

  switch (screen) {
    case "chat":
      return <ChatPanel />;
    case "loading":
      return <SearchingScreen />;
    case "results":
      return <ResultsPage />;
    case "checkout":
      return <CheckoutPage />;
    default:
      return <ChatPanel />;
  }
}
