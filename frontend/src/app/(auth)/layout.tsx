export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[#111223]">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden flex-col">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#161829] via-[#0f172a] to-[#0d0f20]" />

        {/* Animated grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Blue glow accents */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-indigo-600/8 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">GymTrack</span>
          </div>

          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="mb-6">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/10 border border-blue-600/20 text-blue-400 text-xs font-semibold uppercase tracking-widest mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                AI Performance Platform
              </span>
            </div>
            <h1 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] tracking-tight mb-6">
              Tối ưu hóa
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                hiệu suất
              </span>
              <br />
              của bạn.
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Theo dõi bài tập, dinh dưỡng và tiến trình với sự hỗ trợ của AI Coach thông minh.
            </p>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-8 pb-4">
            {[
              { value: '50K+', label: 'Người dùng' },
              { value: '2M+', label: 'Buổi tập' },
              { value: '98%', label: 'Hài lòng' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-white font-bold text-xl">{stat.value}</div>
                <div className="text-slate-500 text-xs mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-6 sm:p-10 relative">
        <div className="absolute inset-0 bg-[#1a1b2e]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-600/30 to-transparent lg:hidden" />

        <div className="relative z-10 w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-white font-bold text-lg">GymTrack</span>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
