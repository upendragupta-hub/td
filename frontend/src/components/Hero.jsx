



import { motion } from 'motion/react';


import {
  ArrowRight,
  Bed,
  Calendar,
  Droplet,
   HeartPulse,
  Brain,
  Baby,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import Doctors from './Doctors';
import DepartmentCard from './DepartmentCard';
import BloodBankPreview from './BloodBankPreview';


export default function Hero({ onBook, bedStats }) {
  return (

    <>
    
    <section className="relative min-h-screen overflow-hidden px-4 pt-28 pb-16 sm:px-6 lg:px-8">

    
      {/* Background Video */}
{/* Background Video Container */}
<div className="absolute inset-0 overflow-hidden">
  <video
    autoPlay
    muted
    loop
    playsInline
    className="h-full w-full object-cover"
  >
    {/* Maine ek working direct MP4 link add kiya hai */}

    


    <source
      src="https://media.istockphoto.com/id/1445761877/video/administrator-with-medical-team.mp4?s=mp4-640x640-is&k=20&c=Fi6frmfziES9EYMr7wKGLn3ce12XzwljHHtI9E_JXtY="
      type="video/mp4"
    />
    Your browser does not support the video tag.
  </video>

  {/* Dark Overlay - Isse text readable rahega */}
  <div className="absolute inset-0 bg-slate-950/80" />

  {/* Gradient Glow for Cinematic Look */}
  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-blue-500/10" />
</div>
      {/* Main Content */}
      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-2">

          {/* LEFT CONTENT */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="space-y-8"
          >

            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-xl">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />

              <span className="text-sm font-medium text-slate-200">
                Trusted Modern Healthcare
              </span>
            </div>

            {/* Heading */}
            <div className="space-y-5">

              <h1 className="max-w-2xl text-4xl font-black leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Better Care.
                <span className="block text-cyan-300">
                  Faster Response.
                </span>
              </h1>

              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Emergency support, specialist consultations, ambulance
                coordination, and digital healthcare — all in one trusted
                platform designed for modern hospitals.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-4 sm:flex-row">

              <button
                onClick={onBook}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-500 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(6,182,212,0.35)] transition-all duration-300 hover:-translate-y-1 hover:bg-cyan-400"
              >
                <Calendar className="h-5 w-5" />

                Book Appointment

                <ArrowRight className="h-4 w-4" />
              </button>

              <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-7 py-3.5 text-sm font-medium text-white backdrop-blur-xl">
                <Sparkles className="h-5 w-5 text-yellow-400" />

                24/7 Guided Support
              </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 sm:grid-cols-3">

              {/* Specialists */}
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl shadow-lg">

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/20">
                  <Users className="h-5 w-5 text-cyan-300" />
                </div>

                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Specialists
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  200+
                </h3>
              </div>

              {/* Beds */}
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl shadow-lg">

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20">
                  <Bed className="h-5 w-5 text-emerald-300" />
                </div>

                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Beds Ready
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  {bedStats?.available || 0}
                </h3>
              </div>

              {/* Blood */}
              <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur-xl shadow-lg">

                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/20">
                  <Droplet className="h-5 w-5 text-rose-300" />
                </div>

                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Blood Units
                </p>

                <h3 className="mt-2 text-2xl font-bold text-white">
                  Live
                </h3>
              </div>
            </div>
          </motion.div>

          {/* RIGHT SIDE IMAGE */}

         {/* RIGHT SIDE IMAGE - Optimized for Video Visibility */}
<motion.div
  initial={{ opacity: 0, x: 50 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: 0.8, ease: "easeOut" }}
  className="relative hidden lg:block"
>
  {/* Glass Container with lower opacity */}
  <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-3 backdrop-blur-md shadow-2xl">
    
    {/* Image with Gradient Mask: Isse image niche aur side se video mein blend hogi */}
    <div className="relative">
      <img
        src="https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=1200&auto=format&fit=crop"
        alt="Hospital"
        className="h-[520px] w-full rounded-[24px] object-cover opacity-90 transition-opacity duration-500 hover:opacity-100"
        style={{
          maskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 80%, transparent 100%)'
        }}
      />
      
      {/* Floating Card - Positioned slightly differently */}
      <div className="absolute -bottom-2 -right-2 max-w-[280px] rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-2xl shadow-2xl">
        <div className="flex items-center gap-2">
           <div className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
           <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-300 font-bold">
             Live Status
           </p>
        </div>
        <h3 className="mt-2 text-xl font-bold text-white">
          4.9 Patient Rating
        </h3>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          Fast response within minutes via digital coordination.
        </p>
      </div>
    </div>
  </div>

  {/* Subtle Glow behind the image to pop it from the video */}
  <div className="absolute -inset-4 -z-10 bg-cyan-500/10 blur-3xl rounded-full" />
</motion.div>

        </div>
      </div>
    </section>

    <div>
      <Doctors/>
     
    </div>
    
    <div>
      <h1 className="text-4xl font-bold text-center mb-12"> Our Department</h1>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6 pb-20">



  <DepartmentCard
    title="Cardiology"
    description="Advanced heart care with modern diagnostics and emergency response."
    icon={HeartPulse}
    color="bg-red-500"
    onLearnMore={() => console.log("Cardiology")}
  />

  <DepartmentCard
    title="Neurology"
    description="Expert treatment for brain and nervous system disorders."
    icon={Brain}
    color="bg-blue-500"
    onLearnMore={() => console.log("Neurology")}
  />

  <DepartmentCard
    title="Pediatrics"
    description="Complete healthcare support for infants and children."
    icon={Baby}
    color="bg-pink-500"
    onLearnMore={() => console.log("Pediatrics")}
  />

    </div>


</div>

<div>
  <BloodBankPreview/>
 
</div>
    </>

    
  );
}