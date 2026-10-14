import Image from "next/image";

export function HeroSection() {
  return (
    <section className="bg-white px-4 py-2 sm:px-6 sm:py-3 lg:px-8">
      <div className="mx-auto max-w-7xl overflow-hidden">
        <Image
          src="/banner.jpeg"
          alt="A happy baby with a selection of baby essentials"
          width={1280}
          height={451}
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="block h-auto w-full"
        />
      </div>
    </section>
  );
}
