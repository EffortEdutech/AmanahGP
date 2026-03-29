// apps/admin/components/auth/auth-card.tsx
// AmanahHub Console — Auth page wrapper

interface AuthCardProps {
  title:     string;
  subtitle?: string;
  children:  React.ReactNode;
}

export function AuthCard({ title, subtitle, children }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl
                          bg-emerald-700 text-white text-xl font-bold mb-4">
            A
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">{subtitle}</p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 px-8 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
