import "../globals.css";
import AOSInit from "../components/AOSInit";

export default function HomeLayout({ children }) {
  return (
    <>
      <AOSInit />
      {children}
    </>
  );
}
