import React, { useState, useEffect, useRef } from 'react';
import { Hotel, Bed, Calendar, User as UserIcon, CreditCard, CheckCircle2, LayoutDashboard, Search, X, LogIn, LogOut, UserPlus, Mail, Lock, Loader2, Eye, EyeOff, Landmark, Smartphone, Sparkles, ArrowRight, QrCode, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface Room {
  room_id: string;
  room_number: string;
  type_name: string;
  base_price: number;
  status: string;
}

interface Stats {
  totalRooms: number;
  availableRooms: number;
}

// Custom Canvas Golden Particle System mimicking warm dust motes
function GoldenParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Array<any> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      x: number = 0;
      y: number = 0;
      vx: number = 0;
      vy: number = 0;
      radius: number = 0;
      baseAlpha: number = 0;
      alpha: number = 0;
      twinkleSpeed: number = 0;
      twinkleOffset: number = 0;

      constructor() {
        this.reset();
        // Distribute initially across the canvas area
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
      }

      reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.radius = Math.random() * 1.8 + 0.5; // delicate size
        this.vx = (Math.random() - 0.5) * 0.3; // extremely slow natural drift
        this.vy = (Math.random() - 0.5) * 0.3;
        this.baseAlpha = Math.random() * 0.45 + 0.15;
        this.alpha = this.baseAlpha;
        this.twinkleSpeed = Math.random() * 0.012 + 0.003;
        this.twinkleOffset = Math.random() * Math.PI * 2;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Twinkling light effect
        this.alpha = this.baseAlpha + Math.sin(Date.now() * this.twinkleSpeed + this.twinkleOffset) * 0.12;
        this.alpha = Math.max(0.05, Math.min(0.65, this.alpha));

        // Swirling and dispersion physical forces on mouse proximity
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const dx = this.x - mx;
        const dy = this.y - my;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const activeRadius = 160;

        if (distance < activeRadius) {
          const force = (activeRadius - distance) / activeRadius;
          const angle = Math.atan2(dy, dx);
          
          // Gentle radial push away from the cursor
          const pushX = Math.cos(angle) * force * 1.4;
          const pushY = Math.sin(angle) * force * 1.4;
          
          // Gentle swirling rotation force (perpendicular vector)
          const swirlX = -Math.sin(angle) * force * 0.9;
          const swirlY = Math.cos(angle) * force * 0.9;

          this.x += pushX + swirlX;
          this.y += pushY + swirlY;
        }

        // Handle boundaries seamlessly via screen-wrap
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      draw() {
        if (!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        
        // Beautiful glowing gold radial gradient
        const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius * 2);
        grad.addColorStop(0, `rgba(253, 250, 242, ${this.alpha})`); // light golden center
        grad.addColorStop(0.35, `rgba(229, 198, 129, ${this.alpha * 0.75})`); // warm amber champagne midtones
        grad.addColorStop(1, 'rgba(10, 18, 38, 0)'); // fade out
        
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }

    const initParticles = () => {
      const count = Math.floor((canvas.width * canvas.height) / 28000);
      particles = Array.from({ length: Math.min(90, Math.max(30, count)) }, () => new Particle());
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    resizeCanvas();
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 block"
    />
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', displayName: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [bookingData, setBookingData] = useState({
    guest_name: '',
    email: '',
    check_in: '',
    check_out: ''
  });
  const [isBooking, setIsBooking] = useState(false);
  const [isFreeing, setIsFreeing] = useState<string | null>(null);

  const [activeBookings, setActiveBookings] = useState<any[]>([]);
  const [timeLogs, setTimeLogs] = useState<Record<string, string>>({});
  const [paymentStep, setPaymentStep] = useState<'none' | 'method' | 'processing' | 'success'>('none');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [currentBookingId, setCurrentBookingId] = useState<string>('');
  const [currentGuestId, setCurrentGuestId] = useState<string>('');
  const autoCheckedOutRef = useRef<Set<string>>(new Set());
  const paymentTimeoutRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (paymentTimeoutRef.current) clearTimeout(paymentTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    if (user) return;
    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX / innerWidth) - 0.5;
      const y = (e.clientY / innerHeight) - 0.5;
      setParallax({ x, y });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [user]);

  const calculateNights = (checkIn: string, checkOut: string) => {
    if (!checkIn || !checkOut) return 1;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 1;
  };

  // Dynamic Billing Calculation Math & Logic
  const roomBasePrice = selectedRoom ? selectedRoom.base_price : 0;
  const nightsCount = selectedRoom ? calculateNights(bookingData.check_in, bookingData.check_out) : 1;
  const baseReservationPrice = roomBasePrice * nightsCount;

  // GST Calculation based on Indian tax slabs on Room Base Price:
  // - If Base Price is <= ₹1,000: GST is 0%
  // - If Base Price is ₹1,001 to ₹7,500: GST is 12%
  // - If Base Price is > ₹7,500: GST is 18%
  const gstPercentage = roomBasePrice <= 1000 ? 0 : roomBasePrice <= 7500 ? 12 : 18;
  const gstAmount = Math.round((baseReservationPrice * gstPercentage) / 100);
  const platformFee = 100;
  const totalAmount = baseReservationPrice + gstAmount + platformFee;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setActiveBookings([]);
    }
  }, [user]);

  useEffect(() => {
    if (!Array.isArray(activeBookings) || activeBookings.length === 0) {
      setTimeLogs({});
      return;
    }

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const newTimeLogs: Record<string, string> = {};

      activeBookings.forEach(booking => {
        const checkoutTime = new Date(booking.check_out).getTime();
        const distance = checkoutTime - now;

        if (distance <= 0) {
          newTimeLogs[booking.room_id] = '00:00:00';
          const room = rooms.find(r => r.room_id === booking.room_id);
          // Only trigger once
          if (!autoCheckedOutRef.current.has(booking.booking_id)) {
            autoCheckedOutRef.current.add(booking.booking_id);
            handleCheckout(booking.room_id, room ? room.room_number : '', booking.booking_id);
            alert(`Time is up for Room ${room ? room.room_number : ''}! Automatically checking out.`);
          }
        } else {
          const hours = Math.floor(distance / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          newTimeLogs[booking.room_id] = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });

      setTimeLogs(newTimeLogs);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeBookings, rooms, isFreeing]);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    setIsAuthLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Google Auth error:", error);
      setAuthError(error.message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsAuthLoading(true);

    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        // Create user profile in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          uid: userCredential.user.uid,
          email: authForm.email,
          displayName: authForm.displayName,
          role: 'guest',
          createdAt: new Date().toISOString()
        });
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      let message = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/invalid-credential') {
        message = "Invalid email or password. Please check your credentials.";
      } else if (error.code === 'auth/user-not-found') {
        message = "No account found with this email.";
      } else if (error.code === 'auth/wrong-password') {
        message = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/email-already-in-use') {
        message = "An account already exists with this email.";
      } else if (error.code === 'auth/weak-password') {
        message = "Password should be at least 6 characters.";
      } else if (error.code === 'auth/operation-not-allowed') {
        message = "Email/Password login is DISABLED in Firebase. You must enable it in the Firebase Console to create accounts.";
      } else if (error.message) {
        message = error.message;
      }
      setAuthError(message);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // Manually clear user state for demo mode or if signOut doesn't trigger onAuthStateChanged
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      // Still clear local state on error to allow user to try logging in again
      setUser(null);
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative min-h-screen w-full flex items-center overflow-hidden bg-[#030712] select-none">
        {/* Parallax Hotel Image Background (3D shifting opposite of mouse) - Brightened to show the resort clearly */}
        <div 
          className="absolute inset-0 w-[104%] h-[104%] top-[-2%] left-[-2%] bg-cover bg-center pointer-events-none z-0 brightness-[0.55] contrast-[1.05]"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2200&q=85')",
            transform: `translate3d(${parallax.x * -24}px, ${parallax.y * -24}px, 0) scale(1.06)`,
            transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
        
        {/* Extremely subtle radial overlay for high-end cinematic atmosphere without blocking the image */}
        <div className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(3,7,18,0)_0%,rgba(3,7,18,0.5)_100%)]" />

        {/* Ambient swirling golden particles */}
        <GoldenParticles />

        {/* Floating Top Header Navigation Bar */}
        <header className="absolute top-0 left-0 w-full z-30 px-8 py-6 md:px-16 md:py-8 flex justify-between items-center bg-gradient-to-b from-[#030712]/40 to-transparent">
          {/* Brand/Logo Left */}
          <div className="flex items-center gap-3">
            <div className="bg-gold-500/15 p-2 rounded-xl border border-gold-500/20 shadow-lg shadow-black/40 backdrop-blur-md">
              <Hotel className="text-gold-300 w-5 h-5" />
            </div>
            <span className="font-serif text-xl tracking-[0.22em] text-gold-gradient font-semibold text-shadow-subtle">
              ATHITHI
            </span>
          </div>

          {/* Premium Gold Outlined Sign In Button Right (visible only on landing state) */}
          {showLanding && (
            <button
              onClick={() => setShowLanding(false)}
              className="px-6 py-2.5 rounded-full border border-gold-500/40 text-gold-200 text-xs font-sans font-bold uppercase tracking-[0.15em] hover:border-gold-500 hover:text-gold-100 hover:bg-gold-500/10 hover:shadow-lg hover:shadow-gold-500/20 transition-all duration-300 cursor-pointer backdrop-blur-md"
            >
              Sign In
            </button>
          )}
        </header>

        {/* Main Content Area - Full layout wrapper */}
        <div className="relative z-20 w-full h-full min-h-screen flex items-center justify-start max-w-7xl mx-auto px-6 md:px-16 py-24 font-sans">
          <AnimatePresence mode="wait">
            {showLanding ? (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl text-left flex flex-col items-start"
              >
                {/* Upper Premium Badge Tag */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-gold-500/15 border border-gold-500/20 rounded-full mb-6 backdrop-blur-md shadow-lg shadow-black/30">
                  <Sparkles className="w-3.5 h-3.5 text-gold-300 animate-pulse" />
                  <span className="text-[10px] font-bold text-gold-200 uppercase tracking-[0.2em]">
                    Elite Hospitality Ecosystem
                  </span>
                </div>

                {/* Main Majestic Title */}
                <h1 className="text-6xl md:text-8xl font-serif text-gold-gradient tracking-[0.1em] font-light leading-none mb-4 text-shadow-premium">
                  ATHITHI
                </h1>
                
                {/* Secondary Tagline */}
                <h2 className="text-base md:text-lg font-sans text-gold-200 uppercase tracking-[0.25em] font-semibold mb-6 text-shadow-subtle">
                  Redefining Hospitality Management
                </h2>

                {/* Description */}
                <p className="text-slate-100 text-sm md:text-base leading-relaxed max-w-lg mb-10 font-sans font-light text-shadow-subtle">
                  Step into a realm of effortless control, curated luxury, and refined operations. Crafted exclusively for elite hospitality establishments to streamline guest lifecycles and suite allocations.
                </p>

                {/* Horizontal row of premium features (directly embedded, elegant, translucent) */}
                <div className="flex flex-wrap gap-4 mb-12">
                  <div className="flex items-center gap-2.5 px-4.5 py-3 bg-slate-950/40 border border-gold-500/15 rounded-2xl backdrop-blur-md shadow-lg shadow-black/20">
                    <Bed className="w-4 h-4 text-gold-300" />
                    <span className="text-[10px] font-bold text-gold-100 uppercase tracking-[0.15em] text-shadow-subtle">Luxe Suites</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4.5 py-3 bg-slate-950/40 border border-gold-500/15 rounded-2xl backdrop-blur-md shadow-lg shadow-black/20">
                    <Calendar className="w-4 h-4 text-gold-300" />
                    <span className="text-[10px] font-bold text-gold-100 uppercase tracking-[0.15em] text-shadow-subtle">Dynamic Stay</span>
                  </div>
                  <div className="flex items-center gap-2.5 px-4.5 py-3 bg-slate-950/40 border border-gold-500/15 rounded-2xl backdrop-blur-md shadow-lg shadow-black/20">
                    <ShieldCheck className="w-4 h-4 text-gold-300" />
                    <span className="text-[10px] font-bold text-gold-100 uppercase tracking-[0.15em] text-shadow-subtle">Oracle Secure</span>
                  </div>
                </div>

              </motion.div>
            ) : (
              <div className="w-full h-full flex items-center justify-end">
                {/* Right-aligned glassmorphic auth panel - keeps image 100% visible on left/center */}
                <motion.div
                  key="auth"
                  initial={{ opacity: 0, x: 50, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-md luxury-glass rounded-[40px] p-10 border border-gold-500/20 relative overflow-hidden shadow-2xl shadow-black/90 mr-0"
                >
                  {/* Back to Home Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setAuthError(null);
                      setShowLanding(true);
                    }}
                    className="absolute top-6 left-6 text-gold-300/60 hover:text-gold-300 transition-colors flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest cursor-pointer z-10"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>Home</span>
                  </button>

                  {/* Form Header */}
                  <div className="flex flex-col items-center mb-8 mt-4">
                    <h2 className="text-3xl font-serif tracking-[0.1em] text-gold-gradient font-medium text-center">
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </h2>
                    <div className="h-[1px] w-12 bg-gold-500/25 mt-3" />
                  </div>

                  <form onSubmit={handleAuth} className="space-y-5">
                    {authMode === 'signup' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="block text-[10px] font-bold text-gold-300 uppercase tracking-widest">Full Name</label>
                        <div className="relative">
                          <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/60 w-4 h-4" />
                          <input
                            required
                            type="text"
                            value={authForm.displayName}
                            onChange={(e) => setAuthForm({ ...authForm, displayName: e.target.value })}
                            className="w-full pl-12 pr-4 py-4 bg-slate-950/45 border border-gold-500/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-sans text-sm"
                            placeholder="John Doe"
                          />
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gold-300 uppercase tracking-widest">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/60 w-4 h-4" />
                        <input
                          required
                          type="email"
                          value={authForm.email}
                          onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                          className="w-full pl-12 pr-4 py-4 bg-slate-950/45 border border-gold-500/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-sans text-sm"
                          placeholder="guest@example.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-gold-300 uppercase tracking-widest">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-500/60 w-4 h-4" />
                        <input
                          required
                          type={showPassword ? "text" : "password"}
                          value={authForm.password}
                          onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                          className="w-full pl-12 pr-12 py-4 bg-slate-950/45 border border-gold-500/15 rounded-2xl focus:outline-none focus:ring-2 focus:ring-gold-500/40 focus:border-gold-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-sans text-sm"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-500/40 hover:text-gold-300 transition-colors cursor-pointer"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {authError && (
                      <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl">
                        <p className="text-rose-400 text-xs font-bold text-center leading-relaxed">{authError}</p>
                        {authError.includes('DISABLED') && (
                          <a
                            href="https://console.firebase.google.com/project/gen-lang-client-0498174837/authentication/providers"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-2 text-[9px] text-center text-gold-400 font-black uppercase tracking-widest hover:text-gold-200 underline underline-offset-4"
                          >
                            Enable it here (1 Click)
                          </a>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-4 bg-gold-gradient-pulse text-[#151005] rounded-2xl font-sans font-bold uppercase tracking-widest text-xs shadow-xl transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
                    >
                      {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (authMode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                      {authMode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>

                    <div className="relative py-3">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gold-500/10"></div>
                      </div>
                      <div className="relative flex justify-center text-[9px] uppercase font-bold tracking-widest">
                        <span className="bg-[#0b1226]/80 px-4 text-gold-300/40">Or continue with</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={isAuthLoading}
                      className="w-full py-4 bg-slate-950/40 border border-gold-500/15 text-gold-100 rounded-2xl font-bold uppercase tracking-widest text-xs shadow-xl hover:bg-gold-500/10 hover:border-gold-500/40 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 cursor-pointer"
                    >
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.14-4.53z" />
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      </svg>
                      Google
                    </button>

                    <button
                      type="button"
                      onClick={() => setUser({ email: 'demo@example.com', uid: 'demo-user' } as any)}
                      className="w-full py-3 border border-dashed border-gold-500/20 text-gold-300/40 rounded-2xl font-bold uppercase tracking-widest text-[9px] hover:border-gold-500/50 hover:text-gold-300 transition-all mt-4 cursor-pointer"
                    >
                      Bypass Login (Demo Mode)
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                      className="text-gold-300 hover:text-gold-100 text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                    >
                      {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      const [roomsRes, statsRes] = await Promise.all([
        fetch('http://localhost:8080/api/hotel/rooms'),
        fetch('http://localhost:8080/api/hotel/stats')
      ]);

      if (!roomsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data from Oracle/Spring Boot');
      }

      const roomsDataRaw = await roomsRes.json();
      const statsData = await statsRes.json();

      // Normalize camelCase Oracle schema to match snake_case local state seamlessly
      const roomsData = Array.isArray(roomsDataRaw) ? roomsDataRaw.map((r: any) => {
        const rawStatus = (r.status || '').trim().toLowerCase();
        return {
          room_id: r.roomId || r.room_id,
          room_number: r.roomNumber || r.room_number,
          type_name: r.typeName || r.type_name,
          base_price: r.basePrice || r.base_price,
          status: (rawStatus === 'occupied' || rawStatus === 'booked') ? 'Occupied' : 'Available'
        };
      }) : [];

      setRooms(roomsData);
      
      // Map direct Oracle statistics
      setStats({
        totalRooms: statsData.totalRooms || 5,
        availableRooms: statsData.availableRooms || 5
      });

      if (user?.email) {
        const bookingRes = await fetch(`http://localhost:8080/api/hotel/bookings/active`);
        if (bookingRes.ok) {
          const bookingsDataRaw = await bookingRes.json();
          const bookingsData = Array.isArray(bookingsDataRaw) ? bookingsDataRaw.map((b: any) => ({
            booking_id: b.bookingId || b.booking_id,
            room_id: b.roomId || b.room_id, // in Oracle, roomId is the room number (e.g. 101), which aligns with normalized room_id
            guest_id: b.guestId || b.guest_id,
            check_in: b.checkIn || b.check_in,
            check_out: b.checkOut || b.check_out,
            status: b.status || b.status
          })) : [];
          setActiveBookings(bookingsData);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleExtendStay = async (booking: any) => {
    if (!booking) return;
    try {
      const res = await fetch(`http://localhost:8080/api/hotel/bookings/extend?bookingId=${booking.booking_id}`, { method: 'PUT' });
      if (res.ok) {
        fetchData();
        alert('Stay extended by 24 hours!');
      } else {
        const errText = await res.text();
        alert(`Failed to extend stay: ${errText}`);
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom) return;

    if (paymentStep === 'none') {
      // Step 1: Validate input details and prepare booking IDs
      const bookingId = `B${Date.now().toString().slice(-8)}`;
      const guestId = `G${Date.now().toString().slice(-8)}`;
      setCurrentBookingId(bookingId);
      setCurrentGuestId(guestId);
      setPaymentStep('method');
    }
  };

  const handleProceedToPay = () => {
    setPaymentStep('processing');
    // Simulate real gateway processing, auto-advance to success in 3s
    paymentTimeoutRef.current = setTimeout(() => {
      triggerSuccessfulPayment();
    }, 3000);
  };

  const handleDemoBypass = () => {
    if (paymentTimeoutRef.current) {
      clearTimeout(paymentTimeoutRef.current);
    }
    triggerSuccessfulPayment();
  };

  const triggerSuccessfulPayment = async () => {
    setPaymentStep('success');
    await executeBookingCreation();
  };

  const executeBookingCreation = async () => {
    if (!selectedRoom) return;
    setIsBooking(true);

    const bookingId = currentBookingId || `B${Date.now().toString().slice(-8)}`;
    const guestId = currentGuestId || `G${Date.now().toString().slice(-8)}`;
    const [firstName, ...lastNameParts] = bookingData.guest_name.split(' ');
    const lastName = lastNameParts.join(' ') || 'Guest';

    try {
      // 1. Submit Booking & Guest first to Spring Boot / Oracle (guarantees parent row exists first)
      const springRes = await fetch('http://localhost:8080/api/hotel/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking: {
            bookingId: bookingId,
            roomId: selectedRoom.room_number,
            guestId: guestId,
            checkIn: new Date(bookingData.check_in).toISOString(),
            checkOut: new Date(bookingData.check_out).toISOString(),
            status: 'Confirmed'
          },
          guest: {
            guestId: guestId,
            firstName: firstName,
            lastName: lastName,
            email: bookingData.email,
            phoneNumber: `999-${Date.now().toString().slice(-6)}`,
            idProofNumber: `ID-${guestId}`
          }
        })
      });

      if (springRes.ok) {
        // 2. Booking successfully created in Oracle. Now submit the payment record!
        try {
          const payRes = await fetch('http://localhost:8080/api/hotel/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              paymentId: `P${Date.now().toString().slice(-8)}`,
              bookingId: bookingId,
              paymentDate: new Date().toISOString().split('T')[0],
              paymentMethod: selectedPaymentMethod || 'Bypass',
              amountPaid: totalAmount
            })
          });
          if (!payRes.ok) {
            console.error("Failed to save payment record:", await payRes.text());
          }
        } catch (payErr) {
          console.error("Payment submission failed:", payErr);
        }

        console.log("Successfully booked and synced with Oracle DB");
        fetchData();
      } else {
        const errorMsg = await springRes.text();
        alert(`Booking failed: ${errorMsg}\n\nHint: If you see "ORA-00001", it means a unique ID or Email already exists.`);
        setPaymentStep('none');
      }
    } catch (error) {
      console.error("Failed to sync with Spring Boot backend:", error);
      alert('Booking failed. Could not connect to Spring Boot. Is it running on port 8080?');
      setPaymentStep('none');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCheckout = async (roomId: string, roomNumber: string, autoBookingId?: string) => {
    const bookingId = autoBookingId || window.prompt("DBMS Demo: Please enter the Booking ID to complete the checkout lifecycle:", "B12345678");
    if (!bookingId) return;

    setIsFreeing(roomId);
    try {
      // 1. Call Spring Boot Backend (Oracle DB) - Uses roomNumber
      const res = await fetch(`http://localhost:8080/api/hotel/checkout?bookingId=${bookingId}&roomId=${roomNumber}`, {
        method: 'PUT'
      });

      if (res.ok) {
        alert(`Successfully checked out booking: ${bookingId}`);
        fetchData();
      } else {
        const errText = await res.text();
        alert(`Backend checkout failed: ${errText}`);
      }
    } catch (error) {
      console.error(error);
      alert("Error connecting to Spring Boot backend.");
    } finally {
      setIsFreeing(null);
    }
  };

  const getRoomStyle = (typeName: string) => {
    switch (typeName) {
      case 'Suite':
        return {
          border: 'border-amber-500/30',
          badge: 'bg-amber-500 text-white',
          label: 'Luxury Suite',
          accent: 'text-amber-500',
          subtext: 'Premium'
        };
      case 'Deluxe':
        return {
          border: 'border-indigo-500/30',
          badge: 'bg-indigo-500 text-white',
          label: 'Premium Deluxe',
          accent: 'text-indigo-500',
          subtext: 'Superior'
        };
      default:
        return {
          border: 'border-slate-700',
          badge: 'bg-slate-600 text-white',
          label: 'Standard Room',
          accent: 'text-slate-400',
          subtext: 'Classic'
        };
    }
  };

  const getRoomImage = (typeName: string, roomId: string) => {
    const hash = Array.from(roomId).reduce((acc, char) => acc + char.charCodeAt(0), 0);

    // Use guaranteed, high-quality local images matching the room tier
    if (typeName === 'Suite') {
      const imgIndex = (hash % 3) + 1; // 1, 2, or 3
      return `/images/ste_${imgIndex}.png`;
    }
    if (typeName === 'Deluxe') {
      const imgIndex = (hash % 3) + 1;
      return `/images/dlx_${imgIndex}.png`;
    }

    // Standard rooms
    const imgIndex = (hash % 3) + 1;
    return `/images/std_${imgIndex}.png`;
  };

  const roomsByType = rooms.reduce((acc, room) => {
    if (!acc[room.type_name]) acc[room.type_name] = [];
    acc[room.type_name].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 font-sans selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="bg-[#1E293B]/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
            <Hotel className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Atithi</h1>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Management System</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs font-bold text-white">{user.email}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Logged In</span>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl transition-all group"
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8">
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16"
          >
            <div className="bg-[#1E293B] p-8 rounded-[32px] border border-slate-800 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                  <Bed className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Inventory</span>
              </div>
              <div className="text-4xl font-bold tracking-tight">{stats.totalRooms} <span className="text-lg text-slate-500 font-medium">Rooms</span></div>
            </div>
            <div className="bg-[#1E293B] p-8 rounded-[32px] border border-slate-800 shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Availability</span>
              </div>
              <div className="text-4xl font-bold text-emerald-400 tracking-tight">{stats.availableRooms} <span className="text-lg text-slate-500 font-medium">Free</span></div>
            </div>
          </motion.div>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h2 className="text-4xl font-black mb-3 tracking-tight">Welcome to Atithi</h2>
            <p className="text-slate-400 max-w-xl text-lg">Where guests are treated with warmth and comfort.</p>
          </div>
          <div className="relative w-full md:w-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search room..."
              className="w-full md:w-72 pl-12 pr-6 py-4 bg-[#1E293B] border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200 placeholder:text-slate-600 shadow-inner"
            />
          </div>
        </div>

        <div className="flex flex-col gap-16">
          {Object.entries(roomsByType).map(([typeName, typeRooms]) => (
            <div key={typeName}>
              <h3 className="text-3xl font-black mb-8 tracking-tight text-white border-b border-slate-800 pb-4">
                {typeName} Rooms
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <AnimatePresence mode="popLayout">
                  {(typeRooms as Room[]).map((room) => {
                    const style = getRoomStyle(room.type_name);
                    const bookedRoomInfo = Array.isArray(activeBookings) ? activeBookings.find(b => b.room_id === room.room_id) : null;
                    const isMyBooking = !!bookedRoomInfo;
                    return (
                      <motion.div
                        layout
                        key={room.room_id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`group relative bg-[#1E293B] rounded-[40px] border ${style.border} overflow-hidden shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500`}
                      >
                        <div className="relative h-64 overflow-hidden">
                          <img
                            src={getRoomImage(room.type_name, room.room_id)}
                            alt={`${room.type_name} Room`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1E293B] via-transparent to-transparent opacity-60" />
                          <div className="absolute top-6 left-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${style.badge}`}>
                              {style.label}
                            </span>
                          </div>
                          <div className="absolute top-6 right-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg ${room.status === 'Available' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                              {room.status}
                            </span>
                          </div>
                        </div>

                        <div className="p-8">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-2xl font-bold mb-1 tracking-tight">Room {room.room_number}</h3>
                              <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-widest ${style.accent}`}>
                                <LayoutDashboard className="w-3 h-3" />
                                {room.type_name} {style.subtext}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-black text-white">₹{(room.base_price || 0).toLocaleString()}</div>
                              <div className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Nightly Rate</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-8">
                            <div className="flex flex-col items-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
                              <Bed className="w-4 h-4 text-slate-500 mb-1" />
                              <span className="text-[10px] font-bold text-slate-400">King Bed</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
                              <Calendar className="w-4 h-4 text-slate-500 mb-1" />
                              <span className="text-[10px] font-bold text-slate-400">WiFi 6</span>
                            </div>
                            <div className="flex flex-col items-center p-3 bg-slate-900/50 rounded-2xl border border-slate-800">
                              <CreditCard className="w-4 h-4 text-slate-500 mb-1" />
                              <span className="text-[10px] font-bold text-slate-400">Mini Bar</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3">
                            <button
                              disabled={room.status !== 'Available'}
                              onClick={() => {
                                setBookingData(prev => ({ ...prev, email: user?.email || '' }));
                                setSelectedRoom(room);
                              }}
                              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all duration-300 ${room.status === 'Available'
                                ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 active:scale-95'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                }`}
                            >
                              {room.status === 'Available' ? 'Reserve Now' : 'Booked'}
                            </button>

                            {room.status !== 'Available' && !isMyBooking && (
                              <button
                                disabled={isFreeing === room.room_id}
                                onClick={() => handleCheckout(room.room_id, room.room_number)}
                                className="w-full py-3 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-500 hover:text-white transition-all duration-300 active:scale-95 disabled:opacity-50 mt-2"
                              >
                                {isFreeing === room.room_id ? 'Processing...' : 'Checkout Guest'}
                              </button>
                            )}

                            {isMyBooking && (
                              <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-center">
                                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Time until Checkout</span>
                                <div className="text-3xl font-black text-white tracking-tighter tabular-nums mb-3">{timeLogs[room.room_id] || 'Loading...'}</div>
                                <button
                                  onClick={() => handleExtendStay(bookedRoomInfo)}
                                  className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-95"
                                >
                                  Extend Stay (+24h)
                                </button>
                                <button
                                  onClick={() => handleCheckout(room.room_id, room.room_number, bookedRoomInfo.booking_id)}
                                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all active:scale-95 mt-2"
                                >
                                  Checkout Now
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedRoom && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (paymentStep !== 'processing' && paymentStep !== 'success') {
                  setSelectedRoom(null);
                }
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative bg-[#1E293B] w-full rounded-[48px] p-10 border border-slate-800 shadow-2xl shadow-black transition-all duration-500 ${
                paymentStep === 'method' ? 'max-w-4xl' : 'max-w-md'
              }`}
            >
              {paymentStep === 'success' ? (
                /* 4. Payment Successful IMMERSIVE Screen */
                <div className="pt-4 pb-2 text-center flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 mb-6 shadow-lg shadow-emerald-500/20"
                  >
                    <CheckCircle2 className="w-10 h-10 animate-pulse" />
                  </motion.div>

                  <h3 className="text-3xl font-black text-white tracking-tight mb-2">Booking Confirmed!</h3>
                  <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
                    Your luxury stay is successfully locked in. A confirmation receipt has been synced with our database.
                  </p>

                  <div className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-6 text-left space-y-4 mb-8">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Booking Ref</span>
                      <span className="text-sm font-mono font-bold text-indigo-400">{currentBookingId}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Room Details</span>
                      <span className="text-sm font-bold text-white">Room {selectedRoom.room_number} ({selectedRoom.type_name})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Check-In</span>
                      <span className="text-sm font-bold text-white">
                        {bookingData.check_in ? new Date(bookingData.check_in).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Total Paid</span>
                      <span className="text-sm font-black text-emerald-400">₹{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Method</span>
                      <span className="text-sm font-bold text-slate-300">{selectedPaymentMethod || 'Bypass'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRoom(null);
                      setPaymentStep('none');
                      setBookingData({ guest_name: '', email: '', check_in: '', check_out: '' });
                      setSelectedPaymentMethod('');
                      setCurrentBookingId('');
                      setCurrentGuestId('');
                    }}
                    className="w-full py-4.5 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                        <Bed className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Book Room {selectedRoom.room_number}</h3>
                        <p className="text-slate-400 text-xs uppercase font-bold tracking-widest">
                          {selectedRoom.type_name} {getRoomStyle(selectedRoom.type_name).subtext}
                        </p>
                      </div>
                    </div>
                    {paymentStep !== 'processing' && (
                      <button
                        onClick={() => setSelectedRoom(null)}
                        className="p-2 hover:bg-slate-800 rounded-xl transition-colors"
                      >
                        <X className="w-6 h-6 text-slate-500" />
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleBooking} className="space-y-6">
                    {/* 1. Guest Details Screen */}
                    {paymentStep === 'none' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Guest Name</label>
                          <div className="relative">
                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                            <input
                              required
                              type="text"
                              value={bookingData.guest_name}
                              onChange={(e) => setBookingData({ ...bookingData, guest_name: e.target.value })}
                              className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                              placeholder="Enter your full name"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                          <input
                            required
                            type="email"
                            value={bookingData.email}
                            onChange={(e) => setBookingData({ ...bookingData, email: e.target.value })}
                            className="w-full px-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                            placeholder="guest@example.com"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Check-in</label>
                            <input
                              required
                              type="datetime-local"
                              value={bookingData.check_in}
                              onChange={(e) => {
                                const newCheckIn = e.target.value;
                                const checkInDate = new Date(newCheckIn);
                                checkInDate.setHours(checkInDate.getHours() + 24);
                                const checkOutStr = checkInDate.toISOString().slice(0, 16);
                                setBookingData({ ...bookingData, check_in: newCheckIn, check_out: checkOutStr });
                              }}
                              className="w-full px-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Check-out (Fixed: 24 Hours)</label>
                            <input
                              required
                              type="datetime-local"
                              value={bookingData.check_out}
                              onChange={(e) => setBookingData({ ...bookingData, check_out: e.target.value })}
                              className="w-full px-4 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-slate-200"
                            />
                          </div>
                        </div>

                        <div className="pt-4">
                          <div className="flex justify-between items-center mb-6 p-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                            <div className="flex flex-col">
                              <span className="text-slate-400 font-bold">Estimated Grand Total</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                {nightsCount} Night(s) × ₹{roomBasePrice.toLocaleString()} + Tax & Fees
                              </span>
                            </div>
                            <span className="text-2xl font-black text-white">₹{totalAmount.toLocaleString()}</span>
                          </div>
                          <button
                            type="submit"
                            className="w-full py-5 bg-indigo-500 text-white rounded-[24px] font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95"
                          >
                            Continue
                          </button>
                        </div>
                      </>
                    )}

                    {/* 2. Split Screen Payment & Itemized Billing Screen */}
                    {paymentStep === 'method' && (
                      <div className="pt-2 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {/* Left Side: Payment Methods */}
                          <div className="space-y-4">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-indigo-500" /> Select Payment Method
                            </h4>
                            
                            <div className="space-y-3">
                              {[
                                { id: 'UPI', label: 'UPI / Instant Pay', icon: Smartphone, desc: 'Google Pay, PhonePe, Paytm' },
                                { id: 'Net Banking', label: 'Net Banking', icon: Landmark, desc: 'Secure direct bank transfer' },
                                { id: 'Credit Card', label: 'Credit/Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, RuPay' }
                              ].map((method) => {
                                const IconComp = method.icon;
                                const isSelected = selectedPaymentMethod === method.id;
                                return (
                                  <button
                                    key={method.id}
                                    type="button"
                                    onClick={() => setSelectedPaymentMethod(method.id)}
                                    className={`w-full p-4 rounded-3xl border text-left flex items-start gap-4 transition-all ${
                                      isSelected
                                        ? 'bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/5'
                                        : 'bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-300'
                                    }`}
                                  >
                                    <div className={`p-3 rounded-2xl ${
                                      isSelected ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-800 text-slate-400'
                                    }`}>
                                      <IconComp className="w-5 h-5" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <span className="font-bold text-sm text-white block">{method.label}</span>
                                      <span className="text-[11px] text-slate-500 font-medium">{method.desc}</span>
                                    </div>
                                    <div className="self-center">
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                        isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-slate-700'
                                      }`}>
                                        {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Right Side: Bill Breakdown (Itemized Receipt) */}
                          <div className="bg-slate-900/60 rounded-[32px] border border-slate-800 p-6 flex flex-col justify-between relative overflow-hidden">
                            {/* Decorative background glow */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

                            <div>
                              <div className="border-b border-dashed border-slate-800/80 pb-4 mb-4">
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Booking Invoice</span>
                                <h4 className="text-white font-bold text-base">Atithi Premium Stays</h4>
                                <span className="text-[10px] text-slate-500 font-mono block mt-1 uppercase tracking-wider">Ref: {currentBookingId}</span>
                              </div>

                              <div className="space-y-4 mb-6">
                                {/* Base Reservation Price */}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-bold text-slate-300 block">Base Room Price</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Room {selectedRoom.room_number} × {nightsCount} Night(s)
                                    </span>
                                  </div>
                                  <span className="font-bold text-sm text-white">₹{baseReservationPrice.toLocaleString()}</span>
                                </div>

                                {/* GST Slabs Calculation */}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-bold text-slate-300 block">
                                      GST ({gstPercentage}%)
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                                      {roomBasePrice <= 1000 ? 'Slab: <= ₹1k (0%)' : roomBasePrice <= 7500 ? 'Slab: ₹1k - ₹7.5k (12%)' : 'Slab: > ₹7.5k (18%)'}
                                    </span>
                                  </div>
                                  <span className="font-bold text-sm text-white">₹{gstAmount.toLocaleString()}</span>
                                </div>

                                {/* Platform Fee */}
                                <div className="flex justify-between items-start">
                                  <div>
                                    <span className="text-xs font-bold text-slate-300 block">Platform Fee</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                      Flat Service Charge
                                    </span>
                                  </div>
                                  <span className="font-bold text-sm text-white">₹{platformFee.toLocaleString()}</span>
                                </div>
                              </div>

                              {/* Divider */}
                              <div className="border-t border-dashed border-slate-800/80 pt-4 mb-6">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <span className="text-sm font-black text-white uppercase tracking-wider block">Grand Total</span>
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">All taxes & fees included</span>
                                  </div>
                                  <span className="text-2xl font-black text-indigo-400">₹{totalAmount.toLocaleString()}</span>
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={!selectedPaymentMethod}
                              onClick={handleProceedToPay}
                              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 mt-2"
                            >
                              {selectedPaymentMethod ? `Proceed to Pay: ₹${totalAmount.toLocaleString()}` : 'Select a Method to Pay'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 3. Payment Processing Page */}
                    {paymentStep === 'processing' && (
                      <div className="pt-8 pb-4 text-center flex flex-col items-center">
                        <div className="relative mb-6 flex items-center justify-center">
                          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                          <div className="absolute text-indigo-400 text-xs font-mono font-bold">3s</div>
                        </div>
                        
                        <h4 className="text-white font-bold text-xl mb-2">Processing Payment...</h4>
                        <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
                          Waiting for secure gateway response. Please do not close or refresh this window.
                        </p>

                        <div className="w-full py-3 bg-slate-900/40 border border-slate-800 rounded-2xl flex items-center justify-center gap-2 mb-8 text-xs text-indigo-400 font-bold uppercase tracking-wider">
                          <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" /> Secure 256-Bit SSL Encryption
                        </div>

                        <button
                          type="button"
                          onClick={handleDemoBypass}
                          className="text-xs font-bold text-slate-500 hover:text-indigo-400 uppercase tracking-widest underline underline-offset-4 transition-colors"
                        >
                          Demo Bypass: Force Success
                        </button>
                      </div>
                    )}
                  </form>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
