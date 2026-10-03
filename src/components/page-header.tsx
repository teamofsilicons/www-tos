import type { JSX } from "solid-js";

export function PageHeader(props: { eyebrow: string; title: string; children?: JSX.Element }) {
  return (
    <header class="px-4 pb-12 pt-32 sm:px-8 sm:pt-40">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-5">
        <p class="font-pixel-square text-sm uppercase tracking-tight text-muted-fg">
          {props.eyebrow}
        </p>
        <h1 class="font-serif max-w-3xl text-4xl font-normal leading-[1.12] text-[#1F5CB1] md:text-5xl lg:text-6xl">
          {props.title}
        </h1>
        {props.children}
      </div>
    </header>
  );
}
