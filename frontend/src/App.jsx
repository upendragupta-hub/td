import React, { useState, useEffect } from 'react';
import { Activity, Baby, Brain, HeartPulse, ShieldPlus, Stethoscope } from 'lucide-react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Hero from './components/Hero';
import DepartmentCard from './components/DepartmentCard';
import DepartmentDetail from './components/DepartmentDetail';
import PrivacyPolicy from './components/PrivacyPolicy';
import AppointmentForm from './components/AppointmentForm';
import PublicBloodBank from './components/PublicBloodBank';
import AmbulanceManagement from './components/AmbulanceManagement';
import AdminDashboard from './components/AdminDashboard';
import LoginPage from './components/LoginPage'; // Admin login
import UserLogin from './components/UserLogin';
import UserDashboard from './components/UserDashboard';
import StaffPortal from './components/StaffPortal';
import PublicDoctorsGrid from './components/PublicDoctorsGrid';
import { useAuth } from './context/AuthContext';
import { useUserAuth } from './context/UserAuthContext';

const DEPARTMENTS = [
    {
        title: 'Cardiology',
        description: 'Heart rhythm checks, preventive screenings, and specialist treatment planning for cardiac conditions.',
        icon: HeartPulse,
        color: 'bg-gradient-to-br from-rose-500 to-pink-500',
    },
    {
        title: 'Neurology',
        description: 'Dedicated care for headaches, seizures, stroke recovery, and nervous system disorders.',
        icon: Brain,
        color: 'bg-gradient-to-br from-violet-500 to-indigo-500',
    },
    {
        title: 'Pediatrics',
        description: 'Compassionate child healthcare with family-friendly consultations and regular growth monitoring.',
        icon: Baby,
        color: 'bg-gradient-to-br from-amber-500 to-orange-500',
    },
    {
        title: 'Emergency Care',
        description: 'Rapid triage, trauma support, and coordinated emergency response available around the clock.',
        icon: ShieldPlus,
        color: 'bg-gradient-to-br from-red-500 to-orange-500',
    },
    {
        title: 'General Medicine',
        description: 'Everyday consultations, diagnostics, follow-ups, and primary care support for all age groups.',
        icon: Stethoscope,
        color: 'bg-gradient-to-br from-teal-600 to-cyan-600',
    },
    {
        title: 'Rehabilitation',
        description: 'Post-surgery recovery, mobility support, and long-term wellness planning for stronger outcomes.',
        icon: Activity,
        color: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    },
];

function App() {
    const [currentPage, setCurrentPage] = useState('home');
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [bedStats, setBedStats] = useState(null);
    const { isAuthenticated: isAdminAuthenticated } = useAuth();
    const { isUserAuthenticated } = useUserAuth();

    const handleNavigate = (page, data = null) => {
        setCurrentPage(page);
        if (page === 'departments' && data) {
            setSelectedDepartment(data);
        } else {
            setSelectedDepartment(null);
        }
        window.scrollTo(0, 0);
    };

    useEffect(() => {
        // Mock bed stats for now, replace with actual API call if needed
        setBedStats({ available: 50, occupied: 20 });
    }, []);

    const renderPage = () => {
        switch (currentPage) {
            case 'home':
                return <Hero onBook={() => handleNavigate('appointment')} bedStats={bedStats} />;
            case 'about':
                return (
                    <div className="container mx-auto px-6 py-24 min-h-screen pt-32">
                        <div className="glass p-8 md:p-12 rounded-3xl shadow-2xl border border-white/20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h2 className="text-4xl font-bold mb-6 text-slate-900">
                                About <span className="text-gradient">WeCare Hospitals</span>
                            </h2>
                            <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="space-y-6 text-slate-600 leading-relaxed">
                                    <p className="text-lg">
                                        Founded with a mission to provide world-class healthcare, WeCare Hospitals 
                                        is at the forefront of medical excellence. We combine advanced technology 
                                        with compassionate care to ensure the best outcomes for our patients.
                                    </p>
                                    <p>
                                        Our facility is equipped with state-of-the-art diagnostic and treatment tools, 
                                        and our team of specialists is dedicated to your health and well-being 24/7.
                                    </p>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="p-4 rounded-2xl bg-white/50 border border-slate-100 shadow-sm">
                                            <h4 className="font-bold text-cyan-700 text-2xl">24/7</h4>
                                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Emergency Support</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-white/50 border border-slate-100 shadow-sm">
                                            <h4 className="font-bold text-cyan-700 text-2xl">50+</h4>
                                            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Expert Doctors</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative group">
                                    <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-[2.5rem] blur-2xl transition duration-500 group-hover:opacity-100 opacity-50"></div>
                                    <img 
                                        src="https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&q=80&w=800" 
                                        alt="Modern Medical Facility" 
                                        className="relative rounded-[2rem] shadow-2xl ring-1 ring-white/20 object-cover w-full h-[400px]"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 'departments':
                return selectedDepartment ? (
                    <DepartmentDetail
                        department={selectedDepartment}
                        onBack={() => handleNavigate('departments')}
                        onBook={() => handleNavigate('appointment')}
                    />
                ) : (
                    <section className="px-4 pb-20 pt-32 sm:px-6 lg:px-8">
                        <div className="page-shell">
                            <div className="surface-panel-strong p-8 sm:p-10 lg:p-12">
                                <span className="eyebrow">Care Units</span>
                                <h2 className="mt-6 text-4xl font-extrabold text-slate-900 sm:text-5xl">
                                    Explore specialist departments built around faster care.
                                </h2>
                                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
                                    Each unit is supported by doctors, diagnostics, and digital coordination so patients can move from concern to clarity with less friction.
                                </p>

                                <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {DEPARTMENTS.map((department) => (
                                        <DepartmentCard
                                            key={department.title}
                                            {...department}
                                            onLearnMore={() => handleNavigate('departments', department)}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                );
            case 'doctors':
                return <PublicDoctorsGrid />;
            case 'ambulance':
                return <AmbulanceManagement mode="public" />;
            case 'blood-bank':
                return <PublicBloodBank />;
            case 'appointment':
                return <AppointmentForm />;
            case 'privacy':
                return <PrivacyPolicy />;
            case 'staff-portal':
                return <StaffPortal />;
            case 'admin':
                return isAdminAuthenticated
                    ? <AdminDashboard />
                    : <LoginPage onLoginSuccess={() => handleNavigate('admin')} />;
            case 'user-login':
                return isUserAuthenticated
                    ? <UserDashboard />
                    : <UserLogin onLoginSuccess={() => handleNavigate('user-panel')} onNavigate={handleNavigate} />;
            case 'user-panel':
                return isUserAuthenticated
                    ? <UserDashboard />
                    : <UserLogin onLoginSuccess={() => handleNavigate('user-panel')} onNavigate={handleNavigate} />;
            case 'admin-login':
                return isAdminAuthenticated
                    ? <AdminDashboard />
                    : <LoginPage onLoginSuccess={() => handleNavigate('admin')} />;
            default:
                return <Hero onBook={() => handleNavigate('appointment')} bedStats={bedStats} />;
        }
    };

    return (
        <div className="App">
            <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
            <main>{renderPage()}</main>
            <Footer onNavigate={handleNavigate} />
        </div>
    );
}

export default App;
