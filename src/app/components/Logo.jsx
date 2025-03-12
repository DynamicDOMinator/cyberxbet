import Image from "next/image";
import Link from "next/link";
export default function Logo () {
    return (
        <div className="flex items-center justify-end pt-8 lg:mr-16 gap-4 px-4">
            <h1 className="text-white text-2xl font-bold font-Tajawal">
              CyberXbytes
            </h1>
            <Link href="/">
            <Image
              src="/logo.png"
              width={100}
              height={100}
              className="w-[40px] h-[58px] "
              alt="logo"
            />
            </Link>
          </div>

    );
}