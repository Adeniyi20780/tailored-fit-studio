import { Link } from "react-router-dom";
import { Scissors, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const footerLinks = {
    Marketplace: [
      { label: "Browse Tailors", href: "/tailors" },
      { label: "Shop Catalog", href: "/catalog" },
      { label: "Perfect Fit Guarantee", href: "/perfect-fit-guarantee" },
    ],
    "For Tailors": [
      { label: "Become a Tailor", href: "/become-a-tailor" },
      { label: "Seller Dashboard", href: "/dashboard" },
      { label: "My Store", href: "/store" },
    ],
    Company: [
      { label: "About Us", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
    Support: [
      { label: "Help Center", href: "/help" },
      { label: "Shipping Info", href: "/shipping" },
      { label: "Returns", href: "/returns" },
      { label: "Size Guide", href: "/size-guide" },
    ],
  };

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Scissors className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="font-display text-xl font-semibold">
                TailorsShop
              </span>
            </Link>
            <p className="text-primary-foreground/70 mb-6 max-w-xs">
              Connecting master tailors with customers worldwide. Custom
              clothing, perfectly fitted with AI technology.
            </p>
            <div className="flex gap-4">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-sm uppercase tracking-wider mb-4">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} TailorsShop. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link
              to="/privacy"
              className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              to="/cookies"
              className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors"
            >
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
