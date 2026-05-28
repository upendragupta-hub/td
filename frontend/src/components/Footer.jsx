// import {
//   Facebook,
//   HeartPulse,
//   Instagram,
//   Linkedin,
//   Mail,
//   MapPin,
//   Phone,
//   Twitter,
// } from 'lucide-react';

// export default function Footer({ onNavigate }) {
//   const currentYear = new Date().getFullYear();

//   return (
//     <footer className="mt-16 px-4 pb-6 sm:px-6 lg:px-8">
//       <div className="page-shell">
//         <div className="surface-dark overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 lg:px-12">
//           <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr]">
//             <div className="space-y-6">
//               <button
//                 type="button"
//                 onClick={() => onNavigate('home')}
//                 className="inline-flex items-center gap-3 text-left"
//               >
//                 <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
//                   <HeartPulse className="h-5 w-5 text-cyan-300" />
//                 </div>
//                 <div>
//                   <p className="text-lg font-extrabold text-white">WeCare Hospitals</p>
//                   <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
//                     Modern care, human touch
//                   </p>
//                 </div>
//               </button>

//               <p className="max-w-md text-sm leading-7 text-slate-300">
//                 We design every patient touchpoint to feel clear, fast, and reassuring, from online
//                 booking to specialist follow-up and digital records.
//               </p>

//               <div className="flex items-center gap-3">
//                 {[Twitter, Facebook, Instagram, Linkedin].map((Icon, index) => (
//                   <a
//                     key={index}
//                     href="#"
//                     className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-slate-300 hover:border-cyan-400/30 hover:bg-cyan-400/12 hover:text-white"
//                   >
//                     <Icon className="h-5 w-5" />
//                   </a>
//                 ))}
//               </div>
//             </div>

//             <div>
//               <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">Navigate</p>
//               <div className="mt-5 space-y-3 text-sm">
//                 <button onClick={() => onNavigate('about')} className="block text-slate-200 hover:text-cyan-300">
//                   About Us
//                 </button>
//                 <button onClick={() => onNavigate('departments')} className="block text-slate-200 hover:text-cyan-300">
//                   Departments
//                 </button>
//                 <button onClick={() => onNavigate('doctors')} className="block text-slate-200 hover:text-cyan-300">
//                   Doctors
//                 </button>
//                 <button onClick={() => onNavigate('appointment')} className="block text-slate-200 hover:text-cyan-300">
//                   Appointment
//                 </button>
//                 <button onClick={() => onNavigate('privacy')} className="block text-slate-200 hover:text-cyan-300">
//                   Privacy Policy
//                 </button>
//               </div>
//             </div>

//             <div>
//               <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">Services</p>
//               <div className="mt-5 space-y-3 text-sm text-slate-200">
//                 <button onClick={() => onNavigate('departments')} className="block hover:text-cyan-300">Cardiology</button>
//                 <button onClick={() => onNavigate('departments')} className="block hover:text-cyan-300">Neurology</button>
//                 <button onClick={() => onNavigate('departments')} className="block hover:text-cyan-300">Pediatrics</button>
//                 <button onClick={() => onNavigate('blood-bank')} className="block hover:text-cyan-300">Blood Bank</button>
//                 <button onClick={() => onNavigate('staff-portal')} className="block hover:text-cyan-300">Staff Portal</button>
//               </div>
//             </div>

//             <div className="space-y-4 rounded-[1.8rem] border border-white/10 bg-white/6 p-5">
//               <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-slate-300">Reach Us</p>
//               <div className="flex items-start gap-3 text-sm text-slate-200">
//                 <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
//                 <p>123 Medical Plaza, Healthcare District, New York, NY 10001</p>
//               </div>
//               <div className="flex items-center gap-3 text-sm text-slate-200">
//                 <Phone className="h-5 w-5 shrink-0 text-cyan-300" />
//                 <p>+1 (555) 000-1234</p>
//               </div>
//               <div className="flex items-center gap-3 text-sm text-slate-200">
//                 <Mail className="h-5 w-5 shrink-0 text-cyan-300" />
//                 <p>support@wecare.com</p>
//               </div>
//             </div>
//           </div>

//           <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
//             <p>© {currentYear} WeCare Hospitals. All rights reserved.</p>
//             <p>Designed to feel clear, calm, and dependable.</p>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// }









import {
  Facebook,
  HeartPulse,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Phone,
  Twitter,
} from "lucide-react";

