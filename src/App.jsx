import { Navigate, Route, Routes } from "react-router-dom";
import { useStore } from "./lib/store.jsx";
import Layout from "./components/Layout.jsx";
import Auth from "./pages/Auth.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductForm from "./pages/ProductForm.jsx";
import Designer from "./pages/Designer.jsx";
import Gallery from "./pages/Gallery.jsx";
import Share from "./pages/Share.jsx";
import Profile from "./pages/Profile.jsx";
import Groups from "./pages/Groups.jsx";
import Bulk from "./pages/Bulk.jsx";
import Schedule from "./pages/Schedule.jsx";
import Analytics from "./pages/Analytics.jsx";

function Guard({ children }) {
  const { session } = useStore();
  if (!session) return <Navigate to="/auth" replace />;
  return children;
}

export default function App() {
  const { session } = useStore();

  return (
    <Routes>
      <Route path="/auth" element={session ? <Navigate to="/" replace /> : <Auth />} />
      <Route
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/new" element={<ProductForm />} />
        <Route path="/products/:id" element={<ProductForm />} />
        <Route path="/design" element={<Designer />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/share/:id" element={<Share />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/groups" element={<Groups />} />
        <Route path="/bulk" element={<Bulk />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to={session ? "/" : "/auth"} replace />} />
    </Routes>
  );
}
