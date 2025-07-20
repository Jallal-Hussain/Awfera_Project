import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="isolate">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 -left-1/4 w-1/2 h-1/2 bg-[#000F14] dark:bg-[#008CBE] opacity-20 dark:opacity-30 rounded-full blur-3xl"></div>
      </div>
      <div className="container mx-auto px-6 md:px-10 lg:px-12 xl:px-20 py-15 md:py-20 lg:py-24 xl:py-28">
        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 xl:gap-16">
          <div className="flex-1 space-y-6 lg:space-y-7">
            <div className="space-y-4 lg:space-y-5">
              <div className="flex items-center">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#000F14] text-[#E9F1FA] dark:bg-[#E9F1FA] dark:text-[#000F14] mr-2">
                  New
                </span>
                <h2 className="inline-block px-3 py-1 5 lg:px-4 lg:py2 rounded-full fontmedium text-sm backdrop-blur-sm bg-[#000F14] text-[#E9F1FA] dark:bg-[#00ABE4] dark:text-[#000F14] border-2 border-[#008CBE]">
                  <i className="bx bx-trending-up bx-xs"></i> Python CAG Project
                  Awfera
                </h2>
              </div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight text-[#000F14] dark:text-[#E9F1FA]">
                <span className="block mb-1">Welcome</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#00ABE4] to-[#008CBE]">
                  to the CAG Project
                </span>
              </h1>
              <p className="text-base lg:text-medium text-[#647D96] font-light max-w-2xl">
                Welcome to our Python-powered solution designed for the modern
                age automation and intelligent interaction. Built using
                cutting-edge technoogies like FastAPI, LLMs, and modern frontend
                technologies and frameworks.
              </p>
              <div className="flex gap-3 items-baseline md:items-center">
                <div className="h-[4px] rounded-full bg-[#008CBE] dark:bg-[#96B4D2] w-12"></div>
                <p className="uppercase text-xs tracking-widest font-medium text-[#647D96] dark:text-[#96B4D2]">
                  enables seamless PDF document analysis
                </p>
              </div>
            </div>
            <div className="flex fex-wrap gap-3 lg:gap-4">
              <button className="px-6 py-3 lg:px-7 lg:py-3.5 bg-[#00ABE4] hover:bg-[#00ABE4]/80 text-[#FFFFFF] shadow-lg hover:shadow-[#00ABE4]/20 rounded-lg font-medium flex items-center transition group cursor-pointer">
                <Link to={"auth/login"}>
                  <i className="bx bx-code-alt mr-2 lg:mr-3 text-lg lg:text-xl group-hover:rotate-12 transition-transform"></i>
                  <span>Explore the Project</span>
                </Link>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
