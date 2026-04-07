import { Phone } from "lucide-react";
// Reativar newsletter / redes: FormEvent + ícones
// import type { FormEvent } from "react";
// import { ArrowRight, Instagram, Music2, Phone, Youtube } from "lucide-react";
import { cdnPublicAsset } from "@/lib/cdn";

const footerLinks = [
  { label: "Cursos", href: "/cursos", external: false },
  { label: "Contato", href: "https://edengrupo.com.br/contato", external: true },
  // Reativar depois — termos e política
  // { label: "Termos de Uso", href: "https://edengrupo.com.br/termos-de-uso", external: true },
  // { label: "Política de Privacidade", href: "https://edengrupo.com.br/politica-de-privacidade", external: true },
];

// Reativar depois — redes sociais
// const socialLinks = [
//   { label: "Instagram", href: "https://www.instagram.com/", icon: Instagram },
//   { label: "Site Institucional", href: "https://edengrupo.com.br", icon: ArrowRight },
//   { label: "TikTok", href: "https://www.tiktok.com/", icon: Music2 },
//   { label: "YouTube", href: "https://www.youtube.com/", icon: Youtube },
// ];

// Reativar depois — newsletter (Mautic + Turnstile)
// const MAUTIC_FORM_ACTION = import.meta.env.VITE_MAUTIC_FORM_ACTION?.trim();
// const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim();
// const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
//
// if (TURNSTILE_SITE_KEY && typeof document !== "undefined" && !document.getElementById(TURNSTILE_SCRIPT_ID)) {
//   const script = document.createElement("script");
//   script.id = TURNSTILE_SCRIPT_ID;
//   script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
//   script.async = true;
//   script.defer = true;
//   document.head.appendChild(script);
// }

export function AppFooter() {
  // Reativar depois — newsletter
  // const handleNewsletterSubmit = (event: FormEvent<HTMLFormElement>) => {
  //   if (!MAUTIC_FORM_ACTION) {
  //     event.preventDefault();
  //   }
  // };

  return (
    <footer className="border-t bg-[#363A36] text-white">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 md:px-6 md:py-12">
        <section className="overflow-hidden rounded-3xl border bg-card text-black shadow-sm">
          <div className="grid gap-4 md:grid-cols-[1fr_320px] lg:grid-cols-[1fr_420px]">
            <div className="px-6 py-8 md:px-10">
              <p className="text-sm font-medium text-primary">Faça Parte</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
                Junte-se a Éden Grupo 
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-black/80 md:text-base">
              Faça parte do Éden Grupo e leve uma farmácia sólida e estruturada para a sua região. Oferecemos um modelo de negócio validado, suporte operacional completo e oportunidades reais de crescimento dentro de uma rede em constante expansão.
              </p>
              <a
                href="tel:+551135148707"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                <Phone className="h-4 w-4" />
                (11) 3514-8707
              </a>
            </div>

            <div className="relative hidden h-full md:block">
              <img
                src={cdnPublicAsset("assets/eva-footer.png")}
                alt="Equipe Éden Grupo"
                className="h-full w-full object-cover object-center"
                draggable={false}
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-card via-card/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* Layout com 3 colunas ao reativar newsletter: lg:grid-cols-[1.2fr_1fr_1.2fr] e blocos comentados abaixo */}
        <section className="mt-10 grid gap-10 md:grid-cols-2">
          <div>
            <img
              src={cdnPublicAsset("assets/eden-logo-black.png")}
              alt="Éden Educação"
              className="h-10 w-auto select-none"
              draggable={false}
            />
            <p className="mt-3 max-w-sm text-sm text-white/80">
              Ecossistema de educação e desenvolvimento profissional para acelerar resultados no varejo farmacêutico.
            </p>
          </div>

          <div>
            {/* Reativar depois — grid de duas colunas no tablet: className="grid gap-8 sm:grid-cols-2" */}
            <nav aria-label="Links do rodapé">
              <h3 className="text-sm font-semibold">Menu</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {footerLinks.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noreferrer" : undefined}
                      className="transition-colors hover:text-black"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Reativar depois — redes sociais
            <nav aria-label="Redes sociais">
              <h3 className="text-sm font-semibold">Redes sociais</h3>
              <ul className="mt-3 space-y-2 text-sm text-white/80">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 transition-colors hover:text-black"
                      >
                        <Icon className="h-4 w-4" />
                        {social.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
            */}
          </div>

          {/* Reativar depois — newsletter
          <div>
            <h3 className="text-sm font-semibold">Newsletter</h3>
            <p className="mt-2 text-sm text-white/80">
              Receba novidades, conteúdos e atualizações comerciais por e-mail.
            </p>

            <form
              className="mt-4 space-y-3"
              action={MAUTIC_FORM_ACTION || undefined}
              method="post"
              onSubmit={handleNewsletterSubmit}
            >
              <input
                name="email"
                type="email"
                required
                placeholder="Seu melhor e-mail"
                className="h-11 w-full rounded-full border bg-white px-4 text-sm text-black outline-none ring-offset-background placeholder:text-black/60 focus-visible:ring-2 focus-visible:ring-ring"
              />

              <label className="flex items-start gap-2 text-xs text-white/80">
                <input type="checkbox" name="accepted_marketing_terms" required className="mt-0.5 h-4 w-4 rounded" />
                <span>
                  Li e aceito receber comunicações de email marketing da Éden Grupo conforme a Política de
                  Privacidade.
                </span>
              </label>

              {TURNSTILE_SITE_KEY ? (
                <div className="cf-turnstile" data-sitekey={TURNSTILE_SITE_KEY} />
              ) : (
                <p className="text-xs text-white/80">Configure `VITE_TURNSTILE_SITE_KEY` para habilitar o captcha.</p>
              )}

              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
              >
                Inscrever na newsletter
              </button>

              {!MAUTIC_FORM_ACTION ? (
                <p className="text-xs text-white/80">
                  Configure `VITE_MAUTIC_FORM_ACTION` para enviar os dados para o formulário do Mautic.
                </p>
              ) : null}
            </form>
          </div>
          */}
        </section>

        <div className="mt-10 border-t pt-5 text-xs text-white/80">
          <p>© {new Date().getFullYear()} Éden Grupo. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
