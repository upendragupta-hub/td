
// import { motion, AnimatePresence } from 'framer-motion';
// import {
//   LayoutDashboard,
//   LogOut,
//   Menu,
//   User,
//   Users,
//   X,
//   HeartPulse,
// } from 'lucide-react';
// import { useState } from 'react';
// import { useAuth } from '../context/AuthContext';
// import { useUserAuth } from '../context/UserAuthContext';

// export default function Navbar({ onNavigate, currentPage }) {
//   const [isOpen, setIsOpen] = useState(false);

//   const { isAuthenticated: isAdmin, logout: adminLogout } = useAuth();
//   const { isUserAuthenticated: isPatient, user, userLogout } =
//     useUserAuth();

//   const adminTarget = isAdmin ? 'admin' : 'admin-login';

//   const navLinks = [
//     { name: 'Home', id: 'home' },
//     { name: 'About', id: 'about' },
//     { name: 'Departments', id: 'departments' },
//     { name: 'Doctors', id: 'doctors' },
//     { name: 'Ambulance', id: 'ambulance' },
//     { name: 'Blood Bank', id: 'blood-bank' },
//   ];

//   if (isAdmin) {
//     navLinks.push({ name: 'Beds', id: 'beds' });
//     navLinks.push({ name: 'Billing', id: 'billing' });
//   }

//   const handleNav = (page) => {
//     onNavigate(page);
//     setIsOpen(false);
//   };

//   const handleLogout = async () => {
//     if (isAdmin) await adminLogout();
//     if (isPatient) await userLogout();

//     handleNav('home');
//   };

//   return (
//     <nav className="fixed top-0 inset-x-0 z-50  pt-0">
//       <div className="mx-auto w-full">
//         <div className="flex items-center justify-between rounded border border-slate-200/70 bg-white/90 px-5 py-3 shadow-lg backdrop-blur-xl">

//           {/* Logo */}
//           <button
//             onClick={() => handleNav('home')}
//             className="flex items-center gap-3"
//           >
//             <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md">
//               <HeartPulse className="h-5 w-5 text-white" />
//             </div>

//             <div className="leading-tight">
//               <h1 className="text-lg font-bold text-slate-900">
//                 We<span className="text-cyan-600">Care</span>
//               </h1>

//               <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">
//                 Hospital Care
//               </p>
//             </div>
//           </button>


//           {/* Desktop Menu */}
//           <div className="hidden lg:flex flex-1 items-center justify-center">
//             <div className="flex items-center gap-1  p-1.5 ">

//               {navLinks.map((link) => {
//                 const isActive = currentPage === link.id;

//                 return (
//                   <button
//                     key={link.id}
//                     onClick={() => handleNav(link.id)}
//                     className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${isActive
//                       ? 'bg-slate-900 text-white shadow-md'
//                       : 'text-slate-600 hover:bg-white hover:text-slate-900'
//                       }`}
//                   >
//                     {link.name}
//                   </button>
//                 );
//               })}
//             </div>
//           </div>

//           {/* Right Section */}
//           <div className="hidden lg:flex items-center gap-3">

//             {/* Staff + Admin */}
//             <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 ">
//               <button
//                 onClick={() => handleNav('staff-portal')}
//                 className="flex items-center gap-2 rounded-full text-sm font-medium text-slate-600 hover:bg-white"
//               >
//                 <Users className="h-4 w-4" />
//                 Staff
//               </button>

//               <button
//                 onClick={() => handleNav(adminTarget)}
//                 className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50"
//               >
//                 <LayoutDashboard className="h-4 w-4" />
//                 Admin
//               </button>
//             </div>

//             {/* Appointment */}
//             <button
//               onClick={() => handleNav('appointment')}
//               className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-800"
//             >
//               Book Visit
//             </button>

//             {/* User */}
//             {isPatient ? (
//               <div className="flex items-center gap-2">
//                 <button
//                   onClick={() => handleNav('user-panel')}
//                   className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
//                 >
//                   <User className="h-4 w-4 text-cyan-600" />
//                   {user?.username || 'Patient'}
//                 </button>

//                 <button
//                   onClick={handleLogout}
//                   className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:text-rose-500"
//                 >
//                   <LogOut className="h-4 w-4" />
//                 </button>
//               </div>
//             ) : (

//               <button
//                 onClick={() => handleNav('user-login')}
//                 className="rounded border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
//               >
//                 Patient Login
//               </button>
//             )}
//           </div>

