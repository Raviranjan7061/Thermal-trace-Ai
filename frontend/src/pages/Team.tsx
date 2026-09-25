import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Linkedin, Github, Instagram, Mail } from 'lucide-react';

import image1 from '../assets/team/image1.jpeg';
import image2 from '../assets/team/image2.jpeg';
import image3 from '../assets/team/image3.jpeg';
import image4 from '../assets/team/image4.jpeg';
import image5 from '../assets/team/image5.jpeg';
import image6 from '../assets/team/image6.jpeg';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  linkedin: string;
  github: string;
  instagram?: string;
  email: string;
}

const teamMembers: TeamMember[] = [
  {
    id: '01',
    name: 'Ankit Kumar',
    role: 'Team Lead',
    photoUrl: image1,
    linkedin: 'https://www.linkedin.com/in/ankitkrsingh07/',
    github: 'https://github.com/Thunderdoc',
    instagram: 'https://www.instagram.com/kr_ankit_05/',
    email: 'ankitraj2163@gmail.com',
  },
  {
    id: '02',
    name: 'Narasimha Appikatla',
    role: 'Computer Vision Developer',
    photoUrl: image2,
    linkedin: 'https://www.linkedin.com/in/narasimha-appikatla-7a7b70327/',
    github: 'https://github.com/99240040193',
    instagram: 'https://www.instagram.com/_rich_kid_narasimha/',
    email: 'durganarasimhaappikatla@gmail.com',
  },
  {
    id: '03',
    name: 'Ravi Ranjan',
    role: 'Full Stack Developer',
    photoUrl: image3,
    linkedin: 'https://www.linkedin.com/in/ravi-ranjan-135172335/',
    github: 'https://github.com/Raviranjan7061',
    instagram: 'https://www.instagram.com/mrrr_ravi_/',
    email: 'raviranjan706187@gmail.com',
  },
  {
    id: '04',
    name: 'Anand S',
    role: 'AI / ML Developer',
    photoUrl: image4,
    linkedin: 'https://www.linkedin.com/in/anand57/',
    github: 'https://github.com/anand57577-lab/',
    instagram: 'https://www.instagram.com/anand_the_chaser_/',
    email: 'anand.57577@gmail.com',
  },
  {
    id: '05',
    name: 'Ammu Kumari',
    role: 'Backend Developer',
    photoUrl: image5,
    linkedin: 'https://www.linkedin.com/in/ammu-kumari-354040318/',
    github: 'https://github.com/ammu1348',
    instagram: 'https://www.instagram.com/ammu____2508/',
    email: 'ammukumari7359@gmail.com',
  },
  {
    id: '06',
    name: 'Nicepreet Kour',
    role: 'UI / UX Developer',
    photoUrl: image6,
    linkedin: 'https://www.linkedin.com/in/nicepreet-kour-7b2553378/',
    github: 'https://github.com/nicepreet3-creator',
    instagram: 'https://www.instagram.com/nicepreet_reen/',
    email: 'nicepreet3@gmail.com',
  },
];

export const TeamPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between p-5 sm:p-8 select-none custom-scrollbar overflow-y-auto font-sans transition-colors duration-200">
      {/* 1. TOP HEADER & BACK TO LOGIN */}
      <header className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4 max-w-7xl w-full mx-auto gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 font-extrabold text-sm shadow-lg shadow-cyan-500/10">
            TT
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">ThermalTrace AI</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 uppercase">
                SIH26162
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Satellite-Based Industrial Thermal Anomaly Intelligence Platform
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-800 hover:border-cyan-500/40 transition-all shadow-lg cursor-pointer group"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Login</span>
        </button>
      </header>

      {/* 2. MAIN SECTION — DIRECT VERIFIED PHOTO-BASED TEAM CARDS */}
      <main className="max-w-6xl w-full mx-auto my-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center justify-center gap-2">
            <span>Meet Our Team</span>
          </h1>
          <p className="text-xs text-slate-600 dark:text-slate-400 max-w-xl mx-auto font-medium">
            Engineering real-time satellite thermal intelligence for industrial compliance and safety.
          </p>
          <div className="w-16 h-0.5 bg-cyan-500 dark:bg-cyan-400 rounded-full mx-auto shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
        </div>

        {/* 3×2 PHOTO CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="group bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-6 text-center space-y-4 hover:border-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all duration-200"
            >
              {/* CIRCULAR MEMBER PHOTO */}
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 mx-auto">
                <img
                  src={member.photoUrl}
                  alt={member.name}
                  className="w-full h-full rounded-full object-cover border-2 border-cyan-500/80 dark:border-cyan-400/80 shadow-[0_0_20px_rgba(34,211,238,0.25)] group-hover:scale-105 group-hover:border-cyan-400 transition-all duration-200"
                />
                <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-cyan-400/30 pointer-events-none" />
              </div>

              {/* NAME & VERIFIED ROLE */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                  {member.name}
                </h3>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-tight">
                  {member.role}
                </p>
              </div>

              {/* SOCIAL BUTTONS */}
              <div className="flex items-center justify-center space-x-3 pt-2 border-t border-slate-200 dark:border-slate-800/60">
                {member.linkedin && (
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
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
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                    title="GitHub"
                  >
                    <Github className="w-3.5 h-3.5" />
                  </a>
                )}
                {member.instagram && (
                  <a
                    href={member.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                    title="Instagram"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                  </a>
                )}
                {member.email && (
                  <a
                    href={`mailto:${member.email}`}
                    className="p-2 rounded-lg bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:border-cyan-500/40 transition-colors"
                    title="Email"
                  >
                    <Mail className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 3. CLOSING SECTION */}
        <div className="bg-white dark:bg-[#0B101D] border border-slate-200 dark:border-slate-800/90 rounded-2xl p-5 text-center space-y-2 shadow-xl max-w-xl mx-auto">
          <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            ONE TEAM. <span className="text-cyan-600 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">ONE INTELLIGENT SOLUTION.</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Combining AI, engineering, research and creativity to solve real-world problems.
          </p>
          <div className="pt-1 flex items-center justify-center text-[10px] font-bold font-mono text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse mr-2" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </main>

      {/* 4. FOOTER */}
      <footer className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 dark:border-slate-800/80 pt-4 max-w-7xl w-full mx-auto text-xs text-slate-500 gap-2">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center space-x-1.5 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 font-semibold transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Login</span>
        </button>
        <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
          ThermalTrace AI • SIH26162
        </span>
      </footer>
    </div>
  );
};
