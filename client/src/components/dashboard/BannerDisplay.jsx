import { useEffect, useState } from 'react';
import { Megaphone, X, Clock, Award } from 'lucide-react';
import useAnnouncementStore from '../../store/announcementStore.js';

export default function BannerDisplay() {
  const { activeAnnouncement, fetchActiveAnnouncement } = useAnnouncementStore();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    fetchActiveAnnouncement();
  }, []);

  useEffect(() => {
    if (!activeAnnouncement) return;

    const timer = setInterval(() => {
      const now = new Date();
      const end = new Date(activeAnnouncement.endTime);
      const diff = end - now;

      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft('Expired');
        fetchActiveAnnouncement(); // Refresh to clear
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours > 0 ? hours + 'h ' : ''}${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAnnouncement]);

  if (!activeAnnouncement || timeLeft === 'Expired') return null;

  return (
    <div className="relative group overflow-hidden rounded-3xl mb-6 animate-in slide-in-from-top-4 duration-500 shadow-2xl shadow-primary-500/10">
      {/* Background with Image or Gradient */}
      <div className="absolute inset-0 z-0">
        {activeAnnouncement.bannerImage ? (
          <>
            <img 
              src={activeAnnouncement.bannerImage} 
              alt="Banner" 
              className="w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-110" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-950 via-primary-900/90 to-primary-800/40" />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-700 via-primary-600 to-indigo-600" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 py-8 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white shadow-xl animate-pulse">
            <Award className="w-8 h-8" />
          </div>
          <div className="max-w-xl">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
              <Megaphone className="w-3.5 h-3.5 text-primary-300" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary-200">System Announcement</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-2 uppercase tracking-tight">
              {activeAnnouncement.title}
            </h2>
            <p className="text-sm sm:text-base text-primary-100/90 font-medium leading-relaxed">
              {activeAnnouncement.message}
            </p>
          </div>
        </div>

        {/* Timer UI */}
        <div className="flex-shrink-0">
          <div className="bg-black/20 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl flex flex-col items-center min-w-[140px] shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-primary-400" />
              <span className="text-[10px] font-bold text-primary-300 uppercase tracking-wider">Ends In</span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-white font-mono tracking-tighter">
              {timeLeft}
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-primary-400/10 rounded-full blur-3xl" />
    </div>
  );
}
