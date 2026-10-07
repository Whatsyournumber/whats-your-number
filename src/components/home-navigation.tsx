import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'

import contactAvatar from '@/assets/contact-avatar.png'
import { SiteHeader } from '@/components/site-header'
import { useT } from '@/hooks/use-language'
import { cn } from '@/lib/utils'

export function HomeNavigation() {
  const t = useT()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 24)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <>
      <div
        data-home-navigation
        className={cn(
          'fixed inset-x-0 top-0 z-30 transition-colors duration-200 motion-reduce:transition-none',
          scrolled && 'border-b border-border/50 bg-background/70 backdrop-blur-xl',
        )}
      >
        <SiteHeader />
      </div>
      <Link
        to="/contacto"
        aria-label={t('Atención al cliente: Contacto', 'Customer support: Contact')}
        className="home-contact-link group fixed bottom-8 right-8 z-40 hidden items-center gap-4 lg:flex"
      >
        <span className="contact-bubble relative rounded-2xl py-4 pl-7 pr-7 shadow-xl shadow-black/30 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
          <svg
            aria-hidden="true"
            viewBox="0 0 22 22"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            className="absolute -left-1 top-2.5 size-5 text-positive"
          >
            <path d="M15 4 L13 9" />
            <path d="M9.5 5.5 L10 10" />
            <path d="M4.5 9 L7 12" />
          </svg>
          <span className="block text-lg font-bold leading-tight tracking-tight">
            {t('¿Tienes dudas?', 'Any questions?')}
          </span>
          <span className="block text-base opacity-60">
            {t('Estamos aquí para ayudarte', 'We’re here to help')}
          </span>
          <span
            aria-hidden="true"
            className="absolute -right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 rotate-45 bg-white"
          />
        </span>
        <span className="relative flex size-28 items-center justify-center">
          <span
            aria-hidden="true"
            className="contact-avatar-halo absolute -inset-1.5 rounded-full"
          />
          <span
            aria-hidden="true"
            className="absolute inset-0 rounded-full bg-background ring-1 ring-border/60"
          />
          <img
            src={contactAvatar}
            alt=""
            loading="lazy"
            width={816}
            height={816}
            className="relative size-24 rounded-full object-cover ring-2 ring-background"
          />
        </span>
      </Link>
    </>
  )
}
