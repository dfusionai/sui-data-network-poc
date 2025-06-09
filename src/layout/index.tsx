import React from "react";
import Header from "./components/header";

interface IMainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: IMainLayoutProps) => {
  return (
    <div className="min-h-screen w-full">
      <Header />

      <div className="bg-[#151d2a] min-h-screen">{children}</div>
    </div>

    
  );
};

export default MainLayout;
