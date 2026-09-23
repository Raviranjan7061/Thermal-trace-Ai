import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Linkedin, Github, Mail, ShieldCheck } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  linkedin?: string;
  github?: string;
  email?: string;
}

const teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'Ravi Kumar',
    role: 'Team Lead & Full-Stack Systems Lead',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
  {
    id: '2',
    name: 'Ananya Sharma',
    role: 'Lead AI & Computer Vision Engineer',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
  {
    id: '3',
    name: 'Priya Patel',
    role: 'Geospatial & Data Pipeline Engineer',
    photoUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
  {
    id: '4',
    name: 'Aditya Verma',
    role: 'Cloud Infrastructure & Security Lead',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
  {
    id: '5',
    name: 'Sneha Reddy',
    role: 'Satellite Thermal Intelligence Analyst',
    photoUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
  {
    id: '6',
    name: 'Vikram Singh',
    role: 'Platform UI/UX & Regulatory Lead',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=400',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
];

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-5 sm:p-8 select-none custom-scrollbar overflow-y-auto font-sans">
      {/* 1. TOP HEADER & BACK TO LOGIN */}
      <header className="flex flex-wrap items-center justify-between border-b border-slate-800/80 pb-4 max-w-7xl w-full mx-auto gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-extrabold text-sm shadow-lg shadow-cyan-500/10">
            TT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-white text-lg tracking-tight">ThermalTrace AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase">
                SIH26162
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Satellite-Based Industrial Thermal Anomaly Intelligence Platform
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-800 hover:border-cyan-500/40 transition-all shadow-lg cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Login</span>
        </button>
      </header>

      {/* 2. MAIN SECTION — DIRECT PHOTO-BASED TEAM CARDS */}
      <main className="max-w-6xl w-full mx-auto my-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
            <span>Meet Our Team</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-xl mx-auto font-medium">
            Engineering real-time satellite thermal intelligence for industrial compliance and safety.
          </p>
          <div className="w-16 h-0.5 bg-cyan-400 rounded-full mx-auto shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </div>

        {/* 3×2 PHOTO CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="group bg-[#0B101D] border border-slate-800/90 rounded-2xl p-6 text-center space-y-4 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-200"
            >
              {/* LARGE CIRCULAR PHOTO */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover border-2 border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.25)] group-hover:scale-105 group-hover:border-cyan-400 transition-all duration-200"
                />
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-cyan-400/30 pointer-events-none" />
              </div>

              {/* NAME & ROLE */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-base sm:text-lg text-white group-hover:text-cyan-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider leading-tight">
                  {member.role}
                </p>
              </div>

              {/* SOCIAL BUTTONS */}
              {(member.linkedin || member.github || member.email) && (
                <div className="flex items-center justify-center space-x-3 pt-2 border-t border-slate-800/60">
                  {member.linkedin && (
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.github && (
                    <a
                      href={member.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                      title="GitHub"
                    >
                      <Github className="w-3.5 h-3.5" />
                    </a>
                  )}
                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                      title="Email"
                    >
                      <Mail className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 3. CLOSING SECTION */}
        <div className="bg-[#0B101D] border border-slate-800/90 rounded-2xl p-5 text-center space-y-2 shadow-xl max-w-xl mx-auto">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-200 uppercase tracking-wider">
            ONE TEAM. <span className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">ONE INTELLIGENT SOLUTION.</span>
          </h2>
          <p className="text-xs text-slate-400">
            Combining AI, engineering, research and creativity to solve real-world problems.
          </p>
          <div className="pt-1 flex items-center justify-center text-[10px] font-bold font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-800/80 pt-4 max-w-7xl w-full mx-auto text-xs text-slate-500 gap-2">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-1.5 text-slate-400 hover:text-amber-400 font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </button>
        <span className="font-mono text-[11px] text-slate-400">
          ThermalTrace AI • SIH26162
        </span>
      </footer>
    </div>
  );
};
