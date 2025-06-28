import { Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import BestRacketPage from "./pages/BestRacketPage";
import CompareRacketsPage from "./pages/CompareRacketsPage";
import FAQPage from "./pages/FAQPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RacketDetailPage from "./pages/RacketDetailPage";
import RacketsPage from "./pages/RacketsPage";
import RegisterPage from "./pages/RegisterPage";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="./" element={<HomePage />} />
        <Route path="/rackets" element={<RacketsPage />} />
        <Route path="/best-racket" element={<BestRacketPage />} />
        <Route path="/compare-rackets" element={<CompareRacketsPage />} />
        <Route path="/racket-detail" element={<RacketDetailPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Catch all route for 404 */}
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Layout>
  );
}

export default App;
