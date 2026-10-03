import { For } from "solid-js";

const clients = ["Pawaac Drones", "Break Into VC", "Digitea", "Siddhannam", "Wock Oliver"];

export function ClientsBar() {
  return (
    <section class="flex min-h-[40vh] flex-col justify-center border-t-[0.5px] border-border px-4 py-16 sm:px-8">
      <div class="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <h2 class="font-pixel-square text-lg uppercase tracking-tight">Deployed at</h2>
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <For each={clients}>
            {(name) => (
              <div class="flex min-h-16 w-full items-center justify-center rounded-lg bg-[#F2F3EB] p-3 sm:min-h-20 sm:p-4">
                <span class="text-center text-xs font-medium text-foreground/75 sm:text-sm">
                  {name}
                </span>
              </div>
            )}
          </For>
        </div>
      </div>
    </section>
  );
}
