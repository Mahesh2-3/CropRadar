import LoginForm from '@/components/LoginForm';

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const requestedPath = Array.isArray(next) ? next[0] : next;
  const redirectTo =
    requestedPath?.startsWith('/') && !requestedPath.startsWith('//') && !requestedPath.startsWith('/login')
      ? requestedPath
      : '/';

  return <LoginForm redirectTo={redirectTo} />;
}