//           {/* Mobile Menu */}
//           <button
//             onClick={() => setIsOpen(!isOpen)}
//             className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 lg:hidden"
//           >
//             {isOpen ? (
//               <X className="h-5 w-5" />
//             ) : (
//               <Menu className="h-5 w-5" />
//             )}
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }








import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  Users,
  X,
  HeartPulse,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUserAuth } from '../context/UserAuthContext';

export default function Navbar({ onNavigate, currentPage }) {
  const [isOpen, setIsOpen] = useState(false);

  const { isAuthenticated: isAdmin, logout: adminLogout } = useAuth();
  const { isUserAuthenticated: isPatient, user, userLogout } =
    useUserAuth();

  const adminTarget = isAdmin ? 'admin' : 'admin-login';

  const navLinks = [
    { name: 'Home', id: 'home' },
    { name: 'About', id: 'about' },
    { name: 'Departments', id: 'departments' },
    { name: 'Doctors', id: 'doctors' },
    { name: 'Ambulance', id: 'ambulance' },
    { name: 'Blood Bank', id: 'blood-bank' },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Beds', id: 'beds' });
    navLinks.push({ name: 'Billing', id: 'billing' });
  }

  const handleNav = (page) => {
    onNavigate(page);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    if (isAdmin) await adminLogout();
    if (isPatient) await userLogout();

    handleNav('home');
  };

  return (
 <nav className="fixed top-0 inset-x-0 z-50 px-6 py-4 bg-yellow-200">
  <div className="mx-auto max-w-7xl flex items-center justify-between">

    {/* Logo */}
    <button
      onClick={() => handleNav('home')}
      className="flex items-center gap-3"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-600">
        <HeartPulse className="h-5 w-5 text-white" />
      </div>

      <div className="leading-tight text-left">
        <h1 className="text-xl font-bold text-slate-900">
          We<span className="text-cyan-600">Care</span>
        </h1>

        <p className="text-[11px] tracking-[0.2em] uppercase text-slate-400">
          Hospital
        </p>
      </div>
    </button>

    {/* Desktop Menu */}
    <div className="hidden lg:flex items-center gap-8">

      {navLinks.map((link) => {
        const isActive = currentPage === link.id;

        return (
          <button
            key={link.id}
            onClick={() => handleNav(link.id)}
            className={`text-[15px] font-medium transition-all duration-200 ${
              isActive
                ? 'text-cyan-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {link.name}
          </button>
        );
      })}

    </div>

    {/* Right Side */}
    <div className="hidden lg:flex items-center gap-3">

      <button
        onClick={() => handleNav('staff-portal')}
        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
      >
        Staff
      </button>

      <button
        onClick={() => handleNav(adminTarget)}
        className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
      >
        Admin
      </button>

      <button
        onClick={() => handleNav('appointment')}
        className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition"
      >
        Book Visit
      </button>

      {isPatient ? (

        <div className="flex items-center gap-2 ml-2">

          <button
            onClick={() => handleNav('user-panel')}
            className="flex items-center gap-2 text-sm font-medium text-slate-700"
          >
            <User className="h-4 w-4 text-cyan-600" />
            {user?.username || 'Patient'}
          </button>

          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-rose-500 transition"
          >
            <LogOut className="h-4 w-4" />
          </button>

        </div>

      ) : (

        <button
          onClick={() => handleNav('user-login')}
          className="text-sm font-medium text-slate-700 hover:text-slate-900 transition"
        >
          Login
        </button>

      )}

    </div>

    {/* Mobile Menu Button */}
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="lg:hidden text-slate-700"
    >
      {isOpen ? (
        <X className="h-6 w-6" />
      ) : (
        <Menu className="h-6 w-6" />
      )}
    </button>

  </div>

  {/* Mobile Menu */}
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        className="mt-4 rounded-3xl bg-white p-6 shadow-xl lg:hidden"
      >

        <div className="flex flex-col gap-5">

          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNav(link.id)}
              className="text-left text-slate-700 font-medium"
            >
              {link.name}
            </button>
          ))}

          <button
            onClick={() => handleNav('appointment')}
            className="mt-2 rounded-full bg-slate-900 py-3 text-sm font-semibold text-white"
          >
            Book Visit
          </button>

        </div>

      </motion.div>
    )}
  </AnimatePresence>
</nav>
  );
}