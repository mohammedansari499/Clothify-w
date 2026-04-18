import { Link } from "react-router-dom";
import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";

export default function Footer({ className }) {
    return (
        <footer className={`w-full border-t border-border-subtle ${className}`}>
            {/* TOP SECTION */}
            <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10 text-sm">

                {/* COLUMN 1 */}
                <div>
                    <h3 className="text-text font-semibold mb-4">Product</h3>
                    <ul className="space-y-2 text-text-muted">
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="/features">Features</Link></li>
                        <li><Link to="/planner">Planner</Link></li>
                        <li><Link to="/wardrobe">Wardrobe</Link></li>
                    </ul>
                </div>

                {/* COLUMN 2 */}
                <div>
                    <h3 className="text-text font-semibold mb-4">Company</h3>
                    <ul className="space-y-2 text-text-muted">
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/careers">Jobs</Link></li>
                    </ul>
                </div>

                {/* COLUMN 3 */}
                <div>
                    <h3 className="text-text font-semibold mb-4">Legal</h3>
                    <ul className="space-y-2 text-text-muted">
                        <li><Link to="/terms">User Agreement</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                        <li><Link to="/cookies">Cookie Policy</Link></li>
                    </ul>
                </div>

                {/* COLUMN 4 */}
                <div>
                    <h3 className="text-text font-semibold mb-4">Social</h3>
                    <div className="flex items-center gap-4 text-text-muted">

                        <a href="#" className="hover:text-primary transition">
                            <Instagram size={18} />
                        </a>

                        <a href="#" className="hover:text-primary transition">
                            <Facebook size={18} />
                        </a>

                        <a href="#" className="hover:text-primary transition">
                            <Twitter size={18} />
                        </a>

                        <a href="#" className="hover:text-primary transition">
                            <Linkedin size={18} />
                        </a>

                    </div>
                </div>

            </div>

            {/* BOTTOM STRIP */}
            <div className="border-t border-border-subtle">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">

                    <div>
                        © {new Date().getFullYear()} Clothify — Wear Yourself
                    </div>

                    <div className="flex gap-6">
                        <Link to="/terms" className="hover:text-primary">Terms</Link>
                        <Link to="/privacy" className="hover:text-primary">Privacy</Link>
                    </div>

                </div>
            </div>

        </footer>
    );
}