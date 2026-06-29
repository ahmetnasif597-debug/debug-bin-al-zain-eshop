import { MapPin, Phone, MessageCircle, Instagram, Facebook } from "lucide-react";

export default function About() {
  return (
    <div className="container mx-auto px-4 py-16 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-16">

        {/* Story Section */}
        <section className="text-center space-y-6">
          <img src="/images/logo-transparent.png" alt="بن الزين" className="w-36 mx-auto mb-2" />
          <h1 className="text-4xl md:text-5xl font-black text-primary">حكاية بن الزين</h1>
          <div className="w-24 h-1 bg-secondary mx-auto rounded-full"></div>
          <div className="prose prose-lg mx-auto prose-p:text-muted-foreground prose-p:leading-loose text-lg md:text-xl font-medium mt-8">
            <p>
              في قلب حلب العريقة، وتحديداً في حي الفرقان على شارع الفتال، يقع "بن الزين" ليقدم لزبائنه تجربة أصيلة تمتزج فيها روائح البن المحمص مع عبق التوابل الحلبية.
            </p>
            <p>
              تأسس المحل على مبدأ الجودة العالية والخدمة المميزة، حيث نحرص على انتقاء أفضل أنواع البن العربي 100% Arabica، وأجود أصناف المكسرات، والمواد الغذائية التي تلبي احتياجات العائلة السورية.
            </p>
            <p>
              ليس بن الزين مجرد متجر، بل هو امتداد لتراث السوق الحلبي الذي يقدر العلاقة الطيبة مع الزبون ويجعل من زيارة المحل تجربة مليئة بالود والترحاب.
            </p>
          </div>
          {/* Trust Badges */}
          <div className="flex justify-center gap-6 mt-6">
            <span className="px-5 py-2 bg-primary/10 text-primary font-bold rounded-full border border-primary/20 text-sm">
              100% Arabica
            </span>
            <span className="px-5 py-2 bg-primary/10 text-primary font-bold rounded-full border border-primary/20 text-sm">
              HAL
            </span>
          </div>
        </section>

        {/* Decorative Divider */}
        <div className="flex justify-center text-primary/30 text-3xl">
          ❋ ❋ ❋
        </div>

        {/* Contact Info */}
        <section className="bg-card rounded-3xl p-8 md:p-12 shadow-md border border-border relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>

          <h2 className="text-3xl font-black text-foreground mb-10 relative z-10">تواصل معنا</h2>

          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            {/* Address */}
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl border border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <MapPin className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-3">موقعنا</h3>
              <p className="text-muted-foreground font-medium leading-relaxed mb-4">
                حلب - الفرقان<br />شارع الفتال<br />مقابل أحذية الآغا
              </p>
              <a
                href="https://maps.app.goo.gl/baDcJud8bVrP8g3u5"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground font-bold rounded-full text-sm hover:opacity-90 transition-opacity"
              >
                <MapPin className="w-4 h-4" />
                عرض على الخريطة
              </a>
            </div>

            {/* Phone */}
            <div className="flex flex-col items-center text-center p-6 bg-background rounded-2xl border border-border hover:border-primary/50 transition-colors">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                <Phone className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-3">الهاتف</h3>
              <a
                href="tel:0962823756"
                className="text-muted-foreground font-medium font-sans hover:text-primary transition-colors"
                dir="ltr"
              >
                0962823756
              </a>
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col items-center text-center p-6 bg-[#25D366]/10 rounded-2xl border border-[#25D366]/30 hover:border-[#25D366] transition-colors">
              <div className="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-[#25D366]/30">
                <MessageCircle className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-xl mb-3">واتساب</h3>
              <p className="text-[#128C7E] font-medium font-sans mb-4" dir="ltr">
                +963962823756
              </p>
              <button
                onClick={() => window.open('https://wa.me/963962823756', '_blank')}
                className="text-sm font-bold text-white bg-[#25D366] px-6 py-2 rounded-full hover:bg-[#128C7E] transition-colors"
              >
                مراسلة الآن
              </button>
            </div>
          </div>

          {/* Social Media */}
          <div className="mt-10 pt-8 border-t border-border relative z-10">
            <h3 className="text-xl font-bold text-foreground mb-6 text-center">تابعنا على منصات التواصل</h3>
            <div className="flex justify-center gap-6">
              <a
                href="https://www.instagram.com/zen_cofe?igsh=NWt2eDEwOHZueGFv"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-tr from-[#f09433] via-[#e6683c] to-[#bc1888] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity"
              >
                <Instagram className="w-5 h-5" />
                <span>Instagram</span>
              </a>
              <a
                href="https://www.facebook.com/share/14e5tNuBUXU/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-[#1877F2] text-white font-bold rounded-2xl hover:opacity-90 transition-opacity"
              >
                <Facebook className="w-5 h-5" />
                <span>Facebook</span>
              </a>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
