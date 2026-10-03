import { A } from "@solidjs/router";

export function Footer() {
  return (
    <footer class="border-t-[0.5px] border-border px-4 py-10 sm:px-8">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <p class="font-pixel-square text-sm text-muted-fg">
          © {new Date().getFullYear()} Team of Silicons
        </p>
        <div class="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-fg">
          <A href="/products" class="hover:text-foreground">
            Products
          </A>
          <A href="/writings" class="hover:text-foreground">
            Writings
          </A>
          <a
            href="https://github.com/teamofsilicons"
            target="_blank"
            rel="noopener noreferrer"
            class="hover:text-foreground"
          >
            GitHub
          </a>
          <a href="mailto:hello@teamofsilicons.com" class="hover:text-foreground">
            hello@teamofsilicons.com
          </a>
        </div>
      </div>
    </footer>
  );
}
