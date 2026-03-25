export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex-1 w-full bg-[#050505]">
      {children}
    </div>
  );
}
