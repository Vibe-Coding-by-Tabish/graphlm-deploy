"use client"
import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function SignInButton() {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push('/signin')}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white px-5 py-2 rounded-full font-medium cursor-pointer transition-colors shadow-sm"
      aria-label="Sign in"
    >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        Sign In
      </button>
  );
}

export function SignOutButton({ variant = "dropdown" }) {
  const baseClasses = "text-sm text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-50 cursor-pointer transition-colors";
  const variantClasses = {
    dropdown: "block w-full text-left px-4 py-2",
    inline: "inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-teal-400 text-white px-5 py-2 rounded-full font-medium cursor-pointer transition-colors shadow-sm"
  };

  return (
    <button
      onClick={() => signOut()}
      className={variant === "inline" ? variantClasses.inline : `${baseClasses} ${variantClasses.dropdown}`}
      aria-label="Sign out"
    >
      {variant === "inline" ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
          Sign Out
        </>
      ) : (
        <>Sign out</>
      )}
    </button>
  );
}

export function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") return <p>Loading...</p>;
  if (session) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-sm">Signed in as {session.user?.email}</div>
        <SignOutButton />
      </div>
    );
  }

  // When not signed in, don't render a second sign-in CTA. The hero primary
  // CTA should be the standalone <SignInButton /> placed in the layout.
  return null;
}

export function GetStartedButton() {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.push('/signin')}
      className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full cursor-pointer font-medium transition-colors shadow-sm"
      aria-label="Get started"
    >
      Get Started
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export function HeaderAuth() {
  const { data: session, status } = useSession();

  if (status === "loading") return <div className="w-24 h-9 bg-gray-200 rounded-lg animate-pulse"></div>;

  if (session) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {session.user?.image ? (
              <img 
                src={session.user.image} 
                alt="Profile" 
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <span className="text-xs font-medium text-gray-600">
                {(session.user?.name || session.user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-gray-900">
              {session.user?.name || 'User'}
            </div>
            <div className="text-xs text-gray-500">
              {session.user?.email}
            </div>
          </div>
        </div>
        <SignOutButton variant="inline" />
      </div>
    );
  }

  return <SignInButton />;
}