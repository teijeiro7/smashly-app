import LayOut from "./components/layout/Layout";
import { PageProvider } from "./contexts/PageContext";
import NewsletterPage from "./pages/NewsletterPage";

function App() {
  return (
    <PageProvider>
      <LayOut>
        <NewsletterPage />
      </LayOut>
    </PageProvider>
  );
}

export default App;
