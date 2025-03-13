import Image from "next/image";
import Link from "next/link";
export default function Logo () {
    return ( <Link href="/">
        <div className="flex items-center justify-end pt-8 lg:mr-16  px-4">
          
            <Image
              src="/logo3.png"
              width={100}
              height={100}
              className="w-[50px] h-[50px] "
              alt="logo"
            />
            
            <h1 className="text-white text-2xl font-bold font-Tajawal">
              CyberXbytes
            </h1>
           
          </div></Link>

    );
}