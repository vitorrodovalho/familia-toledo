const timeline = [
  ["1466", "Almagro, Espanha", "Gonçalo Díaz de Toledo"],
  ["1510", "Almagro, Espanha", "Juan de Toledo Pisa"],
  ["1547", "Chiapas e Oaxaca, México", "Juan Castelhanos de Pisa"],
  ["1612", "Ilha Terceira, Açores", "Simão de Toledo Pisa"],
  ["1642", "São Paulo, Brasil", "João de Toledo Castelhanos"],
  ["1787", "Jundiaí, Brasil", "Simão de Toledo Rodovalho"],
  ["1870", "Limeira, Brasil", "Ramo Toledo Rodovalho"],
  ["2025", "Limeira, Brasil", "15ª geração documentada"],
];

export default function AboutPage() {
  return (
    <section className="min-h-[calc(100vh-4rem)] bg-[#f4efe7] px-3 py-5 text-[#111111] md:px-6">
      <article className="mx-auto max-w-5xl border border-[#cfc5b2] bg-[#fffdf8] px-5 py-8 shadow-[0_18px_45px_rgba(63,46,25,0.12)] md:px-12 md:py-12">
        <header className="border-b border-[#ddd4c3] pb-8 text-center">
          <p className="text-sm font-semibold text-[#111111]">2</p>
          <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-[#111111] md:text-5xl">
            História
          </h1>
          <p className="mt-3 font-serif text-2xl font-semibold text-[#b80000]">
            Origem e trajetória da família Toledo
          </p>
        </header>

        <div className="mx-auto mt-8 max-w-3xl space-y-5 text-[15px] leading-relaxed text-[#1f1b16]">
          <p>
            O sobrenome Toledo tem origem geográfica, ligado à cidade de Toledo,
            na Espanha. A tradição apresentada no livro relaciona o nome ao
            período de reconquista da cidade por D. Afonso VI, quando um capitão
            chamado Pedro teria recebido terras na região e passado a usar o
            apelido Toledo.
          </p>

          <p>
            A trajetória familiar descrita no livro passa por Espanha, Portugal,
            México, Açores e Brasil. Juan de Toledo Pisa aparece ligado à região
            de Oaxaca, na Nova Espanha, onde se estabeleceu com Anna
            Castelhanos. A pesquisa também destaca o registro açoriano de
            casamento que conecta a família Toledo Pisa à família Rodovalho na
            Ilha Terceira.
          </p>

          <p>
            Juan Castelhanos de Pisa participou da batalha da Ilha Terceira, em
            1583, na armada comandada pelo marquês de Santa Cruz. Depois da
            passagem pelos Açores, Simão de Toledo Pisa seguiu a carreira
            militar e iniciou a colonização da família Toledo no Brasil no século
            XVII.
          </p>

          <p>
            O ramo Toledo Rodovalho se consolida no interior paulista, com
            presença em Jundiaí, Campinas, Americana e Limeira. Segundo a
            genealogia, João, Bento e José de Toledo Rodovalho fixaram-se em
            Limeira em 1870, dando continuidade ao ramo que chega ao livro de
            2025 com descendentes da 15ª geração.
          </p>
        </div>

        <section className="mx-auto mt-10 max-w-3xl border-t border-[#ddd4c3] pt-6">
          <h2 className="font-serif text-2xl font-semibold text-[#111111]">
            Linha do tempo
          </h2>
          <div className="mt-4 divide-y divide-[#ddd4c3] border-y border-[#ddd4c3]">
            {timeline.map(([year, place, event]) => (
              <div
                key={`${year}-${event}`}
                className="grid gap-2 py-3 text-sm md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1.2fr)]"
              >
                <span className="font-semibold text-[#b80000]">{year}</span>
                <span>{place}</span>
                <span className="font-semibold text-[#004eea]">{event}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className="mx-auto mt-10 max-w-3xl border-t border-[#ddd4c3] pt-5 text-sm text-[#5d5344]">
          Fonte: Genealogia da família Toledo Rodovalho, 1466 a 2025, de
          Geraldo Mario Toledo Rodovalho.
        </footer>
      </article>
    </section>
  );
}
