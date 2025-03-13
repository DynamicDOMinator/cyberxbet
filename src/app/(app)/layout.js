import Header from "@/app/components/Header";

export default function AppLayout({ children }) {
  return (
    <>
      <Header />
      {children}
    </>
  );
}