export default function Footer({ onNavigate }) {

  const currentYear = new Date().getFullYear();

  return (

    <footer className="bg-[#07111f] text-white mt-20">

      <div className="max-w-7xl mx-auto px-6 py-16">

        {/* Top Section */}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">

          {/* Logo + About */}

          <div>

            <button
              type="button"
              onClick={() => onNavigate("home")}
              className="flex items-center gap-3"
            >

              <div className="bg-cyan-500/10 p-3 rounded-2xl">
                <HeartPulse className="w-6 h-6 text-cyan-400" />
              </div>

              <div>

                <h2 className="text-2xl font-bold">
                  WeCare
                </h2>

                <p className="text-slate-400 text-sm">
                  Modern Healthcare
                </p>

              </div>

            </button>

            <p className="text-slate-400 leading-7 text-sm mt-6">
              Providing trusted healthcare services with
              modern facilities, expert doctors, and
              compassionate patient care.
            </p>

            {/* Social Icons */}

            <div className="flex items-center gap-3 mt-6">

              {[Twitter, Facebook, Instagram, Linkedin].map(
                (Icon, index) => (

                  <a
                    key={index}
                    href="#"
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-cyan-500 hover:border-cyan-500 transition duration-300"
                  >

                    <Icon className="w-5 h-5" />

                  </a>

                )
              )}

            </div>

          </div>

          {/* Quick Links */}

          <div>

            <h3 className="text-lg font-semibold mb-6">
              Quick Links
            </h3>

            <div className="space-y-4 text-sm text-slate-400">

              <button
                onClick={() => onNavigate("about")}
                className="block hover:text-cyan-400 transition"
              >
                About Us
              </button>

              <button
                onClick={() => onNavigate("departments")}
                className="block hover:text-cyan-400 transition"
              >
                Departments
              </button>

              <button
                onClick={() => onNavigate("doctors")}
                className="block hover:text-cyan-400 transition"
              >
                Doctors
              </button>

              <button
                onClick={() => onNavigate("appointment")}
                className="block hover:text-cyan-400 transition"
              >
                Appointment
              </button>

              <button
                onClick={() => onNavigate("privacy")}
                className="block hover:text-cyan-400 transition"
              >
                Privacy Policy
              </button>

            </div>

          </div>

          {/* Services */}

          <div>

            <h3 className="text-lg font-semibold mb-6">
              Services
            </h3>

            <div className="space-y-4 text-sm text-slate-400">

              <button
                onClick={() => onNavigate("departments")}
                className="block hover:text-cyan-400 transition"
              >
                Cardiology
              </button>

              <button
                onClick={() => onNavigate("departments")}
                className="block hover:text-cyan-400 transition"
              >
                Neurology
              </button>

              <button
                onClick={() => onNavigate("departments")}
                className="block hover:text-cyan-400 transition"
              >
                Pediatrics
              </button>

              <button
                onClick={() => onNavigate("blood-bank")}
                className="block hover:text-cyan-400 transition"
              >
                Blood Bank
              </button>

              <button
                onClick={() => onNavigate("staff-portal")}
                className="block hover:text-cyan-400 transition"
              >
                Staff Portal
              </button>

            </div>

          </div>

          {/* Contact */}

          <div>

            <h3 className="text-lg font-semibold mb-6">
              Contact Info
            </h3>

            <div className="space-y-5 text-sm text-slate-400">

              <div className="flex items-start gap-3">

                <MapPin className="w-5 h-5 text-cyan-400 mt-1" />

                <p>
                  123 Medical Plaza, Healthcare District,
                  New York, NY 10001
                </p>

              </div>

              <div className="flex items-center gap-3">

                <Phone className="w-5 h-5 text-cyan-400" />

                <p>+1 (555) 000-1234</p>

              </div>

              <div className="flex items-center gap-3">

                <Mail className="w-5 h-5 text-cyan-400" />

                <p>support@wecare.com</p>

              </div>

            </div>

          </div>

        </div>

        {/* Bottom */}

        <div className="border-t border-white/10 mt-14 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">

          <p className="text-sm text-slate-500">
            © {currentYear} WeCare Hospitals. All rights reserved.
          </p>

          <p className="text-sm text-slate-500">
            Designed with care for better healthcare experience.
          </p>

        </div>

      </div>

    </footer>

  );

}