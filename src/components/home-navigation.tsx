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
        className="home-contact-link group fixed bottom-6 right-6 z-40 hidden items-center gap-2.5 lg:flex"
      >
        <span className="contact-bubble relative rounded-xl py-2 pl-3.5 pr-4 transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transition-none">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            className="contact-sparkle absolute -left-1.5 -top-2 size-5 text-positive"
          >
            <path d="M14.6 3.4 L16 7.4" />
            <path d="M8.4 8.2 L11.6 11.2" />
            <path d="M3 14.6 L7.1 15.8" />
          </svg>
          <span className="block text-[13px] font-bold leading-tight tracking-tight">
            {t('¿Tienes dudas?', 'Any questions?')}
          </span>
          <span className="block text-[11px] leading-tight opacity-60">
            {t('Estamos aquí para ayudarte', 'We’re here to help')}
          </span>
          <span
            aria-hidden="true"
            className="absolute -right-1 top-1/2 size-2 -translate-y-1/2 rotate-45 bg-white"
          />
        </span>
        <span className="relative flex size-12 items-center justify-center">
          <span
            aria-hidden="true"
            className="contact-avatar-halo absolute -inset-3 rounded-full"
          />
          <span
            aria-hidden="true"
            className="contact-avatar-sheen absolute -inset-2 rounded-full"
          />
          <span className="contact-avatar-frame relative flex size-11 items-center justify-center rounded-full">
            <img
              src={contactAvatar}
              alt=""
              loading="lazy"
              width={816}
              height={816}
              className="size-9 rounded-full object-cover"
            />
          </span>
        </span>
      </Link>
    </>
  )
}
