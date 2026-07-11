import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { SessionProvider } from 'next-auth/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { RuntimeConfigProvider } from '@/components/providers/runtime-config-provider';
import { BrandProvider } from '@/components/layout/brand-provider';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const authEnabled = process.env.AUTH_ENABLED === 'true';

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = (await import(`../../../messages/${locale}.json`)).default;

  const content = (
      <RuntimeConfigProvider authEnabled={authEnabled}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <BrandProvider>
            <TooltipProvider>
              {children}
              <Toaster />
            </TooltipProvider>
          </BrandProvider>
        </ThemeProvider>
      </NextIntlClientProvider>
    </RuntimeConfigProvider>
  );

  return authEnabled ? <SessionProvider>{content}</SessionProvider> : content;
}
