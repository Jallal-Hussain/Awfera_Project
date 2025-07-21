import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#E9F1FA] dark:bg-[#000F14] dark:text-[#E9F1FA] transition-colors duration-300 isolate relative">
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-30 dark:hidden"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0, 0, 0, 0.05), 1px, transparent), linear-gradient(to bottom, rgba(0, 0, 0, 0.05), 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        ></div>
        <div
          className="absolute inset-0 dark:hidden"
          style={{
            backgroundImage:
              "radial-gradient(to right, rgba(0, 0, 0, 0.1), 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        ></div>
      </div>
      <Header />
      {/* Main Content Area */}
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
