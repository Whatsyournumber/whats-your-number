// ============= Full file contents =============

import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

import contactAvatar from '@/assets/contact-avatar.png'
import { SiteHeader } from '@/components/site-header'
import { useT } from '@/hooks/use-language'
import { cn } from '@/lib/utils'

const COPY_REVEAL_AT = 520

export function HomeNavigation() {
  const t = useT()
  const reduced = useReducedMotion()
  const [scrolled, setScrolled] = useState(false)
  const [showCopy, setShowCopy] = useState(false)

  useEffect(() => {
    const update = () => {
      setScrolled(window.scrollY > 24)
      setShowCopy(window.scrollY > COPY_REVEAL_AT)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  const slide = reduced ? 0 : 18

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
        className="home-contact-link group fixed bottom-6 right-6 z-40 hidden lg:block"
      >
        <AnimatePresence initial={false}>
          {showCopy && (
            <motion.span
              key="home-contact-copy"
              initial={{ opacity: 0, x: slide, y: '-50%', scale: 0.96 }}
              animate={{ opacity: 1, x: 0, y: '-50%', scale: 1 }}
              exit={{ opacity: 0, x: slide, y: '-50%', scale: 0.96 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="contact-bubble absolute right-16 top-1/2 flex items-center gap-2.5 whitespace-nowrap rounded-xl py-2.5 pl-4 pr-4"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                className="contact-sparkle absolute -left-1.5 -top-2.5 size-5 text-positive"
              >
                <path d="M14.6 3.4 L16 7.4" />
                <path d="M8.4 8.2 L11.6 11.2" />
                <path d="M3 14.6 L7.1 15.8" />
              </svg>
              <span>
                <span className="block text-[15px] font-bold leading-tight tracking-tight">
                  {t('¿Tienes dudas?', 'Any questions?')}
                </span>
                <span className="block text-[12px] leading-tight opacity-60">
                  {t('Estamos aquí para ayudarte', 'We’re here to help')}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="absolute right-0 top-1/2 size-2.5 -translate-y-1/2 rotate-45 bg-white"
              />
            </motion.span>
          )}
        </AnimatePresence>
        <span className="relative flex size-14 items-center justify-center">
          <span
            aria-hidden="true"
            className="contact-avatar-halo absolute -inset-3 rounded-full"
          />
          <span
            aria-hidden="true"
            className="contact-avatar-sheen absolute -inset-2 rounded-full"
          />
          <span className="contact-avatar-frame relative flex size-12 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-[1.04] motion-reduce:transition-none">
            <img
              src={contactAvatar}
              alt=""
              loading="lazy"
              width={816}
              height={816}
              className="size-10 rounded-full object-cover"
            />
          </span>
        </span>
      </Link>
    </>
  )
}
