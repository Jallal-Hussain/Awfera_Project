import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <>
      {/* Enhanced Footer */}
      <footer className="bg-[#E9F1FA] dark:bg-[#000F14] fixed bottom-0 w-full py-6 border border-t-[#008CBE] border-b-0 border-l-0 border-r-0 dark:border-[#008CBE] transition-colors duration-300 isolate">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <span className="text-sm">
              © {new Date().getFullYear()} CAG Project-Awfera
            </span>
            <span className="hidden md:block text-sm">All rights reserved</span>
            <div className="flex items-center gap-4">
              <span className="text-sm">
                developed by{" "}
                <Link
                  to="https://jallalhussain.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium hover:underline"
                >
                  Jallal Hussain
                </Link>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
