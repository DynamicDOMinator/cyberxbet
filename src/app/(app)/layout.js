import Header from "@/app/components/Header";

export default function AppLayout({ children }) {
  return (
    <div className="bg-[#0B0D0F]">
      <Header />
      {children}
    </div>
  );
}
