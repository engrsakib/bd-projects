import { ShoppingBag, Users, Target, Shield, Truck, Heart, Star, Mail, Phone, Globe } from "lucide-react"

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800">
      <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-neutral-900">
              Welcome to The Cloudy BD
            </h2>
          </div>
          <p className="leading-relaxed">
            Welcome to The Cloudy BD, your premier online shopping destination in Bangladesh. We are dedicated to making
            your shopping experience effortless, enjoyable, and rewarding.
          </p>
          <p className="leading-relaxed">
            At The Cloudy BD, we believe shopping should be simple and accessible to everyone. That&apos;s why we offer a
            wide variety of high-quality products, ranging from fashion and beauty to electronics, home essentials, and
            beyond—all at competitive prices.
          </p>
        </section>

        <hr className="border-neutral-200" />

        {/* Who We Are */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Users className="h-7 w-7 text-neutral-500" />
            <h2 className="text-2xl font-semibold text-neutral-900">
              Who We Are
            </h2>
          </div>
          <p className="leading-relaxed">
            Founded with the vision to revolutionize eCommerce in Bangladesh, The Cloudy BD is more than just an online
            store. We are a team of passionate individuals committed to providing you with the best products and
            services. Our goal is to empower shoppers with choice, convenience, and trust.
          </p>
        </section>

        <hr className="border-neutral-200" />

        {/* What We Offer */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Star className="h-7 w-7 text-neutral-500" />
            <h2 className="text-2xl font-semibold text-neutral-900">
              What We Offer
            </h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <ShoppingBag className="h-6 w-6 mt-1 text-neutral-500" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  A Wide Product Range
                </h3>
                <p className="leading-relaxed">
                  From everyday essentials to luxury items, we&apos;ve got something for everyone.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Heart className="h-6 w-6 mt-1 text-neutral-500" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  Affordable Pricing
                </h3>
                <p className="leading-relaxed">
                  We ensure the best value for your money without compromising quality.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Truck className="h-6 w-6 mt-1 text-neutral-500" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  Fast Delivery
                </h3>
                <p className="leading-relaxed">
                  Our efficient logistics ensure your orders reach your doorstep quickly and securely.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Users className="h-6 w-6 mt-1 text-neutral-500" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  Customer Satisfaction
                </h3>
                <p className="leading-relaxed">
                  Our priority is to create a smooth shopping experience for every customer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-neutral-200" />

        {/* Mission */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <Target className="h-7 w-7 text-neutral-500" />
            <h2 className="text-2xl font-semibold text-neutral-900">
              Our Mission
            </h2>
          </div>
          <p className="leading-relaxed">
            To become the most reliable and customer-friendly eCommerce platform in Bangladesh by continuously enhancing
            our offerings and services.
          </p>
        </section>

        <hr className="border-neutral-200" />

        {/* Why Choose Us */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="h-7 w-7 text-neutral-500" />
            <h2 className="text-2xl font-semibold text-neutral-900">
              Why Choose Us?
            </h2>
          </div>

          <div className="space-y-5">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full mt-2 bg-neutral-400" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  Quality Assurance
                </h3>
                <p className="leading-relaxed">
                  Every product is carefully selected to meet your expectations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full mt-2 bg-neutral-400" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  Secure Shopping
                </h3>
                <p className="leading-relaxed">
                  Enjoy a safe and reliable online shopping experience with secure payment options.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full mt-2 bg-neutral-400" />
              <div className="space-y-2">
                <h3 className="font-semibold text-lg text-neutral-900">
                  Exceptional Support
                </h3>
                <p className="leading-relaxed">
                  Our dedicated customer service team is always here to help with your questions and concerns.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="border-neutral-200" />
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Join Our Journey
          </h2>
          <p className="leading-relaxed">
            At The Cloudy BD, we are constantly growing and innovating to meet your needs. Whether you&apos;re shopping for
            yourself or finding the perfect gift, we&apos;re here to make it an enjoyable experience.
          </p>
          <p className="leading-relaxed">
            Thank you for choosing The Cloudy BD—your trust is the driving force behind our success.
          </p>
        </section>

        <hr className="border-neutral-200" />

        {/* Contact */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-neutral-900">
            Contact Us
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-neutral-500" />
              <span className="text-base">support@thecloudybd.com</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-neutral-500" />
              <span className="text-base">+8801834956470</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-neutral-500" />
              <span className="text-base">www.thecloudybd.com</span>
            </div>
          </div>
        </section>

        {/* Footer tagline */}
        <div className="text-center py-8">
          <h3 className="text-xl font-semibold text-neutral-700">
            The Cloudy BD: Classy, Comfort, Casual!
          </h3>
        </div>
      </div>
    </div>
  )
}

export default AboutPage;
