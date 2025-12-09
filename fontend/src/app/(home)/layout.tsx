import MobileBottomNav from "@/components/common/mobile-bottom-nav";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";


export const metadata = {
    title: 'Cloudy BD'
}


export default async function HomeLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {


    return (

        <main
            className={``}
        >
            <Navbar />
            {children}
            <MobileBottomNav />
            <Footer />
        </main>
    );
}
