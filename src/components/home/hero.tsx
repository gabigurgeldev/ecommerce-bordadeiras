"use client";

import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-24 pt-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-500/20 via-transparent to-transparent" />
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-rose-200 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Premium para ateliês e indústria
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Bordado de{" "}
            <span className="bg-gradient-to-r from-rose-300 to-amber-200 bg-clip-text text-transparent">
              excelência
            </span>
            , do ateliê à produção.
          </h1>
          <p className="mt-6 max-w-lg text-lg text-zinc-300">
            {siteConfig.description}
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <Link href="/loja">
                Explorar loja
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/sobre">Conheça a marca</Link>
            </Button>
          </div>
        </motion.div>
        <motion.div
          className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/20 shadow-2xl shadow-rose-900/30"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.15 }}
        >
          <Image
            src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1400&q=80"
            alt="Máquina de bordado profissional"
            fill
            className="object-cover"
            priority
            sizes="(max-width:1024px) 100vw, 50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/60 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
