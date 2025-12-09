import Link from "next/link"

export default function SizeMarketing() {
 
    return (
        <section lang="bn" className="w-full py-8 md:py-16  bg-off-white text-dark-brown font-sans">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                <div className="flex flex-col items-center justify-center space-y-2 md:space-y-5 text-center mb-5 md:mb-7">
                    <h1 className="text-lg sm:text-3xl md:text-4xl font-medium md:font-bold tracking-tight text-secondary leading-tight">
                        সাইজ নিয়ে আর চিন্তা নয়! <br className="sm:hidden" /> RS Leather BD-তে রয়েছে ৩৯ থেকে ৪৪ সাইজের সব স্টাইলিশ জুতা।
                    </h1>
                    <p className="max-w-2xl text-sm sm:text-base md:text-lg text-gray-700">
                        আপনার পছন্দের জুতা খুঁজে নিন আমাদের বিশাল কালেকশন থেকে। প্রতিটি জুতা হাতে তৈরি, সেরা মানের চামড়া দিয়ে।
                    </p>
                </div>

                <div className="bg-white  sm:p-5 rounded-2xl ">
                    <div className="text-center">
                        <Link
                            href="/" 
                            className="inline-block px-6 sm:px-10 py-2 sm:py-4 text-sm md:text-xl font-medium md:font-bold rounded-md sm:rounded-xl bg-primary text-secondary
                         shadow-medium hover:bg-primary/90 hover:shadow-lg transition-all duration-300 ease-in-out
                         transform hover:scale-105"
                            role="button"
                        >
                            সব সাইজের প্রোডাক্ট দেখুন 
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    )
}
