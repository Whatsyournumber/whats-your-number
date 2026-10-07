import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { MessageCircle } from 'lucide-react'

import { SiteHeader } from '@/components/site-header'
import { Button } from '@/components/ui/button'
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
          'absolute inset-x-0 top-0 z-30 lg:fixed lg:transition-colors lg:duration-200 motion-reduce:transition-none',
          scrolled && 'lg:border-b lg:border-border/50 lg:bg-background/70 lg:backdrop-blur-xl',
        )}
      >
        <SiteHeader />
      </div>
      <Button
        asChild
        variant="ghost"
        className="home-contact-link group fixed bottom-8 right-8 z-40 hidden h-auto gap-4 rounded-none p-0 hover:bg-transparent lg:inline-flex"
      >
        <Link to="/contacto" aria-label={t('Atención al cliente: Contacto', 'Customer support: Contact')}>
          <span className="relative rounded-lg border border-border bg-popover px-5 py-3 text-base font-medium text-popover-foreground transition-colors group-hover:border-primary motion-reduce:transition-none">
            {t('Hablemos', 'Let’s connect')}
            <span aria-hidden="true" className="absolute -right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 border-r border-t border-border bg-popover transition-colors group-hover:border-primary motion-reduce:transition-none" />
          </span>
          <span className="grid h-16 w-16 place-items-center rounded-full border border-border bg-background text-foreground ring-2 ring-border/60 ring-offset-2 ring-offset-background transition-colors group-hover:border-primary group-hover:text-primary motion-reduce:transition-none">
            <MessageCircle aria-hidden="true" className="size-8" strokeWidth={1.5} />
          </span>
        </Link>
      </Button>
    </>
  )
}