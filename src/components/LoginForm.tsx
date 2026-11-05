'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Leaf, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { signInWithGoogle } from '@/lib/firebase/service';

export default function LoginForm({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const { language } = useLanguage();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      await signInWithGoogle();
      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      console.warn('Google sign-in failed:', error);
      const code = (error as { code?: string })?.code;
      const message = error instanceof Error ? error.message : '';
      setErrorMessage(
        message.includes('Server Firebase Admin credentials')
          ? 'Secure server sign-in is not configured. Add the Firebase Admin credentials to the server environment.'
          : code === 'auth/unauthorized-domain'
            ? 'Add this site to Firebase Authentication authorized domains.'
            : code === 'auth/operation-not-allowed'
              ? 'Enable Google sign-in in Firebase Authentication.'
              : code === 'auth/popup-blocked'
                ? 'Allow pop-ups for this site and try again.'
                : 'Google sign-in failed. Check Firebase Authentication settings and try again.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const isTelugu = language === 'te';

  return (
    <main className="min-h-screen bg-[#f4f7f1] text-stone-900 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 lg:block">
        <Image
          src="/samples/paddy_blast.jpg"
          alt="Rice leaf being examined for crop disease"
          fill
          priority
          sizes="55vw"
          className="object-cover opacity-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-emerald-950/20 to-emerald-950/10" />
        <div className="absolute inset-x-0 bottom-0 p-12 text-white">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-lime-300 text-emerald-950">
            <Leaf className="h-6 w-6" />
          </div>
          <p className="text-xs font-bold uppercase text-lime-300">
            {isTelugu ? 'ఆంధ్రప్రదేశ్ రైతుల కోసం' : 'For farmers across Andhra Pradesh'}
          </p>
          <h1 className="mt-3 max-w-xl text-4xl font-black leading-tight">
            {isTelugu ? 'మీ పంట. మీ పొలం. మీ నిర్ణయం.' : 'Your crop. Your farm. Your next decision.'}
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-emerald-50/85">
            {isTelugu
              ? 'మీ పొలం వాతావరణం, పంట ఆరోగ్యం, మరియు స్థానిక హెచ్చరికలు ఒకే చోట.'
              : 'Local weather, crop health, and nearby alerts, brought together for your farm.'}
          </p>
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-12 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-lime-300">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-sm font-black tracking-wide">CROP RADAR</span>
          </div>

          <div className="mb-10 flex items-center gap-2 text-emerald-800">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-lime-300">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="text-sm font-black tracking-wide">CROP RADAR</span>
          </div>

          <p className="text-xs font-bold uppercase text-emerald-700">
            {isTelugu ? 'రైతు ఖాతా' : 'Farmer account'}
          </p>
          <h2 className="mt-2 text-3xl font-black leading-tight text-stone-950">
            {isTelugu ? 'తిరిగి స్వాగతం' : 'Welcome back'}
          </h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {isTelugu
              ? 'మీ పొలం వివరాలు మరియు వ్యక్తిగత పంట సూచనలను తెరవడానికి సైన్ ఇన్ చేయండి.'
              : 'Sign in to access your farm profile and personalized crop guidance.'}
          </p>

          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-lg bg-emerald-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-70"
          >
            {isSigningIn ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-black text-emerald-900">G</span>
            )}
            <span>
              {isTelugu ? 'Googleతో కొనసాగించండి' : 'Continue with Google'}
            </span>
          </button>

          {errorMessage && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm leading-5 text-red-800">
              {errorMessage}
            </p>
          )}

          <div className="mt-7 flex items-start gap-2 border-t border-stone-200 pt-5 text-xs leading-5 text-stone-500">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
            <p>
              {isTelugu
                ? 'మీ పొలం వివరాలు మీ ఖాతాలోనే భద్రంగా ఉంటాయి.'
                : 'Your farm profile is private to your account and protected by Firebase authentication.'}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}